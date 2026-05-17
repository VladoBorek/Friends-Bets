CREATE TABLE "group_invitation" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"requester_id" integer NOT NULL,
	"addressee_id" integer NOT NULL,
	"status" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"responded_at" timestamp,
	CONSTRAINT "group_invitation_status_check" CHECK ("group_invitation"."status" in ('PENDING', 'ACCEPTED', 'REJECTED')),
	CONSTRAINT "group_invitation_not_self_check" CHECK ("group_invitation"."requester_id" <> "group_invitation"."addressee_id")
);
--> statement-breakpoint
ALTER TABLE "group_invitation" ADD CONSTRAINT "group_invitation_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_invitation" ADD CONSTRAINT "group_invitation_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_invitation" ADD CONSTRAINT "group_invitation_addressee_id_user_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "group_invitation_group_addressee_unique" ON "group_invitation" USING btree ("group_id","addressee_id");--> statement-breakpoint
CREATE INDEX "group_invitation_requester_idx" ON "group_invitation" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "group_invitation_addressee_idx" ON "group_invitation" USING btree ("addressee_id");