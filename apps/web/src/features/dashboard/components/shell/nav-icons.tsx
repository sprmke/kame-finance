import {
  CalendarDays,
  CreditCard,
  FileText,
  ReceiptText,
  Settings,
  type LucideIcon,
} from "lucide-react";

import type { DASHBOARD_NAV } from "@/config/routes";

export const NAV_ICONS: Record<(typeof DASHBOARD_NAV)[number]["icon"], LucideIcon> = {
  Home: CalendarDays,
  Bills: ReceiptText,
  Statements: FileText,
  Cards: CreditCard,
  Settings,
};
