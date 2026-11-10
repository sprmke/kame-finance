"use client";

import Link from "next/link";
import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import { Bot, CalendarClock, FileText, Plug, Tags, type LucideIcon } from "lucide-react";

import { DashboardPageHeader } from "@/components/shared/DashboardPageHeader";
import { ROUTES, type SettingsSection } from "@/config/routes";
import { AutomationsPanel } from "@/features/dashboard/automations/components/AutomationsPanel";
import { cn } from "@/lib/utils/cn";

import { AiApiKeysSettings } from "./AiApiKeysSettings";
import { CustomTransactionCategoriesSettings } from "./CustomTransactionCategoriesSettings";
import { IntegrationsSettings } from "./IntegrationsSettings";
import { SoaWorkflowSettings } from "./SoaWorkflowSettings";
import { TransactionCategoryRulesSettings } from "./TransactionCategoryRulesSettings";

const SECTIONS: Array<{ id: SettingsSection; label: string; icon: LucideIcon }> = [
  { id: "connections", label: "Connections", icon: Plug },
  { id: "automations", label: "Automations", icon: CalendarClock },
  { id: "statements", label: "Statements", icon: FileText },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "ai", label: "AI", icon: Bot },
];

export function parseSettingsSection(value: string | null | undefined): SettingsSection {
  return SECTIONS.some((section) => section.id === value)
    ? (value as SettingsSection)
    : "connections";
}

/** Settings as sections (left list on desktop, scrolling tabs on phone), synced to ?section=. */
export function SettingsPage() {
  const searchParams = useSearchParams();
  const active = parseSettingsSection(searchParams.get("section"));
  const current = SECTIONS.find((section) => section.id === active)!;

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Settings" />
      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-8 lg:self-start">
          <ul className="scrollbar-hide -mx-4 flex gap-1 overflow-x-auto border-b px-4 lg:mx-0 lg:flex-col lg:gap-0.5 lg:border-b-0 lg:px-0">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const selected = section.id === active;
              return (
                <li key={section.id} className="shrink-0">
                  <Link
                    href={ROUTES.dashboard.settingsSection(section.id) as Route}
                    scroll={false}
                    aria-current={selected ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center gap-2.5 whitespace-nowrap border-b-2 px-1 text-sm outline-none transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-ring lg:h-10 lg:rounded-md lg:border lg:px-2.5",
                      selected
                        ? "border-foreground font-bold text-foreground lg:border-border lg:bg-card"
                        : "border-transparent font-medium text-muted-foreground hover:text-foreground lg:hover:bg-muted",
                    )}
                  >
                    <Icon className="hidden h-4 w-4 shrink-0 lg:block" aria-hidden />
                    {section.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-labelledby="settings-section-title" className="min-w-0 space-y-4">
          <h2 id="settings-section-title" className="text-lg font-bold">
            {current.label}
          </h2>
          {active === "connections" ? <IntegrationsSettings /> : null}
          {active === "automations" ? <AutomationsPanel /> : null}
          {active === "statements" ? <SoaWorkflowSettings /> : null}
          {active === "categories" ? (
            <div className="space-y-4">
              <CustomTransactionCategoriesSettings />
              <TransactionCategoryRulesSettings />
            </div>
          ) : null}
          {active === "ai" ? <AiApiKeysSettings /> : null}
        </section>
      </div>
    </div>
  );
}
