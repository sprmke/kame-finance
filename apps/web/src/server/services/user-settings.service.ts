import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { db } from "@/lib/db";
import {
  DEFAULT_SOA_ADVANCE_PROMPT_DAY,
  users,
} from "@/lib/db/schema";

export type UserWorkflowSettings = {
  timezone: string;
  soaAdvancePromptDay: number;
};

export const userSettingsService = {
  async getWorkflowSettings(userId: string): Promise<UserWorkflowSettings> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { timezone: true, soaAdvancePromptDay: true },
    });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }
    return {
      timezone: user.timezone?.trim() || "Asia/Manila",
      soaAdvancePromptDay:
        user.soaAdvancePromptDay ?? DEFAULT_SOA_ADVANCE_PROMPT_DAY,
    };
  },

  async updateSoaAdvancePromptDay(userId: string, day: number) {
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Day must be between 1 and 31",
      });
    }
    await db
      .update(users)
      .set({ soaAdvancePromptDay: day, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return this.getWorkflowSettings(userId);
  },
};
