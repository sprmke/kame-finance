"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPhpAmount } from "@/lib/utils/format-money";

import {
  flattenStatementTransactions,
  type PeriodTransaction,
} from "../lib/period-overview-stats";
import type { SoaStatement } from "../lib/soa-utils";
import {
  cardKeyForTransaction,
  cardLabelForTransaction,
  filterPeriodTransactions,
  groupPeriodTransactions,
  listCardFilterOptions,
  listCategoryFilterOptions,
  PERIOD_TX_KIND_OPTIONS,
  sortPeriodTransactions,
  type PeriodTxGroupMode,
  type PeriodTxSort,
} from "../lib/period-transactions-view";
import { SoaTransactionList } from "./SoaTransactionList";

const STORAGE_KEY = "kame-finance:soa-period-tx-view";

type PersistedView = {
  group: PeriodTxGroupMode;
  sort: PeriodTxSort;
};

function readPersistedView(): PersistedView {
  if (typeof window === "undefined") {
    return { group: "flat", sort: "date_desc" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { group: "flat", sort: "date_desc" };
    const parsed = JSON.parse(raw) as Partial<PersistedView>;
    const group =
      parsed.group === "card" || parsed.group === "category"
        ? parsed.group
        : "flat";
    const sort =
      parsed.sort === "date_asc" ||
      parsed.sort === "amount_desc" ||
      parsed.sort === "amount_asc"
        ? parsed.sort
        : "date_desc";
    return { group, sort };
  } catch {
    return { group: "flat", sort: "date_desc" };
  }
}

type SoaPeriodTransactionsTabProps = {
  statements: SoaStatement[];
};

export function SoaPeriodTransactionsTab({
  statements,
}: SoaPeriodTransactionsTabProps) {
  const allTransactions = useMemo(
    () => flattenStatementTransactions(statements),
    [statements],
  );

  const [search, setSearch] = useState("");
  const [cardKey, setCardKey] = useState("all");
  const [categorySlug, setCategorySlug] = useState("all");
  const [kind, setKind] = useState("all");
  const [group, setGroup] = useState<PeriodTxGroupMode>("flat");
  const [sort, setSort] = useState<PeriodTxSort>("date_desc");

  useEffect(() => {
    const persisted = readPersistedView();
    setGroup(persisted.group);
    setSort(persisted.sort);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ group, sort }));
  }, [group, sort]);

  const cardOptions = useMemo(
    () => listCardFilterOptions(allTransactions),
    [allTransactions],
  );
  const categoryOptions = useMemo(
    () => listCategoryFilterOptions(allTransactions),
    [allTransactions],
  );

  const filtered = useMemo(
    () =>
      filterPeriodTransactions(allTransactions, {
        search,
        cardKey,
        categorySlug,
        kind,
      }),
    [allTransactions, search, cardKey, categorySlug, kind],
  );

  const sorted = useMemo(
    () => sortPeriodTransactions(filtered, sort),
    [filtered, sort],
  );

  const groups = useMemo(
    () => groupPeriodTransactions(sorted, group),
    [sorted, group],
  );

  const showCardColumn =
    group === "flat" &&
    new Set(allTransactions.map(cardKeyForTransaction)).size > 1;

  if (!allTransactions.length) {
    return (
      <p className="py-12 text-sm text-center text-muted-foreground">
        No transactions in this period.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-[12rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="pl-9"
            aria-label="Search transactions"
          />
        </div>

        <Select value={cardKey} onValueChange={setCardKey}>
          <SelectTrigger className="w-full sm:w-[11rem]" aria-label="Filter by card">
            <SelectValue placeholder="Card" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cards</SelectItem>
            {cardOptions.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categorySlug} onValueChange={setCategorySlug}>
          <SelectTrigger
            className="w-full sm:w-[11rem]"
            aria-label="Filter by category"
          >
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.slug} value={opt.slug}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-full sm:w-[9.5rem]" aria-label="Filter by type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_TX_KIND_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={group}
          onValueChange={(v) => setGroup(v as PeriodTxGroupMode)}
        >
          <SelectTrigger className="w-full sm:w-[9.5rem]" aria-label="Group by">
            <SelectValue placeholder="Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flat">Flat list</SelectItem>
            <SelectItem value="card">By card</SelectItem>
            <SelectItem value="category">By category</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as PeriodTxSort)}>
          <SelectTrigger className="w-full sm:w-[10.5rem]" aria-label="Sort">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Newest first</SelectItem>
            <SelectItem value="date_asc">Oldest first</SelectItem>
            <SelectItem value="amount_desc">Amount high–low</SelectItem>
            <SelectItem value="amount_asc">Amount low–high</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">
          {filtered.length}
        </span>
        {filtered.length === 1 ? " transaction" : " transactions"}
        {filtered.length !== allTransactions.length
          ? ` of ${allTransactions.length}`
          : null}
      </p>

      {filtered.length === 0 ? (
        <p className="py-12 text-sm text-center text-muted-foreground">
          No transactions match your filters.
        </p>
      ) : (
        <div className="space-y-10">
          {groups.map((section) => (
            <section key={section.key} className="space-y-4">
              {group !== "flat" && (
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-3">
                  <h2 className="text-lg font-semibold font-display">
                    {section.label}
                  </h2>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    {formatPhpAmount(section.spendTotal)} spend
                  </p>
                </div>
              )}
              <PeriodTransactionListSection
                transactions={section.transactions}
                showCardColumn={showCardColumn}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function PeriodTransactionListSection({
  transactions,
  showCardColumn,
}: {
  transactions: PeriodTransaction[];
  showCardColumn: boolean;
}) {
  return (
    <SoaTransactionList
      transactions={transactions}
      resolveIssuerId={(tx) =>
        (tx as PeriodTransaction).issuerId ?? null
      }
      showCard={showCardColumn}
      resolveCardLabel={(tx) =>
        cardLabelForTransaction(tx as PeriodTransaction)
      }
    />
  );
}
