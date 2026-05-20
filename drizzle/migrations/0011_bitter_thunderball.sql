CREATE TABLE "calculation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_name" text,
	"created_by" uuid,
	"criteria_count" integer NOT NULL,
	"alternative_count" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calculation_runs_criteria_count_positive" CHECK ("calculation_runs"."criteria_count" > 0),
	CONSTRAINT "calculation_runs_alternative_count_positive" CHECK ("calculation_runs"."alternative_count" > 0)
);
--> statement-breakpoint
ALTER TABLE "calculation_runs" ADD CONSTRAINT "calculation_runs_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;