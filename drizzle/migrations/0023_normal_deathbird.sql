ALTER TABLE "calculation_details" RENAME COLUMN "criterionType" TO "criterion_type";--> statement-breakpoint
ALTER TABLE "calculation_details" DROP CONSTRAINT "calculation_details_alternative_id_alternatives_id_fk";
--> statement-breakpoint
ALTER TABLE "calculation_details" DROP CONSTRAINT "calculation_details_criterion_id_criteria_id_fk";
--> statement-breakpoint
ALTER TABLE "calculation_results" DROP CONSTRAINT "calculation_results_alternative_id_alternatives_id_fk";
--> statement-breakpoint
ALTER TABLE "calculation_details" ADD COLUMN "criterion_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "calculation_details" ADD COLUMN "criterion_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "calculation_details" ADD COLUMN "criterion_unit" text NOT NULL;--> statement-breakpoint
ALTER TABLE "calculation_details" ADD COLUMN "criterion_order_index" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "calculation_details" ADD COLUMN "criterion_input_type" "input_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "calculation_details" ADD COLUMN "label_value" text;--> statement-breakpoint
ALTER TABLE "calculation_results" ADD COLUMN "alternative_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "calculation_results" ADD COLUMN "alternative_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "calculation_details" ADD CONSTRAINT "calculation_details_alternative_id_alternatives_id_fk" FOREIGN KEY ("alternative_id") REFERENCES "public"."alternatives"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculation_details" ADD CONSTRAINT "calculation_details_criterion_id_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."criteria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculation_results" ADD CONSTRAINT "calculation_results_alternative_id_alternatives_id_fk" FOREIGN KEY ("alternative_id") REFERENCES "public"."alternatives"("id") ON DELETE restrict ON UPDATE no action;
