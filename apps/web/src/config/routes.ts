export type SettingsSection =
  | "connections"
  | "automations"
  | "statements"
  | "categories"
  | "ai";

export type BillsView = "due" | "receipts";

/** Quick-action intents consumed once by the destination page (see use-page-intent). */
export type PageIntent = "run-soa" | "upload-soa" | "upload-receipt" | "add-card";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: {
    root: "/dashboard",
    home: "/dashboard",
    bills: "/dashboard/bills",
    billsReceipts: "/dashboard/bills?view=receipts",
    /** Deep link to one bill row; the row scrolls into view and highlights. */
    bill: (dueEntryId: string) => `/dashboard/bills#bill-${dueEntryId}` as const,
    statements: "/dashboard/statements",
    statementPeriod: (id: string) => `/dashboard/statements/${id}` as const,
    statement: (periodId: string, statementId: string) =>
      `/dashboard/statements/${periodId}/${statementId}` as const,
    cards: "/dashboard/cards",
    settings: "/dashboard/settings",
    settingsSection: (section: SettingsSection) =>
      `/dashboard/settings?section=${section}` as const,
  },
} as const;

export const DASHBOARD_NAV = [
  { title: "Home", href: ROUTES.dashboard.home, icon: "Home" },
  { title: "Bills", href: ROUTES.dashboard.bills, icon: "Bills" },
  { title: "Statements", href: ROUTES.dashboard.statements, icon: "Statements" },
  { title: "Cards", href: ROUTES.dashboard.cards, icon: "Cards" },
  { title: "Settings", href: ROUTES.dashboard.settings, icon: "Settings" },
] as const;

/** Paths that moved in the 2026-11 redesign; served as redirects in next.config. */
export const LEGACY_DASHBOARD_REDIRECTS = [
  { source: "/dashboard/soa", destination: "/dashboard/statements" },
  { source: "/dashboard/soa/:path*", destination: "/dashboard/statements/:path*" },
  { source: "/dashboard/credit-cards", destination: "/dashboard/cards" },
  { source: "/dashboard/reminders", destination: "/dashboard/bills" },
  { source: "/dashboard/receipts", destination: "/dashboard/bills?view=receipts" },
  {
    source: "/dashboard/automations",
    destination: "/dashboard/settings?section=automations",
  },
] as const;
