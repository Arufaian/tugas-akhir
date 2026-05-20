CREATE TABLE "calculation_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calculation_run_id" uuid NOT NULL,
	"alternative_id" uuid NOT NULL,
	"total_benefit" numeric(18, 9) NOT NULL,
	"total_cost" numeric(18, 9) NOT NULL,
	"optimization_score" numeric(18, 9) NOT NULL,
	"rank" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calculation_results_run_alternative_unique" UNIQUE("calculation_run_id","alternative_id"),
	CONSTRAINT "calculation_results_run_rank_unique" UNIQUE("calculation_run_id","rank"),
	CONSTRAINT "calculation_results_rank_positive" CHECK ("calculation_results"."rank" > 0)
);
--> statement-breakpoint
ALTER TABLE "calculation_results" ADD CONSTRAINT "calculation_results_calculation_run_id_calculation_runs_id_fk" FOREIGN KEY ("calculation_run_id") REFERENCES "public"."calculation_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculation_results" ADD CONSTRAINT "calculation_results_alternative_id_alternatives_id_fk" FOREIGN KEY ("alternative_id") REFERENCES "public"."alternatives"("id") ON DELETE cascade ON UPDATE no action;