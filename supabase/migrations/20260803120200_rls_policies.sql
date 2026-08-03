-- Row Level Security policies and role helpers
-- See docs/SCHEMA.md

-- ---------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER, stable)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'student'
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_opportunity(target_opportunity_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.opportunities
    WHERE id = target_opportunity_id AND teacher_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_student_row(target_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE id = target_student_id AND user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_teacher() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_student() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_opportunity(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_student_row(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_student() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_opportunity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_student_row(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_project_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_required_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_recommended_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_required_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE POLICY profiles_select_own_or_staff
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher() OR public.is_admin());

CREATE POLICY profiles_update_own_or_admin
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY profiles_insert_own
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------------
CREATE POLICY students_select_own_or_staff
  ON public.students FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher() OR public.is_admin());

CREATE POLICY students_insert_own_or_admin
  ON public.students FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY students_update_own_or_admin
  ON public.students FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY students_delete_admin
  ON public.students FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- student child tables
-- ---------------------------------------------------------------------------
CREATE POLICY student_courses_select
  ON public.student_courses FOR SELECT TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.is_teacher()
    OR public.is_admin()
  );

CREATE POLICY student_courses_mutate_own
  ON public.student_courses FOR ALL TO authenticated
  USING (public.owns_student_row(student_id) OR public.is_admin())
  WITH CHECK (public.owns_student_row(student_id) OR public.is_admin());

CREATE POLICY student_skills_select
  ON public.student_skills FOR SELECT TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.is_teacher()
    OR public.is_admin()
  );

CREATE POLICY student_skills_mutate_own
  ON public.student_skills FOR ALL TO authenticated
  USING (public.owns_student_row(student_id) OR public.is_admin())
  WITH CHECK (public.owns_student_row(student_id) OR public.is_admin());

CREATE POLICY student_interests_select
  ON public.student_interests FOR SELECT TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.is_teacher()
    OR public.is_admin()
  );

CREATE POLICY student_interests_mutate_own
  ON public.student_interests FOR ALL TO authenticated
  USING (public.owns_student_row(student_id) OR public.is_admin())
  WITH CHECK (public.owns_student_row(student_id) OR public.is_admin());

CREATE POLICY student_prefs_select
  ON public.student_project_preferences FOR SELECT TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.is_teacher()
    OR public.is_admin()
  );

CREATE POLICY student_prefs_mutate_own
  ON public.student_project_preferences FOR ALL TO authenticated
  USING (public.owns_student_row(student_id) OR public.is_admin())
  WITH CHECK (public.owns_student_row(student_id) OR public.is_admin());

-- ---------------------------------------------------------------------------
-- opportunities
-- ---------------------------------------------------------------------------
CREATE POLICY opportunities_select_authenticated
  ON public.opportunities FOR SELECT TO authenticated
  USING (true);

CREATE POLICY opportunities_insert_teacher
  ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid() AND public.is_teacher());

CREATE POLICY opportunities_update_own_or_admin
  ON public.opportunities FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() OR public.is_admin())
  WITH CHECK (teacher_id = auth.uid() OR public.is_admin());

CREATE POLICY opportunities_delete_own_or_admin
  ON public.opportunities FOR DELETE TO authenticated
  USING (teacher_id = auth.uid() OR public.is_admin());

-- opportunity children: readable by authenticated; writable by owner/admin
CREATE POLICY opportunity_required_courses_select
  ON public.opportunity_required_courses FOR SELECT TO authenticated
  USING (true);

CREATE POLICY opportunity_required_courses_mutate
  ON public.opportunity_required_courses FOR ALL TO authenticated
  USING (public.owns_opportunity(opportunity_id) OR public.is_admin())
  WITH CHECK (public.owns_opportunity(opportunity_id) OR public.is_admin());

CREATE POLICY opportunity_recommended_courses_select
  ON public.opportunity_recommended_courses FOR SELECT TO authenticated
  USING (true);

CREATE POLICY opportunity_recommended_courses_mutate
  ON public.opportunity_recommended_courses FOR ALL TO authenticated
  USING (public.owns_opportunity(opportunity_id) OR public.is_admin())
  WITH CHECK (public.owns_opportunity(opportunity_id) OR public.is_admin());

CREATE POLICY opportunity_required_skills_select
  ON public.opportunity_required_skills FOR SELECT TO authenticated
  USING (true);

CREATE POLICY opportunity_required_skills_mutate
  ON public.opportunity_required_skills FOR ALL TO authenticated
  USING (public.owns_opportunity(opportunity_id) OR public.is_admin())
  WITH CHECK (public.owns_opportunity(opportunity_id) OR public.is_admin());

CREATE POLICY opportunity_weights_select
  ON public.opportunity_weights FOR SELECT TO authenticated
  USING (true);

CREATE POLICY opportunity_weights_mutate
  ON public.opportunity_weights FOR ALL TO authenticated
  USING (public.owns_opportunity(opportunity_id) OR public.is_admin())
  WITH CHECK (public.owns_opportunity(opportunity_id) OR public.is_admin());

-- ---------------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------------
CREATE POLICY applications_select_own_or_owner_or_admin
  ON public.applications FOR SELECT TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.owns_opportunity(opportunity_id)
    OR public.is_admin()
  );

CREATE POLICY applications_insert_own_student
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (public.owns_student_row(student_id) OR public.is_admin());

CREATE POLICY applications_update_own_or_owner_or_admin
  ON public.applications FOR UPDATE TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.owns_opportunity(opportunity_id)
    OR public.is_admin()
  )
  WITH CHECK (
    public.owns_student_row(student_id)
    OR public.owns_opportunity(opportunity_id)
    OR public.is_admin()
  );

CREATE POLICY applications_delete_admin
  ON public.applications FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
CREATE POLICY matches_select_own_or_owner_or_admin
  ON public.matches FOR SELECT TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.owns_opportunity(opportunity_id)
    OR public.is_admin()
  );

-- Matching engine writes via service role; allow teachers/admins to upsert for ops
CREATE POLICY matches_insert_staff
  ON public.matches FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher() OR public.is_admin());

CREATE POLICY matches_update_staff
  ON public.matches FOR UPDATE TO authenticated
  USING (public.is_teacher() OR public.is_admin())
  WITH CHECK (public.is_teacher() OR public.is_admin());

CREATE POLICY matches_delete_admin
  ON public.matches FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE POLICY notifications_select_own
  ON public.notifications FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid() OR public.is_admin());

CREATE POLICY notifications_update_own
  ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid() OR public.is_admin())
  WITH CHECK (recipient_user_id = auth.uid() OR public.is_admin());

CREATE POLICY notifications_insert_admin
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR recipient_user_id = auth.uid());
