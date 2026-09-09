CREATE TABLE "assumption_comments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"body" jsonb,
	"assumption_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"resolver_id" uuid,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assumption_comments" ADD CONSTRAINT "assumption_comments_assumption_id_assumptions_id_fk" FOREIGN KEY ("assumption_id") REFERENCES "public"."assumptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assumption_comments" ADD CONSTRAINT "assumption_comments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assumption_comments" ADD CONSTRAINT "assumption_comments_resolver_id_users_id_fk" FOREIGN KEY ("resolver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;