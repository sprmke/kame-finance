import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { isDevLocalAuthEnabled } from "@/lib/auth/dev-local-auth";

export default function LoginPage() {
  return (
    <AuthPageShell title="Sign in">
      <LoginForm devLocalAuth={isDevLocalAuthEnabled()} />
    </AuthPageShell>
  );
}
