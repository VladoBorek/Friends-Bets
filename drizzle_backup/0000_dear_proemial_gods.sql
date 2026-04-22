CREATE TABLE "bet" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"outcome_id" integer NOT NULL,
	"amount" numeric NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"wager_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"invite_code" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_membership" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"group_id" integer NOT NULL,
	"role" varchar NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"message" text NOT NULL,
	"type" varchar NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "outcome" (
	"id" serial PRIMARY KEY NOT NULL,
	"wager_id" integer NOT NULL,
	"title" varchar NOT NULL,
	"odds" numeric,
	"is_winner" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "role" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_wallet_id" integer,
	"to_wallet_id" integer,
	"type" varchar NOT NULL,
	"amount" numeric NOT NULL,
	"reference_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"avatar_url" varchar,
	"role_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wager" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"status" varchar DEFAULT 'OPEN',
	"category_id" integer NOT NULL,
	"created_by_id" integer NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"pool" varchar,
	"group" varchar,
	"outcome_split" json
);
--> statement-breakpoint
CREATE TABLE "wager_visibility" (
	"id" serial PRIMARY KEY NOT NULL,
	"wager_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"invited_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wallet" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"balance" numeric DEFAULT '0',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "wallet_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "bet" ADD CONSTRAINT "bet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bet" ADD CONSTRAINT "bet_outcome_id_outcome_id_fk" FOREIGN KEY ("outcome_id") REFERENCES "public"."outcome"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_wager_id_wager_id_fk" FOREIGN KEY ("wager_id") REFERENCES "public"."wager"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_membership" ADD CONSTRAINT "group_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_membership" ADD CONSTRAINT "group_membership_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome" ADD CONSTRAINT "outcome_wager_id_wager_id_fk" FOREIGN KEY ("wager_id") REFERENCES "public"."wager"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_from_wallet_id_wallet_id_fk" FOREIGN KEY ("from_wallet_id") REFERENCES "public"."wallet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_to_wallet_id_wallet_id_fk" FOREIGN KEY ("to_wallet_id") REFERENCES "public"."wallet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wager" ADD CONSTRAINT "wager_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wager" ADD CONSTRAINT "wager_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wager_visibility" ADD CONSTRAINT "wager_visibility_wager_id_wager_id_fk" FOREIGN KEY ("wager_id") REFERENCES "public"."wager"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wager_visibility" ADD CONSTRAINT "wager_visibility_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;