CREATE TABLE "criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"unit" text,
	"raw_weight" numeric(10, 4) NOT NULL,
	"normalized_weight" numeric(12, 9) NOT NULL,
	"type" "criterion_type" NOT NULL,
	"order_index" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "criteria_code_unique" UNIQUE("code")
);
