"use client";

import Link from "next/link";
import { LogOut, Moon, Settings, Sun } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/config/routes";
import { useHasHydrated } from "@/hooks/use-has-hydrated";
import { cn } from "@/lib/utils/cn";

export type ShellUser = {
  email?: string | null;
  name?: string | null;
};

function initialsFor(user: ShellUser): string {
  const source = user.name?.trim() || user.email?.trim() || "K";
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const letters =
    parts.length > 1 ? `${parts[0]![0]}${parts[1]![0]}` : source.slice(0, 2);
  return letters.toUpperCase();
}

export function AccountMenu({
  user,
  variant,
}: {
  user: ShellUser;
  variant: "rail" | "icon";
}) {
  const hydrated = useHasHydrated();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = hydrated && resolvedTheme === "dark";
  const initials = initialsFor(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2.5 rounded-md text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          variant === "rail"
            ? "w-full px-2 py-2 hover:bg-sidebar-accent"
            : "h-10 w-10 justify-center hover:bg-muted",
        )}
        aria-label="Account"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
          {initials}
        </span>
        {variant === "rail" ? (
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-13 font-semibold">
              {user.name ?? "Account"}
            </span>
            {user.email ? (
              <span className="block truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            ) : null}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === "rail" ? "start" : "end"}
        side={variant === "rail" ? "top" : "bottom"}
        className="w-60"
      >
        <DropdownMenuLabel className="truncate font-normal">
          <span className="block truncate text-13 font-semibold text-foreground">
            {user.name ?? "Account"}
          </span>
          {user.email ? <span className="block truncate">{user.email}</span> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            setTheme(isDark ? "light" : "dark");
          }}
        >
          {isDark ? <Sun /> : <Moon />}
          {isDark ? "Light theme" : "Dark theme"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.dashboard.settings}>
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: ROUTES.login })}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
