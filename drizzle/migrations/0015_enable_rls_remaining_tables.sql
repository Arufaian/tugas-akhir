-- Enable RLS
ALTER TABLE public.alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criterion_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technology_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternative_criterion_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternative_technology_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_results ENABLE ROW LEVEL SECURITY;

-- ALTERNATIVES
CREATE POLICY "alternatives_select_auth" ON public.alternatives FOR SELECT TO authenticated USING (true);
CREATE POLICY "alternatives_insert_admin" ON public.alternatives FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "alternatives_update_admin" ON public.alternatives FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "alternatives_delete_admin" ON public.alternatives FOR DELETE TO authenticated USING (is_admin());

-- CRITERIA
CREATE POLICY "criteria_select_auth" ON public.criteria FOR SELECT TO authenticated USING (true);
CREATE POLICY "criteria_insert_admin" ON public.criteria FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "criteria_update_admin" ON public.criteria FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "criteria_delete_admin" ON public.criteria FOR DELETE TO authenticated USING (is_admin());

-- CRITERION SCALES
CREATE POLICY "criterion_scales_select_auth" ON public.criterion_scales FOR SELECT TO authenticated USING (true);
CREATE POLICY "criterion_scales_insert_admin" ON public.criterion_scales FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "criterion_scales_update_admin" ON public.criterion_scales FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "criterion_scales_delete_admin" ON public.criterion_scales FOR DELETE TO authenticated USING (is_admin());

-- TECHNOLOGY FEATURES
CREATE POLICY "technology_features_select_auth" ON public.technology_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "technology_features_insert_admin" ON public.technology_features FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "technology_features_update_admin" ON public.technology_features FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "technology_features_delete_admin" ON public.technology_features FOR DELETE TO authenticated USING (is_admin());

-- ALTERNATIVE CRITERION VALUES
CREATE POLICY "alternative_criterion_values_select_auth" ON public.alternative_criterion_values FOR SELECT TO authenticated USING (true);
CREATE POLICY "alternative_criterion_values_insert_admin" ON public.alternative_criterion_values FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "alternative_criterion_values_update_admin" ON public.alternative_criterion_values FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "alternative_criterion_values_delete_admin" ON public.alternative_criterion_values FOR DELETE TO authenticated USING (is_admin());

-- ALTERNATIVE TECHNOLOGY FEATURES
CREATE POLICY "alternative_technology_features_select_auth" ON public.alternative_technology_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "alternative_technology_features_insert_admin" ON public.alternative_technology_features FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "alternative_technology_features_update_admin" ON public.alternative_technology_features FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "alternative_technology_features_delete_admin" ON public.alternative_technology_features FOR DELETE TO authenticated USING (is_admin());

-- CALCULATION RUNS
CREATE POLICY "calculation_runs_select_sales_own" ON public.calculation_runs FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "calculation_runs_select_admin_all" ON public.calculation_runs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "calculation_runs_insert_sales_own" ON public.calculation_runs FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "calculation_runs_insert_admin" ON public.calculation_runs FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "calculation_runs_update_admin" ON public.calculation_runs FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "calculation_runs_delete_admin" ON public.calculation_runs FOR DELETE TO authenticated USING (is_admin());

-- CALCULATION DETAILS
CREATE POLICY "calculation_details_select_sales_own_run" ON public.calculation_details FOR SELECT TO authenticated USING (calculation_run_id IN (SELECT id FROM public.calculation_runs WHERE created_by = auth.uid()));
CREATE POLICY "calculation_details_select_admin_all" ON public.calculation_details FOR SELECT TO authenticated USING (is_admin());

-- CALCULATION RESULTS
CREATE POLICY "calculation_results_select_sales_own_run" ON public.calculation_results FOR SELECT TO authenticated USING (calculation_run_id IN (SELECT id FROM public.calculation_runs WHERE created_by = auth.uid()));
CREATE POLICY "calculation_results_select_admin_all" ON public.calculation_results FOR SELECT TO authenticated USING (is_admin());
