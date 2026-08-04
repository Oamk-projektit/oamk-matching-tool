-- Align remaining columns/policies with locked contract decisions:
-- - companies.business_id, company_users.company_role
-- - optional skill levels
-- - projects INSERT requires company role (teachers never create/own)
-- - harden handle_new_user role validation

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS business_id text;

ALTER TABLE public.company_users
  ADD COLUMN IF NOT EXISTS company_role text NOT NULL DEFAULT 'owner'
    CHECK (company_role IN ('owner', 'member'));

ALTER TABLE public.student_skills
  ADD COLUMN IF NOT EXISTS level text;

ALTER TABLE public.project_required_skills
  ADD COLUMN IF NOT EXISTS level text;

ALTER TABLE public.project_recommended_skills
  ADD COLUMN IF NOT EXISTS level text;

-- Tighten project creation: company membership alone is not enough without role=company
DROP POLICY IF EXISTS projects_insert_company_or_admin ON public.projects;

CREATE POLICY projects_insert_company_or_admin
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      public.is_company_role()
      AND public.member_of_company(company_id)
    )
  );

-- Auth bootstrap: only allow known roles (fallback student)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'student');
  IF v_role NOT IN ('student', 'company', 'teacher', 'admin') THEN
    v_role := 'student';
  END IF;

  INSERT INTO public.profiles (
    id,
    role,
    display_name,
    email,
    preferred_language
  )
  VALUES (
    NEW.id,
    v_role,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      split_part(COALESCE(NEW.email, 'user'), '@', 1)
    ),
    COALESCE(NEW.email, ''),
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data ->> 'preferred_language', 'fi') IN ('fi', 'en')
        THEN COALESCE(NEW.raw_user_meta_data ->> 'preferred_language', 'fi')
      ELSE 'fi'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
