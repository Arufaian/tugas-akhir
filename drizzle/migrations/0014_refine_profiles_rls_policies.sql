CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
	RETURN EXISTS (
		SELECT 1
		FROM public.profiles
		WHERE id = auth.uid() AND role = 'admin'
	);
END;
$$;

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_admin"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "profiles_select_admin_all"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
	id = auth.uid()
	AND role IS NOT DISTINCT FROM (
		SELECT role FROM public.profiles WHERE id = auth.uid()
	)
);

CREATE POLICY "profiles_update_admin_all"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "profiles_delete_admin_all"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_admin());
