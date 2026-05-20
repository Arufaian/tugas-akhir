CREATE TABLE "calculation_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calculation_run_id" uuid NOT NULL,
	"alternative_id" uuid NOT NULL,
	"criterion_id" uuid NOT NULL,
	"raw_value" numeric(14, 4) NOT NULL,
	"denominator" numeric(18, 9) NOT NULL,
	"normalized_value" numeric(18, 9) NOT NULL,
	"weight" numeric(12, 9) NOT NULL,
	"weighted_value" numeric(18, 9) NOT NULL,
	"criterionType" "criterion_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calculation_details_run_alternative_criterion_unique" UNIQUE("calculation_run_id","alternative_id","criterion_id")
);
--> statement-breakpoint
ALTER TABLE "calculation_details" ADD CONSTRAINT "calculation_details_calculation_run_id_calculation_runs_id_fk" FOREIGN KEY ("calculation_run_id") REFERENCES "public"."calculation_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculation_details" ADD CONSTRAINT "calculation_details_alternative_id_alternatives_id_fk" FOREIGN KEY ("alternative_id") REFERENCES "public"."alternatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculation_details" ADD CONSTRAINT "calculation_details_criterion_id_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."criteria"("id") ON DELETE cascade ON UPDATE no action;