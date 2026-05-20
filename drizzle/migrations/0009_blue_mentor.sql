CREATE TABLE "alternative_technology_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alternative_id" uuid NOT NULL,
	"technology_feature_id" uuid NOT NULL,
	"is_available" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alternative_technology_features_alternative_technology_unique" UNIQUE("alternative_id","technology_feature_id")
);
--> statement-breakpoint
ALTER TABLE "alternative_technology_features" ADD CONSTRAINT "alternative_technology_features_alternative_id_alternatives_id_fk" FOREIGN KEY ("alternative_id") REFERENCES "public"."alternatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alternative_technology_features" ADD CONSTRAINT "alternative_technology_features_technology_feature_id_technology_features_id_fk" FOREIGN KEY ("technology_feature_id") REFERENCES "public"."technology_features"("id") ON DELETE cascade ON UPDATE no action;