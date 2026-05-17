ALTER TABLE "wager" ADD COLUMN "group_id" integer;--> statement-breakpoint
ALTER TABLE "wager" ADD CONSTRAINT "wager_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "group_invite_code_unique" ON "group" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "group_created_at_idx" ON "group" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "group_membership_user_group_unique" ON "group_membership" USING btree ("user_id","group_id");--> statement-breakpoint
CREATE INDEX "group_membership_user_idx" ON "group_membership" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "group_membership_group_idx" ON "group_membership" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "wager_group_status_idx" ON "wager" USING btree ("group_id","status");--> statement-breakpoint
ALTER TABLE "group_membership" ADD CONSTRAINT "group_membership_role_check" CHECK ("group_membership"."role" in ('OWNER', 'MEMBER'));