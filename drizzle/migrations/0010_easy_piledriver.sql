CREATE TABLE "alternative_criterion_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alternative_id" uuid NOT NULL,
	"criterion_id" uuid NOT NULL,
	"raw_value" numeric(14, 4) NOT NULL,
	"label_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alternative_criterion_values_alternative_criterion_unique" UNIQUE("alternative_id","criterion_id"),
	CONSTRAINT "alternative_criterion_values_raw_value_non_negative" CHECK ("alternative_criterion_values"."raw_value" >= 0)
);
--> statement-breakpoint
ALTER TABLE "alternative_criterion_values" ADD CONSTRAINT "alternative_criterion_values_alternative_id_alternatives_id_fk" FOREIGN KEY ("alternative_id") REFERENCES "public"."alternatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alternative_criterion_values" ADD CONSTRAINT "alternative_criterion_values_criterion_id_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."criteria"("id") ON DELETE cascade ON UPDATE no action;