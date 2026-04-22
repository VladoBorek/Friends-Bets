CREATE TABLE IF NOT EXISTS "friendship" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_id" integer NOT NULL,
	"addressee_id" integer NOT NULL,
	"status" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"responded_at" timestamp
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'friendship_not_self_check'
	) THEN
		ALTER TABLE "friendship"
		ADD CONSTRAINT "friendship_not_self_check"
		CHECK ("friendship"."requester_id" <> "friendship"."addressee_id");
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'friendship_requester_id_user_id_fk'
	) THEN
		ALTER TABLE "friendship"
		ADD CONSTRAINT "friendship_requester_id_user_id_fk"
		FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'friendship_addressee_id_user_id_fk'
	) THEN
		ALTER TABLE "friendship"
		ADD CONSTRAINT "friendship_addressee_id_user_id_fk"
		FOREIGN KEY ("addressee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "friendship_requester_addressee_unique"
ON "friendship" USING btree ("requester_id","addressee_id");
