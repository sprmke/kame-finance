import { router } from "@/server/trpc";

import { aiKeysRouter } from "./ai-keys";
import { automationsRouter } from "./automations";
import { creditCardsRouter } from "./credit-cards";
import { integrationsRouter } from "./integrations";
import { overviewRouter } from "./overview";
import { receiptsRouter } from "./receipts";
import { settingsRouter } from "./settings";
import { remindersRouter } from "./reminders";
import { soaRouter } from "./soa";
import { transactionCategoriesRouter } from "./transaction-categories";

export const appRouter = router({
  overview: overviewRouter,
  creditCards: creditCardsRouter,
  soa: soaRouter,
  transactionCategories: transactionCategoriesRouter,
  reminders: remindersRouter,
  integrations: integrationsRouter,
  aiKeys: aiKeysRouter,
  automations: automationsRouter,
  receipts: receiptsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
