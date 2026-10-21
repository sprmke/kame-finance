ALTER TABLE "credit_cards" ADD COLUMN IF NOT EXISTS "card_network" varchar(32);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_card_network_check" CHECK ("credit_cards"."card_network" is null or "credit_cards"."card_network" in ('visa', 'mastercard', 'amex', 'jcb', 'unionpay', 'diners'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
