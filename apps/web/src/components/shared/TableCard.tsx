import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export const tableCardClassName =
  "overflow-hidden rounded-lg border bg-card text-card-foreground";

type TableCardProps = {
  children: ReactNode;
  className?: string;
};

export function TableCard({ children, className }: TableCardProps) {
  return <div className={cn(tableCardClassName, className)}>{children}</div>;
}
