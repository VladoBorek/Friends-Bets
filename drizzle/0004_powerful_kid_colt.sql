ALTER TABLE "bet" ADD COLUMN "wager_id" integer;--> statement-breakpoint
UPDATE "bet"
SET "wager_id" = "outcome"."wager_id"
FROM "outcome"
WHERE "bet"."outcome_id" = "outcome"."id";--> statement-breakpoint
ALTER TABLE "bet" ALTER COLUMN "wager_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "wager_id" integer;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "outcome_id" integer;--> statement-breakpoint
ALTER TABLE "bet" ADD CONSTRAINT "bet_wager_id_wager_id_fk" FOREIGN KEY ("wager_id") REFERENCES "public"."wager"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_wager_id_wager_id_fk" FOREIGN KEY ("wager_id") REFERENCES "public"."wager"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_outcome_id_outcome_id_fk" FOREIGN KEY ("outcome_id") REFERENCES "public"."outcome"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bet_user_wager_unique" ON "bet" USING btree ("user_id","wager_id");