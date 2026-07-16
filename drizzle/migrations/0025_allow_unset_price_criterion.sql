DROP TRIGGER "protect_price_criterion" ON public.criteria;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.protect_price_criterion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
	IF OLD.is_price THEN
		RAISE EXCEPTION 'Lepaskan penanda filter harga sebelum menghapus kriteria'
			USING ERRCODE = '23514';
	END IF;

	RETURN OLD;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER protect_price_criterion
BEFORE DELETE ON public.criteria
FOR EACH ROW
EXECUTE FUNCTION public.protect_price_criterion();