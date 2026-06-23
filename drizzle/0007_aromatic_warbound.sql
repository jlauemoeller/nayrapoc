--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "description" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "description" SET DATA TYPE jsonb;
