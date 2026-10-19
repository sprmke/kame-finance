"use client";

import { LogOut, Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ROUTES } from "@/config/routes";

import { DashboardNavLinks } from "./DashboardNavLinks";

interface MobileDashboardNavProps {
  user: {
    email?: string | null;
    name?: string | null;
  };
}

export function MobileDashboardNav({ user }: MobileDashboardNavProps) {
  const [open, setOpen] = useState(false);
  const accountLabel = user.name ?? user.email ?? "Account";

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-card/95 px-3 backdrop-blur-md md:hidden">
      <BrandLogo href={ROUTES.dashboard.root} size="sm" />
      <div className="flex items-center gap-0.5">
        <ThemeToggle className="h-11 w-11" />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex h-full w-[min(26rem,92vw)] max-w-none flex-col gap-0 border-l p-0 sm:max-w-none"
          >
            <SheetHeader className="space-y-1 border-b border-border px-4 py-3 pr-14 text-left">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <BrandLogo size="sm" />
              <p className="truncate text-sm text-muted-foreground">
                {accountLabel}
              </p>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto p-2">
              <DashboardNavLinks
                variant="mobile"
                onNavigate={() => setOpen(false)}
              />
            </nav>
            <div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Button
                variant="ghost"
                className="h-11 w-full justify-start text-muted-foreground"
                onClick={() => signOut({ callbackUrl: ROUTES.login })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
