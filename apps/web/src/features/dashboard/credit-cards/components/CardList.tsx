"use client";

import Link from "next/link";
import { FileText, MoreHorizontal, Pencil, ReceiptText, Trash2 } from "lucide-react";

import { CardSwatch } from "@/components/shared/CardChip";
import { MissingSoaBadge } from "@/components/shared/MissingSoaBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/config/routes";
import { resolveCardAccent } from "@/lib/credit-cards/card-accent";
import { CARD_NETWORK_LABELS, formatBankIssuer, type CardNetwork } from "@/lib/db/schema/credit-cards";
import { formatReminderSummary } from "@/lib/reminders/reminder-labels";

export type CreditCardRow = {
  id: string;
  issuer: string;
  last4: string;
  label: string | null;
  color: string | null;
  gmailMonthOffset: number | null;
  reminderWindowDays: number | null;
  reminderIntervalMinutes: number;
  dueDay: number | null;
  statementDay: number | null;
  isActive: boolean;
  soaMissing?: boolean;
  googleAccountLabel?: string | null;
};

type CardListProps = {
  cards: Array<CreditCardRow & { cardNetwork?: string | null }>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

/** Registered cards as plastics in miniature with their cycle days printed like a calendar. */
export function CardList({ cards, onEdit, onDelete }: CardListProps) {
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {cards.map((card) => {
        const accent = resolveCardAccent(card.issuer, card.color);
        const name = card.label?.trim() || formatBankIssuer(card.issuer);
        const network = card.cardNetwork
          ? CARD_NETWORK_LABELS[card.cardNetwork as CardNetwork]
          : null;
        return (
          <li key={card.id} className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
            <button
              type="button"
              onClick={() => onEdit(card.id)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4"
              aria-label={`Edit ${name}`}
            >
              <span
                aria-hidden
                className="relative hidden h-12 w-[4.75rem] shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-black/15 sm:block dark:ring-white/15"
                style={{ backgroundColor: accent.color }}
              >
                <span className="absolute left-2 top-2.5 h-3 w-4 rounded-[2px] bg-white/45" />
                <span className="font-numeral absolute bottom-1.5 right-2 text-xs text-white/90">
                  {card.last4}
                </span>
              </span>
              <CardSwatch color={accent.color} className="sm:hidden" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{name}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {[formatBankIssuer(card.issuer), `•••• ${card.last4}`, network]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
                  Statement {card.statementDay ?? "–"} · Due {card.dueDay ?? "–"}
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-1.5 empty:hidden">
                  {card.isActive ? null : <StatusBadge label="Inactive" variant="muted" />}
                  {card.soaMissing ? <MissingSoaBadge /> : null}
                  {card.googleAccountLabel ? (
                    <span className="hidden truncate text-xs text-muted-foreground md:inline">
                      {card.googleAccountLabel}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>

            <dl className="hidden shrink-0 grid-cols-2 gap-x-5 text-center sm:grid">
              <div>
                <dt className="text-2xs font-semibold text-muted-foreground">Statement</dt>
                <dd className="font-numeral text-xl leading-tight">{card.statementDay ?? "–"}</dd>
              </div>
              <div>
                <dt className="text-2xs font-semibold text-muted-foreground">Due</dt>
                <dd className="font-numeral text-xl leading-tight text-due">{card.dueDay ?? "–"}</dd>
              </div>
            </dl>
            <p className="hidden w-40 shrink-0 text-xs text-muted-foreground lg:block">
              {formatReminderSummary(card.reminderWindowDays, card.reminderIntervalMinutes)}
            </p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="shrink-0 max-lg:h-10 max-lg:w-10" aria-label={`Actions for ${name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => onEdit(card.id)}>
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.dashboard.bills}>
                    <ReceiptText />
                    Bills
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.dashboard.statements}>
                    <FileText />
                    Statements
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => onDelete(card.id)}
                >
                  <Trash2 />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        );
      })}
    </ul>
  );
}
