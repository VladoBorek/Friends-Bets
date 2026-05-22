ALTER TABLE "notification" DROP COLUMN "message";
--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "data" jsonb DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "source_key" varchar;
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_source_key_unique" UNIQUE("source_key");
