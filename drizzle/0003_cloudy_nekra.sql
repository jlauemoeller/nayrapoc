CREATE TABLE "assumptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" jsonb,
	"decision_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"confidence" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assumptions" ADD CONSTRAINT "assumptions_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assumptions" ADD CONSTRAINT "assumptions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;