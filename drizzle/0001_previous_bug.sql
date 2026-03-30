CREATE TABLE "expert_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"expert_name" varchar(100) NOT NULL,
	"expert_archetype" varchar(100) NOT NULL,
	"friction" integer NOT NULL,
	"emotional_engagement" integer NOT NULL,
	"persuasiveness" integer NOT NULL,
	"clarity" integer NOT NULL,
	"trust" integer NOT NULL,
	"key_quote" text NOT NULL,
	"full_analysis" text NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "screenshot_viewport" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "screenshot_full" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "top_issues" jsonb;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "executive_summary" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "expert_analyses" ADD CONSTRAINT "expert_analyses_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expert_analyses_job_id_idx" ON "expert_analyses" USING btree ("job_id");