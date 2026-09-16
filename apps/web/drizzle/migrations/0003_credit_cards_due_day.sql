ALTER TABLE "credit_cards" ADD COLUMN IF NOT EXISTS "due_day" integer;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_due_day_check" CHECK ("credit_cards"."due_day" between 1 and 31);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
