import { redirect } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { AppRail } from "@/features/dashboard/components/shell/AppRail";
import { AppTabBar } from "@/features/dashboard/components/shell/AppTabBar";
import { AppTopBar } from "@/features/dashboard/components/shell/AppTopBar";
import { QuickActionsProvider } from "@/features/dashboard/components/shell/QuickActionsProvider";
import { SoaAdvanceRunPrompt } from "@/features/dashboard/soa/components/SoaAdvanceRunPrompt";
import { auth } from "@/lib/auth/auth-config";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect(ROUTES.login);

  const user = { name: session.user.name, email: session.user.email };

  return (
    <QuickActionsProvider>
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh">
        <AppRail user={user} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopBar user={user} />
          <main
            id="main"
            className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-12"
          >
            <div className="mx-auto w-full max-w-page px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
        <AppTabBar />
      </div>
      <SoaAdvanceRunPrompt />
    </QuickActionsProvider>
  );
}
