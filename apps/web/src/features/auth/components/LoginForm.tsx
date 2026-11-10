"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/icons";
import { ROUTES } from "@/config/routes";
import { DEV_LOCAL_AUTH_PROVIDER_ID } from "@/lib/auth/dev-local-auth";

interface LoginFormProps {
  devLocalAuth?: boolean;
}

export function LoginForm({ devLocalAuth = false }: LoginFormProps) {
  const [loading, setLoading] = useState<"google" | "dev" | null>(null);

  async function handleGoogleSignIn() {
    setLoading("google");
    await signIn("google", { callbackUrl: ROUTES.dashboard.root });
  }

  async function handleDevSignIn() {
    setLoading("dev");
    await signIn(DEV_LOCAL_AUTH_PROVIDER_ID, {
      callbackUrl: ROUTES.dashboard.root,
    });
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        size="lg"
        className="w-full"
        loading={loading === "google"}
        disabled={loading !== null}
        onClick={handleGoogleSignIn}
      >
        <GoogleIcon className="rounded-full bg-white p-0.5" />
        {loading === "google" ? "Redirecting…" : "Continue with Google"}
      </Button>
      {devLocalAuth ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          disabled={loading !== null}
          onClick={handleDevSignIn}
        >
          {loading === "dev" ? "Redirecting…" : "Continue locally"}
        </Button>
      ) : null}
    </div>
  );
}
