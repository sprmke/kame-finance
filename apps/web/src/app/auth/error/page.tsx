import Link from "next/link";

import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { authErrorMessage } from "@/lib/auth/auth-error-message";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthPageShell
      title="Authentication error"
      description={authErrorMessage(error)}
    >
      <Button asChild className="w-full">
        <Link href={ROUTES.login}>Back to sign in</Link>
      </Button>
    </AuthPageShell>
  );
}
