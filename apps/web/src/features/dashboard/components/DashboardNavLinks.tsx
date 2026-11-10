"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

import { DASHBOARD_NAV, ROUTES } from "@/config/routes";
import { useNavDataPrefetch } from "@/hooks/use-nav-data-prefetch";
import { cn } from "@/lib/utils/cn";

import { NAV_ICONS } from "./shell/nav-icons";

export function isDashboardNavActive(pathname: string, href: string) {
  if (href === ROUTES.dashboard.root) return pathname === ROUTES.dashboard.root;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavItem = (typeof DASHBOARD_NAV)[number];

function NavIcon({ item, className }: { item: NavItem; className: string }) {
  const { pending } = useLinkStatus();
  const Icon = NAV_ICONS[item.icon];
  return pending ? (
    <Loader2 className={cn(className, "animate-spin")} aria-hidden />
  ) : (
    <Icon className={className} aria-hidden />
  );
}

interface DashboardNavLinksProps {
  variant: "rail" | "tabbar";
  onNavigate?: () => void;
}

export function DashboardNavLinks({ variant, onNavigate }: DashboardNavLinksProps) {
  const pathname = usePathname();
  const prefetchNavData = useNavDataPrefetch();

  return (
    <>
      {DASHBOARD_NAV.map((item) => {
        const active = isDashboardNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={onNavigate}
            onMouseEnter={() => prefetchNavData(item.href)}
            onFocus={() => prefetchNavData(item.href)}
            onTouchStart={() => prefetchNavData(item.href)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "touch-manipulation outline-none transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-ring",
              variant === "rail"
                ? cn(
                    "flex h-10 items-center gap-3 rounded-md border px-2.5 text-sm",
                    active
                      ? "border-sidebar-border bg-card font-bold text-foreground"
                      : "border-transparent font-medium text-sidebar-muted hover:bg-sidebar-accent hover:text-foreground",
                  )
                : cn(
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md pb-1 pt-2 text-2xs",
                    active
                      ? "font-bold text-foreground"
                      : "font-medium text-muted-foreground",
                  ),
            )}
          >
            {variant === "rail" ? (
              <NavIcon item={item} className="h-[18px] w-[18px] shrink-0" />
            ) : (
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-120",
                  active && "bg-foreground text-background",
                )}
              >
                <NavIcon item={item} className="h-[18px] w-[18px]" />
              </span>
            )}
            <span className="truncate">{item.title}</span>
          </Link>
        );
      })}
    </>
  );
}
