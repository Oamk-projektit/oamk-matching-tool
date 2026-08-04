-- Row Level Security for projects-model schema
-- See docs/SCHEMA.md and docs/API.md privacy model.

-- ---------------------------------------------------------------------------
-- Role / ownership helpers (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
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
    WHERE id = auth.uid() AND role = 'admin'
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
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'company'
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
    WHERE id = auth.uid() AND role = 'student'
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
    WHERE id = target_student_id AND profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.member_of_company(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE company_id = target_company_id AND profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_project(target_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.company_users cu ON cu.company_id = p.company_id
    WHERE p.id = target_project_id AND cu.profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_project_staff(target_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.owns_project(target_project_id)
    OR public.is_teacher_or_admin();
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_teacher() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_teacher_or_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_company_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_student() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_student_row(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.member_of_company(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_project(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_view_project_staff(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_student() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_student_row(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.member_of_company(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_project_staff(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_required_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_recommended_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_required_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_recommended_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selection_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE POLICY profiles_select_own_or_staff
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_teacher_or_admin()
    OR EXISTS (
      -- Company may see profiles of students who applied to their projects
      SELECT 1
      FROM public.students s
      JOIN public.applications a ON a.student_id = s.id
      WHERE s.profile_id = profiles.id
        AND public.owns_project(a.project_id)
    )
  );

CREATE POLICY profiles_update_own_or_admin
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY profiles_insert_own
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- companies / company_users
-- ---------------------------------------------------------------------------
CREATE POLICY companies_select
  ON public.companies FOR SELECT TO authenticated
  USING (
    public.member_of_company(id)
    OR public.is_teacher_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.company_id = companies.id AND p.status = 'published'
    )
  );

CREATE POLICY companies_insert_company_or_admin
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.is_company_role() OR public.is_admin());

CREATE POLICY companies_update_member_or_admin
  ON public.companies FOR UPDATE TO authenticated
  USING (public.member_of_company(id) OR public.is_admin())
  WITH CHECK (public.member_of_company(id) OR public.is_admin());

CREATE POLICY companies_delete_admin
  ON public.companies FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY company_users_select
  ON public.company_users FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR public.member_of_company(company_id)
    OR public.is_teacher_or_admin()
  );

CREATE POLICY company_users_insert_self_or_admin
  ON public.company_users FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (profile_id = auth.uid() AND public.is_company_role())
  );

CREATE POLICY company_users_update_admin
  ON public.company_users FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY company_users_delete_admin
  ON public.company_users FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- catalogs (readable by authenticated; admin mutate)
-- ---------------------------------------------------------------------------
CREATE POLICY courses_select_authenticated
  ON public.courses FOR SELECT TO authenticated
  USING (true);

CREATE POLICY courses_mutate_admin
  ON public.courses FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY skills_select_authenticated
  ON public.skills FOR SELECT TO authenticated
  USING (true);

CREATE POLICY skills_mutate_admin
  ON public.skills FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY interests_select_authenticated
  ON public.interests FOR SELECT TO authenticated
  USING (true);

CREATE POLICY interests_mutate_admin
  ON public.interests FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- students + child tables
-- ---------------------------------------------------------------------------
CREATE POLICY students_select_own_or_staff
  ON public.students FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR public.is_teacher_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.student_id = students.id
        AND public.owns_project(a.project_id)
    )
  );

CREATE POLICY students_insert_own_or_admin
  ON public.students FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() OR public.is_admin());

CREATE POLICY students_update_own_or_admin
  ON public.students FOR UPDATE TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin())
  WITH CHECK (profile_id = auth.uid() OR public.is_admin());

CREATE POLICY students_delete_admin
  ON public.students FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY student_courses_select
  ON public.student_courses FOR SELECT TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.is_teacher_or_admin()
  );

CREATE POLICY student_courses_mutate_own
  ON public.student_courses FOR ALL TO authenticated
  USING (public.owns_student_row(student_id) OR public.is_admin())
  WITH CHECK (public.owns_student_row(student_id) OR public.is_admin());

CREATE POLICY student_skills_select
  ON public.student_skills FOR SELECT TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.is_teacher_or_admin()
  );

CREATE POLICY student_skills_mutate_own
  ON public.student_skills FOR ALL TO authenticated
  USING (public.owns_student_row(student_id) OR public.is_admin())
  WITH CHECK (public.owns_student_row(student_id) OR public.is_admin());

CREATE POLICY student_interests_select
  ON public.student_interests FOR SELECT TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.is_teacher_or_admin()
  );

CREATE POLICY student_interests_mutate_own
  ON public.student_interests FOR ALL TO authenticated
  USING (public.owns_student_row(student_id) OR public.is_admin())
  WITH CHECK (public.owns_student_row(student_id) OR public.is_admin());

-- ---------------------------------------------------------------------------
-- projects: published visible; drafts only to owner / staff
-- ---------------------------------------------------------------------------
CREATE POLICY projects_select_published_or_owner_or_staff
  ON public.projects FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR public.owns_project(id)
    OR public.is_teacher_or_admin()
  );

CREATE POLICY projects_insert_company_or_admin
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.member_of_company(company_id)
  );

CREATE POLICY projects_update_owner_or_admin
  ON public.projects FOR UPDATE TO authenticated
  USING (public.owns_project(id) OR public.is_admin())
  WITH CHECK (public.owns_project(id) OR public.is_admin());

CREATE POLICY projects_delete_owner_or_admin
  ON public.projects FOR DELETE TO authenticated
  USING (public.owns_project(id) OR public.is_admin());

-- Project children follow parent visibility
CREATE POLICY project_required_courses_select
  ON public.project_required_courses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.status = 'published'
          OR public.owns_project(p.id)
          OR public.is_teacher_or_admin()
        )
    )
  );

CREATE POLICY project_required_courses_mutate
  ON public.project_required_courses FOR ALL TO authenticated
  USING (public.owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.owns_project(project_id) OR public.is_admin());

CREATE POLICY project_recommended_courses_select
  ON public.project_recommended_courses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.status = 'published'
          OR public.owns_project(p.id)
          OR public.is_teacher_or_admin()
        )
    )
  );

CREATE POLICY project_recommended_courses_mutate
  ON public.project_recommended_courses FOR ALL TO authenticated
  USING (public.owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.owns_project(project_id) OR public.is_admin());

CREATE POLICY project_required_skills_select
  ON public.project_required_skills FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.status = 'published'
          OR public.owns_project(p.id)
          OR public.is_teacher_or_admin()
        )
    )
  );

CREATE POLICY project_required_skills_mutate
  ON public.project_required_skills FOR ALL TO authenticated
  USING (public.owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.owns_project(project_id) OR public.is_admin());

CREATE POLICY project_recommended_skills_select
  ON public.project_recommended_skills FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.status = 'published'
          OR public.owns_project(p.id)
          OR public.is_teacher_or_admin()
        )
    )
  );

CREATE POLICY project_recommended_skills_mutate
  ON public.project_recommended_skills FOR ALL TO authenticated
  USING (public.owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.owns_project(project_id) OR public.is_admin());

CREATE POLICY project_interests_select
  ON public.project_interests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.status = 'published'
          OR public.owns_project(p.id)
          OR public.is_teacher_or_admin()
        )
    )
  );

CREATE POLICY project_interests_mutate
  ON public.project_interests FOR ALL TO authenticated
  USING (public.owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.owns_project(project_id) OR public.is_admin());

-- Weights visible with published projects (transparency); no peer scores here
CREATE POLICY project_weights_select
  ON public.project_weights FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.status = 'published'
          OR public.owns_project(p.id)
          OR public.is_teacher_or_admin()
        )
    )
  );

CREATE POLICY project_weights_mutate
  ON public.project_weights FOR ALL TO authenticated
  USING (public.owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.owns_project(project_id) OR public.is_admin());

-- ---------------------------------------------------------------------------
-- applications: own student OR project staff (not other companies)
-- ---------------------------------------------------------------------------
CREATE POLICY applications_select_own_or_project_staff
  ON public.applications FOR SELECT TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.can_view_project_staff(project_id)
  );

CREATE POLICY applications_insert_own_student
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (public.owns_student_row(student_id) OR public.is_admin());

CREATE POLICY applications_update_own_or_project_owner_or_admin
  ON public.applications FOR UPDATE TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.owns_project(project_id)
    OR public.is_admin()
  )
  WITH CHECK (
    public.owns_student_row(student_id)
    OR public.owns_project(project_id)
    OR public.is_admin()
  );

CREATE POLICY applications_delete_admin
  ON public.applications FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- matches: student sees ONLY own row (no Top-N / peer scores)
-- ---------------------------------------------------------------------------
CREATE POLICY matches_select_own_or_project_staff
  ON public.matches FOR SELECT TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.can_view_project_staff(project_id)
  );

CREATE POLICY matches_insert_staff_or_own_student
  ON public.matches FOR INSERT TO authenticated
  WITH CHECK (
    public.owns_student_row(student_id)
    OR public.owns_project(project_id)
    OR public.is_teacher_or_admin()
  );

CREATE POLICY matches_update_staff_or_own_student
  ON public.matches FOR UPDATE TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.owns_project(project_id)
    OR public.is_teacher_or_admin()
  )
  WITH CHECK (
    public.owns_student_row(student_id)
    OR public.owns_project(project_id)
    OR public.is_teacher_or_admin()
  );

CREATE POLICY matches_delete_admin
  ON public.matches FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- selection_decisions: company on own projects; admin; teachers read-only
-- Teachers/admins must NOT make final selection unless admin (documented).
-- ---------------------------------------------------------------------------
CREATE POLICY selection_decisions_select
  ON public.selection_decisions FOR SELECT TO authenticated
  USING (
    public.owns_student_row(student_id)
    OR public.can_view_project_staff(project_id)
  );

CREATE POLICY selection_decisions_insert_company_or_admin
  ON public.selection_decisions FOR INSERT TO authenticated
  WITH CHECK (
    (
      public.owns_project(project_id)
      AND public.is_company_role()
      AND decided_by = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY selection_decisions_update_company_or_admin
  ON public.selection_decisions FOR UPDATE TO authenticated
  USING (public.owns_project(project_id) OR public.is_admin())
  WITH CHECK (
    (
      public.owns_project(project_id)
      AND public.is_company_role()
    )
    OR public.is_admin()
  );

CREATE POLICY selection_decisions_delete_admin
  ON public.selection_decisions FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE POLICY notifications_select_own
  ON public.notifications FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin());

CREATE POLICY notifications_update_own
  ON public.notifications FOR UPDATE TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin())
  WITH CHECK (profile_id = auth.uid() OR public.is_admin());

CREATE POLICY notifications_insert_admin_or_self
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- audit_events: teacher/admin read; writes via SECURITY DEFINER triggers
-- ---------------------------------------------------------------------------
CREATE POLICY audit_events_select_staff
  ON public.audit_events FOR SELECT TO authenticated
  USING (public.is_teacher_or_admin());

-- ---------------------------------------------------------------------------
-- Table grants for authenticated (Supabase local / hosted)
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON FUNCTION public.write_audit_event(text, text, uuid, jsonb, jsonb)
  TO authenticated;
