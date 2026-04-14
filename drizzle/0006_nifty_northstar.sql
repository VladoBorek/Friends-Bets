ALTER TABLE "transaction" DROP CONSTRAINT "transaction_from_wallet_id_wallet_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_to_wallet_id_wallet_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "user_id" integer;
--> statement-breakpoint
UPDATE "transaction" t
SET "user_id" = COALESCE(
  (SELECT w_to."user_id" FROM "wallet" w_to WHERE w_to."id" = t."to_wallet_id"),
  (SELECT w_from."user_id" FROM "wallet" w_from WHERE w_from."id" = t."from_wallet_id")
);
--> statement-breakpoint
DELETE FROM "transaction" WHERE "user_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "from_wallet_id";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "to_wallet_id";