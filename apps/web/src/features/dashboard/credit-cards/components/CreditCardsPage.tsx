"use client";

import { useEffect, useState } from "react";
import { HelpCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DashboardPageHeader } from "@/components/shared/DashboardPageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { GoogleAccountSelect } from "@/components/shared/GoogleAccountSelect";
import { CardFormSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/api/client";
import { normalizeCardLast4 } from "@/lib/due/normalize";
import {
  CARD_NETWORK_LABELS,
  CARD_NETWORKS,
  DEFAULT_CARD_COLORS,
  DEFAULT_SOA_SUBJECTS,
  defaultSoaSubject,
  normalizeSoaSubject,
  DEFAULT_REMINDER_INTERVAL_MINUTES,
  formatBankIssuer,
  normalizeBankIssuer,
  normalizeCardColor,
  normalizeCardNetwork,
  normalizeReminderIntervalMinutes,
  REMINDER_INTERVALS,
  type BankIssuer,
  type CardNetwork,
  type ReminderIntervalMinutes,
} from "@/lib/db/schema/credit-cards";

import {
  DEFAULT_REMINDER_WINDOW_DAYS,
  formatReminderSummary,
} from "@/lib/reminders/reminder-labels";
import { BankIssuerSelect } from "./BankIssuerSelect";
import { CardList } from "./CardList";
import { CardColorPicker } from "./CardColorPicker";
import { CreditCardsLoadingView } from "./CreditCardsLoadingView";
import { useHasHydrated } from "@/hooks/use-has-hydrated";
import { useGoogleLinkCallback } from "@/hooks/use-google-link-callback";
import {
  clearAddCardDraft,
  loadAddCardDraft,
  saveAddCardDraft,
  type AddCardDraft,
} from "@/lib/credit-cards/add-card-draft";

const DEFAULT_WINDOW = DEFAULT_REMINDER_WINDOW_DAYS;

export function CreditCardsPage() {
  const hasHydrated = useHasHydrated();
  const utils = api.useUtils();
  const { data: cards, isLoading } = api.creditCards.list.useQuery();

  const create = api.creditCards.create.useMutation({
    onSuccess: () => {
      toast.success("Card added");
      clearAddCardDraft();
      void utils.creditCards.list.invalidate();
      void utils.overview.stats.invalidate();
      setAddOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const update = api.creditCards.update.useMutation({
    onSuccess: (_data, variables) => {
      toast.success("Card updated");
      void utils.creditCards.list.invalidate();
      void utils.creditCards.get.invalidate({ id: variables.id });
      setEditOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = api.creditCards.delete.useMutation({
    onSuccess: () => {
      toast.success("Card removed");
      void utils.creditCards.list.invalidate();
      void utils.overview.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [issuer, setIssuer] = useState<BankIssuer>("bpi");
  const [label, setLabel] = useState("");
  const [fullPan, setFullPan] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [statementDay, setStatementDay] = useState("");
  const [contactLine, setContactLine] = useState("");
  const [pdfPassword, setPdfPassword] = useState("");
  const [gmailMonthOffset, setGmailMonthOffset] = useState("0");
  const [reminderWindowDays, setReminderWindowDays] = useState("");
  const [reminderIntervalMinutes, setReminderIntervalMinutes] =
    useState<ReminderIntervalMinutes>(DEFAULT_REMINDER_INTERVAL_MINUTES);
  const [notes, setNotes] = useState("");
  const [soaSubject, setSoaSubject] = useState(defaultSoaSubject("bpi"));
  const [color, setColor] = useState(DEFAULT_CARD_COLORS.bpi);
  const [cardNetwork, setCardNetwork] = useState<CardNetwork | null>(null);
  const [googleAccountId, setGoogleAccountId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formPopulatedForId, setFormPopulatedForId] = useState<string | null>(
    null,
  );
  const [formSessionKey, setFormSessionKey] = useState(0);

  const { data: editingCard, isLoading: isLoadingEdit } =
    api.creditCards.get.useQuery(
      { id: editingId! },
      {
        enabled: !!editingId && editOpen,
        staleTime: 0,
      },
    );

  const editFormReady =
    !!editingId &&
    !!editingCard &&
    editingCard.id === editingId &&
    !isLoadingEdit &&
    formPopulatedForId === editingId;

  useEffect(() => {
    if (!editingCard || editingCard.id !== editingId) return;
    setIssuer(normalizeBankIssuer(editingCard.issuer));
    setLabel(editingCard.label ?? "");
    setFullPan(editingCard.fullPan ?? "");
    setDueDay(editingCard.dueDay != null ? String(editingCard.dueDay) : "");
    setStatementDay(
      editingCard.statementDay != null ? String(editingCard.statementDay) : "",
    );
    setContactLine(editingCard.contactLine ?? "");
    setPdfPassword(editingCard.pdfPassword);
    setGmailMonthOffset(String(editingCard.gmailMonthOffset ?? 0));
    setReminderWindowDays(
      editingCard.reminderWindowDays != null
        ? String(editingCard.reminderWindowDays)
        : "",
    );
    setReminderIntervalMinutes(
      normalizeReminderIntervalMinutes(editingCard.reminderIntervalMinutes),
    );
    setNotes(editingCard.notes ?? "");
    setSoaSubject(
      normalizeSoaSubject(
        editingCard.soaSubject,
        normalizeBankIssuer(editingCard.issuer),
      ),
    );
    setColor(
      normalizeCardColor(
        editingCard.color,
        normalizeBankIssuer(editingCard.issuer),
      ) ?? DEFAULT_CARD_COLORS.bpi,
    );
    setCardNetwork(normalizeCardNetwork(editingCard.cardNetwork));
    setGoogleAccountId(editingCard.googleAccountId ?? null);
    if (editingCard.secretsUnavailable) {
      toast.error("PDF password could not be decrypted. Re-enter it and save.");
    }
    setFormPopulatedForId(editingId);
  }, [editingCard, editingId]);

  function resetForm() {
    setIssuer("bpi");
    setLabel("");
    setFullPan("");
    setDueDay("");
    setStatementDay("");
    setContactLine("");
    setPdfPassword("");
    setGmailMonthOffset("0");
    setReminderWindowDays("");
    setReminderIntervalMinutes(DEFAULT_REMINDER_INTERVAL_MINUTES);
    setNotes("");
    setSoaSubject(defaultSoaSubject("bpi"));
    setColor(DEFAULT_CARD_COLORS.bpi);
    setCardNetwork(null);
    setGoogleAccountId(null);
  }

  function currentAddCardDraft(): AddCardDraft {
    return {
      issuer,
      label,
      fullPan,
      dueDay,
      statementDay,
      contactLine,
      pdfPassword,
      gmailMonthOffset,
      reminderWindowDays,
      reminderIntervalMinutes,
      notes,
      soaSubject,
      color,
      cardNetwork,
      googleAccountId,
    };
  }

  function applyAddCardDraft(draft: AddCardDraft) {
    setIssuer(draft.issuer);
    setLabel(draft.label);
    setFullPan(draft.fullPan);
    setDueDay(draft.dueDay ?? "");
    setStatementDay(draft.statementDay ?? "");
    setContactLine(draft.contactLine);
    setPdfPassword(draft.pdfPassword);
    setGmailMonthOffset(draft.gmailMonthOffset);
    setReminderWindowDays(draft.reminderWindowDays);
    setReminderIntervalMinutes(draft.reminderIntervalMinutes);
    setNotes(draft.notes);
    setSoaSubject(draft.soaSubject);
    setColor(draft.color);
    setCardNetwork(normalizeCardNetwork(draft.cardNetwork));
    setGoogleAccountId(draft.googleAccountId);
  }

  function persistAddCardDraftBeforeConnect() {
    saveAddCardDraft(currentAddCardDraft());
  }

  function resolveLast4(fallbackLast4?: string): string {
    const panDigits = fullPan.replace(/\D/g, "");
    if (panDigits.length >= 4) {
      return normalizeCardLast4(fullPan);
    }
    if (fallbackLast4) {
      return normalizeCardLast4(fallbackLast4);
    }
    return "";
  }

  function formPayload(fallbackLast4?: string) {
    const windowDays = reminderWindowDays.trim()
      ? Number(reminderWindowDays)
      : null;
    return {
      issuer,
      last4: resolveLast4(fallbackLast4),
      label: label || undefined,
      fullPan: fullPan || undefined,
      dueDay: Number(dueDay),
      statementDay: Number(statementDay),
      contactLine: contactLine || undefined,
      gmailMonthOffset: Number(gmailMonthOffset) || 0,
      reminderWindowDays: windowDays,
      reminderIntervalMinutes,
      notes: notes || undefined,
      soaSubject: normalizeSoaSubject(soaSubject, issuer),
      color: normalizeCardColor(color, issuer),
      cardNetwork,
      googleAccountId,
    };
  }

  function submitCreate() {
    const payload = formPayload();
    if (payload.last4.length !== 4) {
      toast.error("Enter a full card number with at least 4 digits");
      return;
    }
    if (
      !Number.isInteger(payload.dueDay) ||
      payload.dueDay < 1 ||
      payload.dueDay > 31
    ) {
      toast.error("Enter a due date from 1 to 31");
      return;
    }
    if (
      !Number.isInteger(payload.statementDay) ||
      payload.statementDay < 1 ||
      payload.statementDay > 31
    ) {
      toast.error("Enter a statement date from 1 to 31");
      return;
    }
    create.mutate({ ...payload, pdfPassword });
  }

  function submitUpdate(cardId: string, fallbackLast4: string) {
    const payload = formPayload(fallbackLast4);
    if (payload.last4.length !== 4) {
      toast.error("Enter a full card number with at least 4 digits");
      return;
    }
    if (
      !Number.isInteger(payload.dueDay) ||
      payload.dueDay < 1 ||
      payload.dueDay > 31
    ) {
      toast.error("Enter a due date from 1 to 31");
      return;
    }
    if (
      !Number.isInteger(payload.statementDay) ||
      payload.statementDay < 1 ||
      payload.statementDay > 31
    ) {
      toast.error("Enter a statement date from 1 to 31");
      return;
    }
    update.mutate({
      id: cardId,
      ...payload,
      ...(pdfPassword ? { pdfPassword } : {}),
    });
  }

  function openEdit(cardId: string) {
    setFormPopulatedForId(null);
    setFormSessionKey((key) => key + 1);
    setEditingId(cardId);
    setEditOpen(true);
  }

  useGoogleLinkCallback({
    onSuccess: (accountId) => {
      void utils.creditCards.list.invalidate();
      const editId =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("edit")
          : null;
      if (editId) {
        void utils.creditCards.get.invalidate({ id: editId });
      }
      if (accountId) {
        setGoogleAccountId(accountId);
      }
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    const addReturn = params.get("add");

    if (addReturn === "1") {
      setAddOpen(true);
      setFormSessionKey((key) => key + 1);
      const draft = loadAddCardDraft();
      if (draft) {
        applyAddCardDraft(draft);
        clearAddCardDraft();
      }
      params.delete("add");
    }

    if (editId) {
      openEdit(editId);
      params.delete("edit");
    }

    if (addReturn === "1" || editId) {
      const next = `${window.location.pathname}${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      window.history.replaceState({}, "", next);
    }
  }, []);

  if (!hasHydrated || (isLoading && cards === undefined)) {
    return <CreditCardsLoadingView />;
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Cards"
        actions={
          <Button
            onClick={() => {
              resetForm();
              setFormSessionKey((key) => key + 1);
              setAddOpen(true);
            }}
          >
            <Plus />
            Add card
          </Button>
        }
      />

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>Add card</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <CardForm
                key={`add-${formSessionKey}`}
                issuer={issuer}
                setIssuer={setIssuer}
                label={label}
                setLabel={setLabel}
                fullPan={fullPan}
                setFullPan={setFullPan}
                fullPanRequired
                dueDay={dueDay}
                setDueDay={setDueDay}
                statementDay={statementDay}
                setStatementDay={setStatementDay}
                contactLine={contactLine}
                setContactLine={setContactLine}
                pdfPassword={pdfPassword}
                setPdfPassword={setPdfPassword}
                gmailMonthOffset={gmailMonthOffset}
                setGmailMonthOffset={setGmailMonthOffset}
                reminderWindowDays={reminderWindowDays}
                setReminderWindowDays={setReminderWindowDays}
                reminderIntervalMinutes={reminderIntervalMinutes}
                setReminderIntervalMinutes={setReminderIntervalMinutes}
                notes={notes}
                setNotes={setNotes}
                soaSubject={soaSubject}
                setSoaSubject={setSoaSubject}
                color={color}
                setColor={setColor}
                cardNetwork={cardNetwork}
                setCardNetwork={setCardNetwork}
                googleAccountId={googleAccountId}
                setGoogleAccountId={setGoogleAccountId}
                onBeforeConnectOtherGmail={persistAddCardDraftBeforeConnect}
                onSubmit={submitCreate}
                pending={create.isPending}
                submitLabel="Add card"
              />
          </div>
        </SheetContent>
      </Sheet>

      {!cards?.length ? (
        <EmptyState
          title="No cards yet"
          message="Add a card with its statement and due days to start tracking bills."
          action={
            <Button
              onClick={() => {
                resetForm();
                setFormSessionKey((key) => key + 1);
                setAddOpen(true);
              }}
            >
              <Plus />
              Add card
            </Button>
          }
        />
      ) : (
        <CardList cards={cards} onEdit={openEdit} onDelete={setDeleteId} />
      )}

      <Sheet
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditingId(null);
            setFormPopulatedForId(null);
            resetForm();
          }
        }}
      >
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>Edit card</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-5">
          {editFormReady ? (
            editingId && (
              <CardForm
                key={`edit-${editingId}-${formSessionKey}`}
                issuer={issuer}
                setIssuer={setIssuer}
                label={label}
                setLabel={setLabel}
                fullPan={fullPan}
                setFullPan={setFullPan}
                dueDay={dueDay}
                setDueDay={setDueDay}
                statementDay={statementDay}
                setStatementDay={setStatementDay}
                contactLine={contactLine}
                setContactLine={setContactLine}
                pdfPassword={pdfPassword}
                setPdfPassword={setPdfPassword}
                gmailMonthOffset={gmailMonthOffset}
                setGmailMonthOffset={setGmailMonthOffset}
                reminderWindowDays={reminderWindowDays}
                setReminderWindowDays={setReminderWindowDays}
                reminderIntervalMinutes={reminderIntervalMinutes}
                setReminderIntervalMinutes={setReminderIntervalMinutes}
                notes={notes}
                setNotes={setNotes}
                soaSubject={soaSubject}
                setSoaSubject={setSoaSubject}
                color={color}
                setColor={setColor}
                cardNetwork={cardNetwork}
                setCardNetwork={setCardNetwork}
                googleAccountId={googleAccountId}
                setGoogleAccountId={setGoogleAccountId}
                creditCardId={editingId}
                passwordOptional
                onSubmit={() => submitUpdate(editingId, editingCard.last4)}
                pending={update.isPending}
                submitLabel="Save changes"
              />
            )
          ) : (
            <CardFormSkeleton />
          )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remove this card?"
        description="SOA history is kept, but this card will no longer be used for new runs."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) remove.mutate({ id: deleteId });
          setDeleteId(null);
        }}
      />
    </div>
  );
}

const GMAIL_MONTH_OFFSET_HINT =
  "Shifts which calendar month Gmail searches for the SOA email. Use -1 if your bank sends the statement in the previous month. Leave 0 for most banks.";

function FieldLabelWithHint({
  htmlFor,
  label,
  hint,
}: {
  htmlFor?: string;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex rounded-sm transition-colors text-muted-foreground hover:text-foreground"
              aria-label={`About ${label}`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs text-xs leading-relaxed"
          >
            {hint}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function CardForm({
  issuer,
  setIssuer,
  label,
  setLabel,
  fullPan,
  setFullPan,
  fullPanRequired = false,
  dueDay,
  setDueDay,
  statementDay,
  setStatementDay,
  contactLine,
  setContactLine,
  pdfPassword,
  setPdfPassword,
  gmailMonthOffset,
  setGmailMonthOffset,
  reminderWindowDays,
  setReminderWindowDays,
  reminderIntervalMinutes,
  setReminderIntervalMinutes,
  notes,
  setNotes,
  soaSubject,
  setSoaSubject,
  color,
  setColor,
  cardNetwork,
  setCardNetwork,
  googleAccountId,
  setGoogleAccountId,
  creditCardId,
  onBeforeConnectOtherGmail,
  passwordOptional,
  onSubmit,
  pending,
  submitLabel,
}: {
  issuer: BankIssuer;
  setIssuer: (v: BankIssuer) => void;
  label: string;
  setLabel: (v: string) => void;
  fullPan: string;
  setFullPan: (v: string) => void;
  fullPanRequired?: boolean;
  dueDay: string;
  setDueDay: (v: string) => void;
  statementDay: string;
  setStatementDay: (v: string) => void;
  contactLine: string;
  setContactLine: (v: string) => void;
  pdfPassword: string;
  setPdfPassword: (v: string) => void;
  gmailMonthOffset: string;
  setGmailMonthOffset: (v: string) => void;
  reminderWindowDays: string;
  setReminderWindowDays: (v: string) => void;
  reminderIntervalMinutes: ReminderIntervalMinutes;
  setReminderIntervalMinutes: (v: ReminderIntervalMinutes) => void;
  notes: string;
  setNotes: (v: string) => void;
  soaSubject: string;
  setSoaSubject: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  cardNetwork: CardNetwork | null;
  setCardNetwork: (v: CardNetwork | null) => void;
  googleAccountId: string | null;
  setGoogleAccountId: (v: string | null) => void;
  creditCardId?: string | null;
  onBeforeConnectOtherGmail?: () => void;
  passwordOptional?: boolean;
  onSubmit: () => void;
  pending: boolean;
  submitLabel: string;
}) {
  const fieldId = (name: string) => `${name}-${creditCardId ?? "add"}`;

  return (
    <form
      className="flex min-h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex-1 space-y-7">
        <FormSection title="Card">
          <div className="space-y-2">
            <Label htmlFor={fieldId("bank")}>Bank</Label>
            <BankIssuerSelect
              id={fieldId("bank")}
              value={issuer}
              onValueChange={(next) => {
                setIssuer(next);
                setSoaSubject(defaultSoaSubject(next));
                setColor(DEFAULT_CARD_COLORS[next]);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={fieldId("label")}>Name</Label>
            <Input
              id={fieldId("label")}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. BPI Gold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={fieldId("pan")}>Full card number</Label>
            <Input
              id={fieldId("pan")}
              value={fullPan}
              onChange={(e) => setFullPan(e.target.value)}
              placeholder="4532 XXXX XXXX 9012"
              inputMode="numeric"
              autoComplete="off"
              required={fullPanRequired}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={fieldId("card-type")}>Card type</Label>
            <Select
              value={cardNetwork ?? "unset"}
              onValueChange={(value) =>
                setCardNetwork(value === "unset" ? null : (value as CardNetwork))
              }
            >
              <SelectTrigger id={fieldId("card-type")}>
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not set</SelectItem>
                {CARD_NETWORKS.map((network) => (
                  <SelectItem key={network} value={network}>
                    {CARD_NETWORK_LABELS[network]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FormSection>

        <FormSection title="Billing cycle">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={fieldId("statement-day")}>Statement day</Label>
              <Input
                id={fieldId("statement-day")}
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                value={statementDay}
                onChange={(e) => setStatementDay(e.target.value)}
                placeholder="1–31"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId("due-day")}>Due day</Label>
              <Input
                id={fieldId("due-day")}
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="1–31"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabelWithHint
              htmlFor={fieldId("gmail-month-offset")}
              label="Statement month shift"
              hint={GMAIL_MONTH_OFFSET_HINT}
            />
            <Input
              id={fieldId("gmail-month-offset")}
              type="number"
              value={gmailMonthOffset}
              onChange={(e) => setGmailMonthOffset(e.target.value)}
              className="max-w-[8rem]"
            />
          </div>
        </FormSection>

        <FormSection title="Statement email">
          <GoogleAccountSelect
            value={googleAccountId}
            onChange={setGoogleAccountId}
            creditCardId={creditCardId}
            onBeforeConnect={onBeforeConnectOtherGmail}
            id={fieldId("google-account")}
          />
          <div className="space-y-2">
            <Label htmlFor={fieldId("soa-subject")}>SOA email subject</Label>
            <Input
              id={fieldId("soa-subject")}
              value={soaSubject}
              onChange={(e) => setSoaSubject(e.target.value)}
              placeholder={DEFAULT_SOA_SUBJECTS[issuer]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={fieldId("pdf-password")}>PDF password</Label>
            <PasswordInput
              id={fieldId("pdf-password")}
              value={pdfPassword}
              onChange={(e) => setPdfPassword(e.target.value)}
              required={!passwordOptional}
              autoComplete="off"
            />
          </div>
        </FormSection>

        <FormSection title="Reminders">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={fieldId("reminder-window-days")}>Days before due</Label>
              <Input
                id={fieldId("reminder-window-days")}
                type="number"
                min={0}
                max={60}
                value={reminderWindowDays}
                onChange={(e) => setReminderWindowDays(e.target.value)}
                placeholder={`Default (${DEFAULT_WINDOW})`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId("reminder-interval")}>How often</Label>
              <Select
                value={String(reminderIntervalMinutes)}
                onValueChange={(v) =>
                  setReminderIntervalMinutes(Number(v) as ReminderIntervalMinutes)
                }
              >
                <SelectTrigger id={fieldId("reminder-interval")}>
                  <SelectValue placeholder="Once per day" />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_INTERVALS.map((i) => (
                    <SelectItem key={i.value} value={String(i.value)}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Look and notes">
          <div className="space-y-2">
            <Label>Color</Label>
            <CardColorPicker value={color} onChange={setColor} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={fieldId("contact-line")}>Bank contact line</Label>
            <Textarea
              id={fieldId("contact-line")}
              value={contactLine}
              onChange={(e) => setContactLine(e.target.value)}
              rows={2}
              placeholder="1-800-XXX-XXXX (Press 1, 2)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={fieldId("notes")}>Notes</Label>
            <Textarea
              id={fieldId("notes")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </FormSection>
      </div>

      <div className="sticky -bottom-5 z-10 -mx-5 -mb-5 mt-6 border-t bg-card px-5 py-4 pb-safe">
        <Button type="submit" loading={pending} className="w-full">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-sm font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}
