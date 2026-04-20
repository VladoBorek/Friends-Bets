ALTER TABLE "transaction" DROP CONSTRAINT "transaction_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "wallet_id" integer;
--> statement-breakpoint
UPDATE "transaction" t
SET "wallet_id" = w."id"
FROM "wallet" w
WHERE w."user_id" = t."user_id";
--> statement-breakpoint
DELETE FROM "transaction" WHERE "wallet_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "wallet_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_wallet_id_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "user_id";