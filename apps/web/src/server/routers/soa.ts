import { z } from "zod";

import { protectedProcedure, router } from "@/server/trpc";
import { soaManualEntryService } from "@/server/services/soa-manual-entry.service";
import { soaManualUploadService } from "@/server/services/soa-manual-upload.service";
import { soaPeriodService } from "@/server/services/soa-period.service";
import { soaRunProgressService } from "@/server/services/soa-run-progress.service";
import { soaService } from "@/server/services/soa.service";

const runSoaInputSchema = z.object({
  mode: z.enum(["single", "range"]),
  fromMonth: z.number().int().min(1).max(12),
  fromYear: z.number().int().min(2000).max(2100),
  toMonth: z.number().int().min(1).max(12),
  toYear: z.number().int().min(2000).max(2100),
  monthCount: z.number().int().min(1).max(60).optional(),
  notifyTelegram: z.boolean(),
  notifySlack: z.boolean(),
  createCalendar: z.boolean(),
  runId: z.string().uuid().optional(),
});

const updatePeriodSchema = z.object({
  periodId: z.string().uuid(),
  notifyTelegram: z.boolean().optional(),
  notifySlack: z.boolean().optional(),
  createCalendar: z.boolean().optional(),
});

export const soaRouter = router({
  listPeriods: protectedProcedure.query(({ ctx }) =>
    soaPeriodService.listPeriods(ctx.user.id),
  ),

  getPeriod: protectedProcedure
    .input(z.object({ periodId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      soaPeriodService.getPeriod(ctx.user.id, input.periodId),
    ),

  getStatement: protectedProcedure
    .input(
      z.object({
        periodId: z.string().uuid(),
        statementId: z.string().uuid(),
      }),
    )
    .query(({ ctx, input }) =>
      soaPeriodService.getStatement(
        ctx.user.id,
        input.periodId,
        input.statementId,
      ),
    ),

  updatePeriod: protectedProcedure
    .input(updatePeriodSchema)
    .mutation(({ ctx, input }) => {
      const { periodId, ...data } = input;
      return soaPeriodService.updatePeriod(ctx.user.id, periodId, data);
    }),

  deletePeriod: protectedProcedure
    .input(z.object({ periodId: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      soaPeriodService.deletePeriod(ctx.user.id, input.periodId),
    ),

  list: protectedProcedure.query(({ ctx }) =>
    soaService.listStatements(ctx.user.id),
  ),

  runPipeline: protectedProcedure
    .input(runSoaInputSchema)
    .mutation(({ ctx, input }) =>
      soaService.runSoaPipeline(ctx.user.id, input),
    ),

  getRunProgress: protectedProcedure
    .input(z.object({ runId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      soaRunProgressService.getSnapshot(ctx.user.id, input.runId),
    ),

  dedupe: protectedProcedure.mutation(({ ctx }) =>
    soaService.dedupeStatements(ctx.user.id),
  ),

  clearHistory: protectedProcedure.mutation(({ ctx }) =>
    soaService.clearHistory(ctx.user.id),
  ),

  createManualEntry: protectedProcedure
    .input(
      z.object({
        periodId: z.string().uuid(),
        creditCardId: z.string().uuid(),
        statementMonth: z.number().int().min(1).max(12),
        statementYear: z.number().int().min(2000).max(2100),
        statementDate: z.string().min(1).max(32),
        dueDate: z.string().min(1).max(32),
        minimumDue: z.number().min(0).max(100_000_000),
        totalDue: z.number().min(0).max(100_000_000),
        transactions: z
          .array(
            z.object({
              date: z.string().min(1).max(32),
              description: z.string().trim().min(1).max(500),
              amount: z.number().positive().max(100_000_000),
              credit: z.boolean(),
              categorySlug: z.string().min(1).max(32).optional(),
            }),
          )
          .max(300),
      }),
    )
    .mutation(({ ctx, input }) =>
      soaManualEntryService.create(ctx.user.id, input),
    ),

  processManualUpload: protectedProcedure
    .input(
      z.object({
        periodId: z.string().uuid(),
        storagePath: z.string().min(1),
        originalFileName: z.string().min(1).max(512),
        mimeType: z.string().max(128).optional(),
        forceMonth: z.number().int().min(1).max(12).optional(),
        forceYear: z.number().int().min(2000).max(2100).optional(),
        allowOutOfRange: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      soaManualUploadService.process(ctx.user.id, input),
    ),
});
