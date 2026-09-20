import { google } from "googleapis";

import { env } from "@/env";
import { googleOAuthRedirectUri } from "@/lib/auth/google-oauth-uri";
import {
  googleAccessTokenNeedsRefresh,
  mergeGoogleTokenCredentials,
  type GoogleTokenCredentials,
} from "@/lib/google/google-tokens";

/** True when Google OAuth refresh failed (expired / revoked token, wrong client, etc.). */
export function isInvalidGrantError(err: unknown): boolean {
  const s =
    err instanceof Error
      ? `${err.message}\n${(err as NodeJS.ErrnoException).code ?? ""}`
      : String(err);
  if (/invalid_grant/i.test(s)) return true;
  const g = err as {
    response?: { data?: { error?: string; error_description?: string } };
  };
  const d = g.response?.data;
  if (d?.error === "invalid_grant") return true;
  if (
    typeof d?.error_description === "string" &&
    /invalid_grant/i.test(d.error_description)
  ) {
    return true;
  }
  return false;
}

export function formatGoogleAuthError(err: unknown): string {
  if (!isInvalidGrantError(err)) {
    return err instanceof Error ? err.message : String(err);
  }
  return [
    "Google OAuth failed: invalid_grant (refresh token expired, revoked, or not valid for this OAuth client).",
    "Fix: reconnect Gmail from the Kame Finance reconnect dialog or Settings.",
    "Ensure the Google Cloud OAuth client redirect URI matches your app URL + /api/auth/callback/google.",
  ].join("\n");
}

function readTokenCredentials():
  | (GoogleTokenCredentials & Record<string, unknown>)
  | null {
  const tokenJson = process.env.GMAIL_TOKEN_JSON;
  if (!tokenJson) return null;
  try {
    const raw = JSON.parse(tokenJson) as Record<string, unknown>;
    return {
      ...raw,
      access_token:
        typeof raw.access_token === "string" ? raw.access_token : undefined,
      refresh_token:
        typeof raw.refresh_token === "string" ? raw.refresh_token : undefined,
      expiry_date:
        typeof raw.expiry_date === "number" ? raw.expiry_date : undefined,
      token_type:
        typeof raw.token_type === "string" ? raw.token_type : undefined,
      scope: typeof raw.scope === "string" ? raw.scope : undefined,
    };
  } catch {
    return null;
  }
}

function writeTokenCredentials(
  tokens: GoogleTokenCredentials & Record<string, unknown>,
): void {
  process.env.GMAIL_TOKEN_JSON = JSON.stringify(tokens);
}

async function persistRotatedGoogleTokens(
  tokens: GoogleTokenCredentials & Record<string, unknown>,
): Promise<void> {
  writeTokenCredentials(tokens);
  const userId = tokens.userId;
  const googleAccountId = tokens.googleAccountId;
  if (typeof userId !== "string" || typeof googleAccountId !== "string") {
    return;
  }
  const { gmailService } = await import("@/server/services/gmail.service");
  await gmailService.persistTokensForAccount(userId, googleAccountId, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    token_type: tokens.token_type,
    scope: tokens.scope,
  });
}

/** Shared OAuth2 client for Gmail and Google Calendar (tokens from gmail.service bridge). */
export async function createGoogleOAuth2Client() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured.",
    );
  }

  const tokens = readTokenCredentials();
  if (!tokens) {
    throw new Error(
      "Gmail is not connected. Sign in with Google to grant Gmail and Calendar access.",
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    googleOAuthRedirectUri(),
  );
  oauth2Client.setCredentials(tokens);

  let stored = tokens;
  oauth2Client.on("tokens", (credentials) => {
    stored = mergeGoogleTokenCredentials(stored, credentials);
    void persistRotatedGoogleTokens(stored);
  });

  try {
    if (googleAccessTokenNeedsRefresh(tokens)) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      stored = mergeGoogleTokenCredentials(tokens, credentials);
      oauth2Client.setCredentials(stored);
      await persistRotatedGoogleTokens(stored);
    }
  } catch (e) {
    throw new Error(formatGoogleAuthError(e));
  }

  return oauth2Client;
}
