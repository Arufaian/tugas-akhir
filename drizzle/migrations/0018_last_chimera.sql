CREATE TYPE "public"."input_type" AS ENUM('number', 'scale', 'tech_features');--> statement-breakpoint
ALTER TABLE "criteria" ADD COLUMN "input_type" "input_type" DEFAULT 'number' NOT NULL;