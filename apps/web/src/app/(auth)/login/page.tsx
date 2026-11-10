import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { isDevLocalAuthEnabled } from "@/lib/auth/dev-local-auth";

/** Regenerate daily so the calendar illustration shows the current month. */
export const revalidate = 86400;

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthPageShell title="Sign in">
      <LoginForm devLocalAuth={isDevLocalAuthEnabled()} />
    </AuthPageShell>
  );
}
