import { z } from "zod";

import { overviewService } from "@/server/services/overview.service";
import { protectedProcedure, router } from "@/server/trpc";

const overviewStatsInput = z
  .object({
    grain: z.enum(["month", "year"]),
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
  })
  .optional();

export const overviewRouter = router({
  stats: protectedProcedure.input(overviewStatsInput).query(({ ctx, input }) =>
    overviewService.getStats(ctx.user.id, input),
  ),
});
