"use client";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { ROUTES } from "@/config/routes";

import { AccountMenu, type ShellUser } from "./AccountMenu";
import { QuickActionsMenu } from "./QuickActionsMenu";

/** Phone and tablet top bar (< 1024px). */
export function AppTopBar({ user }: { user: ShellUser }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-2 pl-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden">
      <div className="min-w-0 flex-1">
        <BrandLogo href={ROUTES.dashboard.root} size="sm" />
      </div>
      <QuickActionsMenu variant="icon" />
      <AccountMenu user={user} variant="icon" />
    </header>
  );
}
