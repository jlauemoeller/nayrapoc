ALTER TABLE "decisions" DROP CONSTRAINT "decisions_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "decisions" DROP COLUMN "rationale";--> statement-breakpoint
ALTER TABLE "decisions" ADD COLUMN "rationale" jsonb;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;