CREATE TABLE "criterion_scales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"criterion_id" uuid NOT NULL,
	"label" text NOT NULL,
	"value" numeric(10, 4) NOT NULL,
	"description" text,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "criterion_scales" ADD CONSTRAINT "criterion_scales_criterion_id_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."criteria"("id") ON DELETE cascade ON UPDATE no action;