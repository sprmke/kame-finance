import { z } from "zod";

import { protectedProcedure, router } from "@/server/trpc";
import { userSettingsService } from "@/server/services/user-settings.service";

export const settingsRouter = router({
  getWorkflow: protectedProcedure.query(({ ctx }) =>
    userSettingsService.getWorkflowSettings(ctx.user.id),
  ),

  updateSoaAdvancePromptDay: protectedProcedure
    .input(z.object({ day: z.number().int().min(1).max(31) }))
    .mutation(({ ctx, input }) =>
      userSettingsService.updateSoaAdvancePromptDay(ctx.user.id, input.day),
    ),
});