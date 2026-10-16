ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "soa_advance_prompt_day" integer DEFAULT 20 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_soa_advance_prompt_day_check" CHECK ("users"."soa_advance_prompt_day" between 1 and 31);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
