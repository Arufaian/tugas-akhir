ALTER TABLE "criteria" ADD COLUMN "is_price" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "criteria"
SET "is_price" = true
WHERE lower(btrim("name")) = 'harga'
	AND "is_active" = true
	AND "type" = 'cost'
	AND "input_type" = 'number'
	AND "unit" = 'Rp';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_criteria_single_price" ON "criteria" USING btree ("is_price") WHERE "criteria"."is_price" = true;--> statement-breakpoint
ALTER TABLE "criteria" ADD CONSTRAINT "criteria_price_invariants" CHECK (NOT "criteria"."is_price" OR ("criteria"."is_active" AND "criteria"."type" = 'cost' AND "criteria"."input_type" = 'number' AND "criteria"."unit" = 'Rp'));--> statement-breakpoint
CREATE FUNCTION public.protect_price_criterion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
	IF TG_OP = 'DELETE' THEN
		IF OLD.is_price THEN
			RAISE EXCEPTION 'Kriteria harga tidak dapat dihapus' USING ERRCODE = '23514';
		END IF;

		RETURN OLD;
	END IF;

	IF OLD.is_price AND NOT NEW.is_price THEN
		RAISE EXCEPTION 'Penanda kriteria harga tidak dapat dihapus' USING ERRCODE = '23514';
	END IF;

	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER protect_price_criterion
BEFORE UPDATE OF is_price OR DELETE ON public.criteria
FOR EACH ROW
EXECUTE FUNCTION public.protect_price_criterion();
