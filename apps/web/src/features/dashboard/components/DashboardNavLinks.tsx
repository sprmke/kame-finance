"use client";

import {
  Bell,
  CreditCard,
  FileText,
  LayoutDashboard,
  Loader2,
  Receipt,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

import { DASHBOARD_NAV, ROUTES } from "@/config/routes";
import { useNavDataPrefetch } from "@/hooks/use-nav-data-prefetch";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<(typeof DASHBOARD_NAV)[number]["icon"], LucideIcon> = {
  LayoutDashboard,
  CreditCard,
  FileText,
  Bell,
  Receipt,
  Settings,
};

export function isDashboardNavActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== ROUTES.dashboard.root && pathname.startsWith(`${href}/`)) ||
    (href === ROUTES.dashboard.root && pathname === ROUTES.dashboard.root)
  );
}

interface DashboardNavLinksProps {
  variant: "sidebar" | "mobile";
  onNavigate?: () => void;
}

type NavItem = (typeof DASHBOARD_NAV)[number];

function DashboardNavLinkContent({
  item,
  iconClassName,
}: {
  item: NavItem;
  iconClassName: string;
}) {
  const { pending } = useLinkStatus();
  const Icon = ICONS[item.icon];

  return (
    <>
      {pending ? (
        <Loader2 className={cn(iconClassName, "shrink-0 animate-spin")} aria-hidden />
      ) : (
        <Icon className={cn(iconClassName, "shrink-0")} aria-hidden />
      )}
      <span className={cn(pending && "opacity-80")}>{item.title}</span>
    </>
  );
}

export function DashboardNavLinks({
  variant,
  onNavigate,
}: DashboardNavLinksProps) {
  const pathname = usePathname();
  const isSidebar = variant === "sidebar";
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
            className={cn(
              "flex items-center gap-3 rounded-lg font-medium transition-colors touch-manipulation",
              isSidebar
                ? "px-3 py-2 text-sm"
                : "min-h-12 px-3 text-base",
              isSidebar
                ? active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                : active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted",
            )}
          >
            <DashboardNavLinkContent
              item={item}
              iconClassName={isSidebar ? "h-4 w-4" : "h-5 w-5"}
            />
          </Link>
        );
      })}
    </>
  );
}
