import { redirect } from "next/navigation";

import { MobileDashboardNav } from "@/features/dashboard/components/MobileDashboardNav";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { SoaAdvanceRunPrompt } from "@/features/dashboard/soa/components/SoaAdvanceRunPrompt";
import { ROUTES } from "@/config/routes";
import { auth } from "@/lib/auth/auth-config";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect(ROUTES.login);

  return (
    <div className="brand-page-bg relative flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar user={session.user} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <MobileDashboardNav user={session.user} />
        <main className="scrollbar-thin min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
            {children}
          </div>
        </main>
      </div>
      <SoaAdvanceRunPrompt />
    </div>
  );
}
