ALTER TABLE "assumptions" ADD COLUMN "rationale_ai_evaluated_at" timestamp;--> statement-breakpoint
ALTER TABLE "assumptions" ADD COLUMN "rationale_ai_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "assumptions" ADD COLUMN "rationale_ai_evaluation" text;--> statement-breakpoint
ALTER TABLE "assumptions" ADD COLUMN "rationale_ai_rating" text;