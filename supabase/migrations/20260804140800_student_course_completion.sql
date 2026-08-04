-- Student course completion metadata + atomic project save RPCs
-- Reviewed against docs/SCHEMA.md / types/domain.ts (commit 227d03e+).
-- Includes project_recommended_skills and project_interests in bundle writers.

ALTER TABLE public.student_courses
  ADD COLUMN IF NOT EXISTS completion_status text NOT NULL DEFAULT 'completed'
    CHECK (completion_status IN ('planned', 'in_progress', 'completed')),
  ADD COLUMN IF NOT EXISTS completed_at date,
  ADD COLUMN IF NOT EXISTS grade text,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Atomic project create (project + weights + requirement links)
-- Only company members (or admin) may create; teacher never owns projects.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_project_bundle(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid := (payload ->> 'company_id')::uuid;
  v_project_id uuid;
  v_weights jsonb := COALESCE(payload -> 'weights', '{}'::jsonb);
  cid uuid;
BEGIN
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id is required' USING ERRCODE = '22023';
  END IF;

  IF NOT (
    public.is_admin()
    OR (public.is_company_role() AND public.member_of_company(v_company_id))
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.projects (
    company_id,
    title,
    description,
    project_type,
    status,
    positions,
    application_start,
    application_deadline,
    project_start,
    project_end,
    work_mode,
    location,
    remote_allowed,
    minimum_study_credits,
    required_language,
    department
  )
  VALUES (
    v_company_id,
    payload ->> 'title',
    COALESCE(payload ->> 'description', ''),
    payload ->> 'project_type',
    COALESCE(payload ->> 'status', 'draft'),
    COALESCE((payload ->> 'positions')::integer, 1),
    NULLIF(payload ->> 'application_start', '')::date,
    NULLIF(payload ->> 'application_deadline', '')::date,
    NULLIF(payload ->> 'project_start', '')::date,
    NULLIF(payload ->> 'project_end', '')::date,
    COALESCE(payload ->> 'work_mode', 'hybrid'),
    NULLIF(payload ->> 'location', ''),
    COALESCE((payload ->> 'remote_allowed')::boolean, true),
    COALESCE((payload ->> 'minimum_study_credits')::integer, 0),
    COALESCE(payload ->> 'required_language', 'fi'),
    NULLIF(payload ->> 'department', '')
  )
  RETURNING id INTO v_project_id;

  INSERT INTO public.project_weights (
    project_id,
    study_credits,
    required_courses,
    recommended_courses,
    skills,
    language,
    availability,
    interests,
    degree_programme
  )
  VALUES (
    v_project_id,
    COALESCE((v_weights ->> 'study_credits')::integer, 10),
    COALESCE((v_weights ->> 'required_courses')::integer, 20),
    COALESCE((v_weights ->> 'recommended_courses')::integer, 10),
    COALESCE((v_weights ->> 'skills')::integer, 25),
    COALESCE((v_weights ->> 'language')::integer, 10),
    COALESCE((v_weights ->> 'availability')::integer, 10),
    COALESCE((v_weights ->> 'interests')::integer, 10),
    COALESCE((v_weights ->> 'degree_programme')::integer, 5)
  );

  FOR cid IN SELECT jsonb_array_elements_text(COALESCE(payload -> 'required_course_ids', '[]'::jsonb))::uuid
  LOOP
    INSERT INTO public.project_required_courses (project_id, course_id)
    VALUES (v_project_id, cid);
  END LOOP;

  FOR cid IN SELECT jsonb_array_elements_text(COALESCE(payload -> 'recommended_course_ids', '[]'::jsonb))::uuid
  LOOP
    INSERT INTO public.project_recommended_courses (project_id, course_id)
    VALUES (v_project_id, cid);
  END LOOP;

  FOR cid IN SELECT jsonb_array_elements_text(COALESCE(payload -> 'required_skill_ids', '[]'::jsonb))::uuid
  LOOP
    INSERT INTO public.project_required_skills (project_id, skill_id)
    VALUES (v_project_id, cid);
  END LOOP;

  FOR cid IN SELECT jsonb_array_elements_text(COALESCE(payload -> 'recommended_skill_ids', '[]'::jsonb))::uuid
  LOOP
    INSERT INTO public.project_recommended_skills (project_id, skill_id)
    VALUES (v_project_id, cid);
  END LOOP;

  FOR cid IN SELECT jsonb_array_elements_text(COALESCE(payload -> 'interest_ids', '[]'::jsonb))::uuid
  LOOP
    INSERT INTO public.project_interests (project_id, interest_id)
    VALUES (v_project_id, cid);
  END LOOP;

  RETURN v_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_project_bundle(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_project_bundle(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_project_bundle(jsonb) TO service_role;

-- ---------------------------------------------------------------------------
-- Atomic project requirement replace (weights + link tables)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.replace_project_requirements(
  p_project_id uuid,
  payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weights jsonb;
  cid uuid;
BEGIN
  IF NOT (
    public.is_admin()
    OR (public.is_company_role() AND public.owns_project(p_project_id))
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF payload ? 'weights' THEN
    v_weights := payload -> 'weights';
    UPDATE public.project_weights
    SET
      study_credits = COALESCE((v_weights ->> 'study_credits')::integer, study_credits),
      required_courses = COALESCE((v_weights ->> 'required_courses')::integer, required_courses),
      recommended_courses = COALESCE((v_weights ->> 'recommended_courses')::integer, recommended_courses),
      skills = COALESCE((v_weights ->> 'skills')::integer, skills),
      language = COALESCE((v_weights ->> 'language')::integer, language),
      availability = COALESCE((v_weights ->> 'availability')::integer, availability),
      interests = COALESCE((v_weights ->> 'interests')::integer, interests),
      degree_programme = COALESCE((v_weights ->> 'degree_programme')::integer, degree_programme)
    WHERE project_id = p_project_id;
  END IF;

  IF payload ? 'required_course_ids' THEN
    DELETE FROM public.project_required_courses WHERE project_id = p_project_id;
    FOR cid IN SELECT jsonb_array_elements_text(COALESCE(payload -> 'required_course_ids', '[]'::jsonb))::uuid
    LOOP
      INSERT INTO public.project_required_courses (project_id, course_id)
      VALUES (p_project_id, cid);
    END LOOP;
  END IF;

  IF payload ? 'recommended_course_ids' THEN
    DELETE FROM public.project_recommended_courses WHERE project_id = p_project_id;
    FOR cid IN SELECT jsonb_array_elements_text(COALESCE(payload -> 'recommended_course_ids', '[]'::jsonb))::uuid
    LOOP
      INSERT INTO public.project_recommended_courses (project_id, course_id)
      VALUES (p_project_id, cid);
    END LOOP;
  END IF;

  IF payload ? 'required_skill_ids' THEN
    DELETE FROM public.project_required_skills WHERE project_id = p_project_id;
    FOR cid IN SELECT jsonb_array_elements_text(COALESCE(payload -> 'required_skill_ids', '[]'::jsonb))::uuid
    LOOP
      INSERT INTO public.project_required_skills (project_id, skill_id)
      VALUES (p_project_id, cid);
    END LOOP;
  END IF;

  IF payload ? 'recommended_skill_ids' THEN
    DELETE FROM public.project_recommended_skills WHERE project_id = p_project_id;
    FOR cid IN SELECT jsonb_array_elements_text(COALESCE(payload -> 'recommended_skill_ids', '[]'::jsonb))::uuid
    LOOP
      INSERT INTO public.project_recommended_skills (project_id, skill_id)
      VALUES (p_project_id, cid);
    END LOOP;
  END IF;

  IF payload ? 'interest_ids' THEN
    DELETE FROM public.project_interests WHERE project_id = p_project_id;
    FOR cid IN SELECT jsonb_array_elements_text(COALESCE(payload -> 'interest_ids', '[]'::jsonb))::uuid
    LOOP
      INSERT INTO public.project_interests (project_id, interest_id)
      VALUES (p_project_id, cid);
    END LOOP;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_project_requirements(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_project_requirements(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_project_requirements(uuid, jsonb) TO service_role;

-- Find-or-create catalog skill by normalized name (students cannot INSERT catalogs via RLS)
CREATE OR REPLACE FUNCTION public.find_or_create_skill(
  p_name text,
  p_name_fi text DEFAULT NULL,
  p_name_en text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_id uuid;
  v_label text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  v_label := trim(both FROM COALESCE(NULLIF(p_name, ''), ''));
  IF v_label = '' THEN
    RAISE EXCEPTION 'name is required' USING ERRCODE = '22023';
  END IF;

  v_norm := lower(regexp_replace(v_label, '\s+', ' ', 'g'));

  SELECT id INTO v_id FROM public.skills WHERE normalized_name = v_norm;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.skills (name_fi, name_en, normalized_name)
  VALUES (
    COALESCE(NULLIF(trim(both FROM p_name_fi), ''), v_label),
    COALESCE(NULLIF(trim(both FROM p_name_en), ''), v_label),
    v_norm
  )
  ON CONFLICT (normalized_name) DO UPDATE SET normalized_name = EXCLUDED.normalized_name
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_or_create_interest(
  p_name text,
  p_name_fi text DEFAULT NULL,
  p_name_en text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_id uuid;
  v_label text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  v_label := trim(both FROM COALESCE(NULLIF(p_name, ''), ''));
  IF v_label = '' THEN
    RAISE EXCEPTION 'name is required' USING ERRCODE = '22023';
  END IF;

  v_norm := lower(regexp_replace(v_label, '\s+', ' ', 'g'));

  SELECT id INTO v_id FROM public.interests WHERE normalized_name = v_norm;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.interests (name_fi, name_en, normalized_name)
  VALUES (
    COALESCE(NULLIF(trim(both FROM p_name_fi), ''), v_label),
    COALESCE(NULLIF(trim(both FROM p_name_en), ''), v_label),
    v_norm
  )
  ON CONFLICT (normalized_name) DO UPDATE SET normalized_name = EXCLUDED.normalized_name
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.find_or_create_skill(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_or_create_interest(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_or_create_skill(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_or_create_interest(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_or_create_skill(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.find_or_create_interest(text, text, text) TO service_role;
