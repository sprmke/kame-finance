"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DayMarkGlyph } from "@/components/calendar/DayMark";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils/cn";

type Step = {
  key: string;
  title: string;
  detail: string;
  done: boolean;
  action: React.ReactNode;
};

/** First run: three steps from sign-in to a first parsed statement. */
export function FirstRunChecklist({
  googleConnected,
  hasCards,
  hasStatements,
  onAddCard,
  onRunSoa,
}: {
  googleConnected: boolean;
  hasCards: boolean;
  hasStatements: boolean;
  onAddCard: () => void;
  onRunSoa: () => void;
}) {
  const steps: Step[] = [
    {
      key: "google",
      title: "Connect Gmail",
      detail: "Where your banks send statements.",
      done: googleConnected,
      action: (
        <Button asChild size="sm" variant={googleConnected ? "ghost" : "default"}>
          <Link href={ROUTES.dashboard.settingsSection("connections")}>
            {googleConnected ? "Manage" : "Connect"}
            <ArrowRight />
          </Link>
        </Button>
      ),
    },
    {
      key: "card",
      title: "Add a card",
      detail: "Statement day, due day, and PDF password.",
      done: hasCards,
      action: (
        <Button size="sm" variant={hasCards ? "ghost" : "default"} onClick={onAddCard}>
          {hasCards ? "Add another" : "Add card"}
        </Button>
      ),
    },
    {
      key: "soa",
      title: "Run your first SOA",
      detail: "Fetch and read this month's statements.",
      done: hasStatements,
      action: (
        <Button size="sm" variant={hasStatements ? "ghost" : "default"} disabled={!hasCards} onClick={onRunSoa}>
          Run SOA
        </Button>
      ),
    },
  ];
  const next = steps.find((step) => !step.done)?.key;

  return (
    <section aria-labelledby="first-run-title" className="rounded-lg border bg-card">
      <div className="border-b px-4 py-4 sm:px-5">
        <h2 id="first-run-title" className="text-lg font-bold">
          Set up your calendar
        </h2>
      </div>
      <ol className="divide-y">
        {steps.map((step, index) => (
          <li
            key={step.key}
            className={cn(
              "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5",
              next === step.key && "bg-accent/50",
            )}
          >
            <span
              className={cn(
                "font-numeral flex size-9 shrink-0 items-center justify-center rounded-sm text-lg",
                step.done ? "text-success" : "bg-foreground text-background",
              )}
              aria-hidden
            >
              {step.done ? <DayMarkGlyph kind="paid" className="size-5" /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("font-bold", step.done && "text-muted-foreground line-through decoration-1")}>
                {step.title}
              </p>
              <p className="text-13 text-muted-foreground">{step.detail}</p>
            </div>
            <div className="shrink-0">{step.action}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
