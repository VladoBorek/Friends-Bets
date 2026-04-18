ALTER TABLE "bet" DROP CONSTRAINT "bet_wager_id_wager_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_wager_id_wager_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_outcome_id_outcome_id_fk";
--> statement-breakpoint
DROP INDEX "bet_user_wager_unique";--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_outcome_id_outcome_id_fk" FOREIGN KEY ("outcome_id") REFERENCES "public"."outcome"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bet" DROP COLUMN "wager_id";--> statement-breakpoint
ALTER TABLE "outcome" DROP COLUMN "odds";--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "wager_id";--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "reference_id";--> statement-breakpoint
ALTER TABLE "wager" DROP COLUMN "group";--> statement-breakpoint
ALTER TABLE "wager" DROP COLUMN "outcome_split";--> statement-breakpoint
ALTER TABLE "bet" ADD CONSTRAINT "bet_user_outcome_unique" UNIQUE("user_id","outcome_id");