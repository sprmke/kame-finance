import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { eq } from "drizzle-orm";

import { env } from "@/env";
import { ROUTES } from "@/config/routes";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { AUTH_SESSION } from "@/lib/auth/auth-session";
import {
  DEV_LOCAL_AUTH_EMAIL,
  DEV_LOCAL_AUTH_PROVIDER_ID,
  isDevLocalAuthEnabled,
} from "@/lib/auth/dev-local-auth";
import { GOOGLE_LOGIN_AUTHORIZATION_PARAMS } from "@/lib/auth/google-oauth-params";
import { gmailService } from "@/server/services/gmail.service";

const googleProviders =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: GOOGLE_LOGIN_AUTHORIZATION_PARAMS,
          },
        }),
      ]
    : [];

const devLocalProvider = isDevLocalAuthEnabled()
  ? [
      Credentials({
        id: DEV_LOCAL_AUTH_PROVIDER_ID,
        name: "Local dev",
        credentials: {},
        async authorize() {
          if (!isDevLocalAuthEnabled()) return null;

          const email = DEV_LOCAL_AUTH_EMAIL;
          let user = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          if (!user) {
            const [created] = await db
              .insert(users)
              .values({
                email,
                name: "Local dev",
                emailVerified: new Date(),
              })
              .returning();
            user = created;
          }

          if (!user) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? "Local dev",
          };
        },
      }),
    ]
  : [];

export const authConfig: NextAuthConfig = {
  providers: [...googleProviders, ...devLocalProvider],
  pages: {
    signIn: ROUTES.login,
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === DEV_LOCAL_AUTH_PROVIDER_ID) {
        return isDevLocalAuthEnabled();
      }
      if (account?.provider !== "google") return false;
      if (!profile?.email) return false;
      return true;
    },
    async jwt({ token, account, profile, user }) {
      if (
        account?.provider === DEV_LOCAL_AUTH_PROVIDER_ID &&
        user?.id &&
        isDevLocalAuthEnabled()
      ) {
        token.sub = user.id;
        token.email = user.email ?? DEV_LOCAL_AUTH_EMAIL;
        return token;
      }

      if (account?.provider === "google" && profile?.email) {
        const email = profile.email.toLowerCase();
        let googleUser = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!googleUser) {
          const [created] = await db
            .insert(users)
            .values({
              email,
              name: profile.name ?? email,
              image: profile.picture ?? null,
              emailVerified: new Date(),
            })
            .returning();
          googleUser = created;
        } else if (!googleUser.emailVerified) {
          await db
            .update(users)
            .set({
              emailVerified: new Date(),
              name: googleUser.name ?? profile.name ?? email,
              image: googleUser.image ?? profile.picture ?? null,
            })
            .where(eq(users.id, googleUser.id));
        }

        if (googleUser) {
          token.sub = googleUser.id;
          token.email = email;
          await gmailService.upsertGoogleAccount(googleUser.id, account, {
            email,
            name: profile.name,
          });
          await gmailService.markGoogleIntegrationsConnected(
            googleUser.id,
            email,
          );
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.email && session.user) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  session: AUTH_SESSION,
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
