"use client";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { ROUTES } from "@/config/routes";

import { DashboardNavLinks } from "../DashboardNavLinks";
import { AccountMenu, type ShellUser } from "./AccountMenu";
import { QuickActionsMenu } from "./QuickActionsMenu";

/** Desktop left rail (≥ 1024px). */
export function AppRail({ user }: { user: ShellUser }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center px-4">
        <BrandLogo href={ROUTES.dashboard.root} size="sm" />
      </div>
      <div className="px-3 pb-3">
        <QuickActionsMenu variant="rail" />
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 px-3">
        <DashboardNavLinks variant="rail" />
      </nav>
      <div className="border-t border-sidebar-border p-2">
        <AccountMenu user={user} variant="rail" />
      </div>
    </aside>
  );
}
