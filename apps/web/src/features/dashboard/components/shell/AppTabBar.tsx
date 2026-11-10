"use client";

import { DashboardNavLinks } from "../DashboardNavLinks";

/** Phone and tablet bottom tab bar (< 1024px). */
export function AppTabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)] z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch px-1">
        <DashboardNavLinks variant="tabbar" />
      </div>
    </nav>
  );
}
