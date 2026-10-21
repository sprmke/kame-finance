import { eq } from "drizzle-orm";

import { GOOGLE_OAUTH_SCOPES } from "@/lib/auth/google-scopes";
import { db } from "@/lib/db";
import { dueEntries, users } from "@/lib/db/schema";
import { isDueMonthEligible, todayYmdInTimezone } from "@/lib/soa/calendar-dates";
import {
  payCcDueKey,
  seriesIsComplete,
  shiftYmd,
} from "@/lib/soa/calendar-fingerprint";
import { applyIntegrationsToEnv } from "./integration-env.service";
import { gmailService } from "./gmail.service";
import { integrationService } from "./integration.service";
import type { DueEntryRow } from "./due-entry-query.service";
import type {
  CalendarDueEntry,
  CalendarEventInput,
} from "@/lib/soa/google-calendar";

function toCalendarDueEntry(entry: DueEntryRow): CalendarDueEntry {
  return {
    issuerId: entry.issuerId,
    cardLast4: entry.cardLast4,
    bankLabel: entry.bankLabel,
    cardDisplayLabel: entry.cardDisplayLabel ?? undefined,
    dueDate: entry.dueDate,
    dueDateYMD: entry.dueDateYmd,
    minimumDue: entry.minimumDue,
    totalDue: entry.totalDue,
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function assertCalendarScope(): void {
  const tokenJson = process.env.GMAIL_TOKEN_JSON;
  if (!tokenJson) return;
  try {
    const parsed = JSON.parse(tokenJson) as { scope?: string };
    const scope = parsed.scope ?? "";
    const hasCalendar = GOOGLE_OAUTH_SCOPES.some(
      (s) => s.includes("calendar") && scope.includes(s),
    );
    if (!hasCalendar && !scope.includes("calendar.events")) {
      throw new Error(
        "Google Calendar permission is missing. Sign out and sign in again with Google to grant Calendar access.",
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Calendar")) {
      throw error;
    }
  }
}

async function resolveUserTimezone(userId: string): Promise<string> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { timezone: true },
  });
  return user?.timezone?.trim() || "Asia/Manila";
}
async function prepareCalendarEnv(userId: string): Promise<string> {
  await applyIntegrationsToEnv(userId);
  await gmailService.applyTokensToEnv(userId);
  assertCalendarScope();
  const calendar = await integrationService.getConfig<{ calendarId?: string }>(
    userId,
    "google_calendar",
  );
  return calendar?.calendarId?.trim() || "primary";
}

export const googleCalendarService = {
  async markEventsPaid(userId: string, entry: DueEntryRow) {
    const calendarId = await prepareCalendarEnv(userId);
    const { markCalendarEventsPaid } =
      await import("@/lib/soa/google-calendar");
    return markCalendarEventsPaid(toCalendarDueEntry(entry), calendarId);
  },

  async markEventsUnpaid(userId: string, entry: DueEntryRow) {
    const calendarId = await prepareCalendarEnv(userId);
    const { markCalendarEventsUnpaid } =
      await import("@/lib/soa/google-calendar");
    return markCalendarEventsUnpaid(toCalendarDueEntry(entry), calendarId);
  },

  async createDueDateEvents(
    userId: string,
    rows: Parameters<
      typeof import("@/lib/soa/google-calendar").createDueDateCalendarEvents
    >[0],
  ) {
    const calendarId = await prepareCalendarEnv(userId);
    const timeZone = await resolveUserTimezone(userId);
    const telegram = await integrationService.getConfig<{ webLink?: string }>(
      userId,
      "telegram",
    );
    if (telegram?.webLink) {
      process.env.TELEGRAM_WEB_LINK = telegram.webLink;
    }
    const { createDueDateCalendarEvents } =
      await import("@/lib/soa/google-calendar");
    return createDueDateCalendarEvents(rows, calendarId, {
      timeZone,
      todayYmd: todayYmdInTimezone(timeZone),
    });
  },

  /**
   * Make Google Calendar match current due entries.
   * Estimated events stay behind when a statement replaces that due date,
   * because the fingerprint includes the old date. Drop those, fill any
   * missing D-4…D-0 series for the current month onward, and re-apply paid.
   */
  async reconcileDueEvents(userId: string): Promise<{
    deleted: number;
    created: number;
    paid: number;
    error?: string;
  }> {
    const empty = { deleted: 0, created: 0, paid: 0 };
    try {
      const calendar = await integrationService.getConfig(
        userId,
        "google_calendar",
      );
      if (!calendar) return empty;

      const dues = await db.query.dueEntries.findMany({
        where: eq(dueEntries.userId, userId),
      });
      const keepDueKeys = new Set(
        dues.map((entry) =>
          payCcDueKey(entry.issuerId, entry.cardLast4, entry.dueDateYmd),
        ),
      );
      const timeZone = await resolveUserTimezone(userId);
      const todayYmd = todayYmdInTimezone(timeZone);
      const calendarId = await prepareCalendarEnv(userId);
      const {
        createDueDateCalendarEvents,
        deleteStalePayCcEvents,
        keptPayCcFingerprints,
        listPayCcEventsInRange,
        markCalendarEventsPaid,
      } = await import("@/lib/soa/google-calendar");

      const events = await listPayCcEventsInRange(
        calendarId,
        shiftYmd(todayYmd, -80),
        shiftYmd(todayYmd, 130),
      );
      const deleted = await deleteStalePayCcEvents(
        calendarId,
        events,
        keepDueKeys,
      );
      const kept = keptPayCcFingerprints(events, keepDueKeys);

      const missing = dues.filter((entry) => {
        if (!isDueMonthEligible(entry.dueDateYmd, todayYmd)) return false;
        return !seriesIsComplete(
          payCcDueKey(entry.issuerId, entry.cardLast4, entry.dueDateYmd),
          kept,
        );
      });

      let created = 0;
      if (missing.length > 0) {
        const telegram = await integrationService.getConfig<{
          webLink?: string;
        }>(userId, "telegram");
        if (telegram?.webLink) {
          process.env.TELEGRAM_WEB_LINK = telegram.webLink;
        }
        const createdResult = await createDueDateCalendarEvents(
          missing.map(dueEntryToCalendarInput),
          calendarId,
          { timeZone, todayYmd },
        );
        created = createdResult.created;
      }

      let paid = 0;
      for (const entry of dues) {
        if (!entry.paidAt) continue;
        if (!isDueMonthEligible(entry.dueDateYmd, todayYmd)) continue;
        const result = await markCalendarEventsPaid(
          toCalendarDueEntry(entry),
          calendarId,
        );
        paid += result.updated;
      }

      return { deleted, created, paid };
    } catch (error) {
      return {
        ...empty,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

function dueEntryToCalendarInput(entry: DueEntryRow): CalendarEventInput {
  const expected = entry.source === "expected";
  return {
    issuerId: entry.issuerId,
    cardLast4: entry.cardLast4,
    bankLabel: entry.bankLabel,
    cardDisplayLabel: entry.cardDisplayLabel,
    fullPan: entry.fullPan,
    contactLine: entry.contactLine,
    dueDate: entry.dueDate,
    minimumDue: entry.minimumDue,
    totalDue: entry.totalDue,
    source: expected ? "expected" : undefined,
    soaUnavailable: expected,
  };
}
