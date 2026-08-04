-- Atomic project update: base columns + weights + requirement links in one transaction.
-- Complements create_project_bundle / replace_project_requirements.

CREATE OR REPLACE FUNCTION public.update_project_bundle(
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
  patch jsonb := COALESCE(payload -> 'project', '{}'::jsonb);
BEGIN
  IF p_project_id IS NULL THEN
    RAISE EXCEPTION 'project_id is required' USING ERRCODE = '22023';
  END IF;

  IF NOT (
    public.is_admin()
    OR (public.is_company_role() AND public.owns_project(p_project_id))
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'project not found' USING ERRCODE = 'P0002';
  END IF;

  IF patch <> '{}'::jsonb THEN
    UPDATE public.projects
    SET
      title = COALESCE(patch ->> 'title', title),
      description = COALESCE(patch ->> 'description', description),
      project_type = COALESCE(patch ->> 'project_type', project_type),
      status = COALESCE(patch ->> 'status', status),
      positions = COALESCE((patch ->> 'positions')::integer, positions),
      application_start = CASE
        WHEN patch ? 'application_start'
          THEN NULLIF(patch ->> 'application_start', '')::date
        ELSE application_start
      END,
      application_deadline = CASE
        WHEN patch ? 'application_deadline'
          THEN NULLIF(patch ->> 'application_deadline', '')::date
        ELSE application_deadline
      END,
      project_start = CASE
        WHEN patch ? 'project_start'
          THEN NULLIF(patch ->> 'project_start', '')::date
        ELSE project_start
      END,
      project_end = CASE
        WHEN patch ? 'project_end'
          THEN NULLIF(patch ->> 'project_end', '')::date
        ELSE project_end
      END,
      work_mode = COALESCE(patch ->> 'work_mode', work_mode),
      location = CASE
        WHEN patch ? 'location' THEN NULLIF(patch ->> 'location', '')
        ELSE location
      END,
      remote_allowed = COALESCE((patch ->> 'remote_allowed')::boolean, remote_allowed),
      minimum_study_credits = COALESCE(
        (patch ->> 'minimum_study_credits')::integer,
        minimum_study_credits
      ),
      required_language = COALESCE(patch ->> 'required_language', required_language),
      department = CASE
        WHEN patch ? 'department' THEN NULLIF(patch ->> 'department', '')
        ELSE department
      END
    WHERE id = p_project_id;
  END IF;

  IF payload ? 'weights' THEN
    v_weights := payload -> 'weights';
    UPDATE public.project_weights
    SET
      study_credits = COALESCE((v_weights ->> 'study_credits')::integer, study_credits),
      required_courses = COALESCE((v_weights ->> 'required_courses')::integer, required_courses),
      recommended_courses = COALESCE(
        (v_weights ->> 'recommended_courses')::integer,
        recommended_courses
      ),
      skills = COALESCE((v_weights ->> 'skills')::integer, skills),
      language = COALESCE((v_weights ->> 'language')::integer, language),
      availability = COALESCE((v_weights ->> 'availability')::integer, availability),
      interests = COALESCE((v_weights ->> 'interests')::integer, interests),
      degree_programme = COALESCE(
        (v_weights ->> 'degree_programme')::integer,
        degree_programme
      )
    WHERE project_id = p_project_id;
  END IF;

  IF payload ? 'required_course_ids' THEN
    DELETE FROM public.project_required_courses WHERE project_id = p_project_id;
    FOR cid IN
      SELECT jsonb_array_elements_text(COALESCE(payload -> 'required_course_ids', '[]'::jsonb))::uuid
    LOOP
      INSERT INTO public.project_required_courses (project_id, course_id)
      VALUES (p_project_id, cid);
    END LOOP;
  END IF;

  IF payload ? 'recommended_course_ids' THEN
    DELETE FROM public.project_recommended_courses WHERE project_id = p_project_id;
    FOR cid IN
      SELECT jsonb_array_elements_text(
        COALESCE(payload -> 'recommended_course_ids', '[]'::jsonb)
      )::uuid
    LOOP
      INSERT INTO public.project_recommended_courses (project_id, course_id)
      VALUES (p_project_id, cid);
    END LOOP;
  END IF;

  IF payload ? 'required_skill_ids' THEN
    DELETE FROM public.project_required_skills WHERE project_id = p_project_id;
    FOR cid IN
      SELECT jsonb_array_elements_text(COALESCE(payload -> 'required_skill_ids', '[]'::jsonb))::uuid
    LOOP
      INSERT INTO public.project_required_skills (project_id, skill_id)
      VALUES (p_project_id, cid);
    END LOOP;
  END IF;

  IF payload ? 'recommended_skill_ids' THEN
    DELETE FROM public.project_recommended_skills WHERE project_id = p_project_id;
    FOR cid IN
      SELECT jsonb_array_elements_text(
        COALESCE(payload -> 'recommended_skill_ids', '[]'::jsonb)
      )::uuid
    LOOP
      INSERT INTO public.project_recommended_skills (project_id, skill_id)
      VALUES (p_project_id, cid);
    END LOOP;
  END IF;

  IF payload ? 'interest_ids' THEN
    DELETE FROM public.project_interests WHERE project_id = p_project_id;
    FOR cid IN
      SELECT jsonb_array_elements_text(COALESCE(payload -> 'interest_ids', '[]'::jsonb))::uuid
    LOOP
      INSERT INTO public.project_interests (project_id, interest_id)
      VALUES (p_project_id, cid);
    END LOOP;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_project_bundle(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_project_bundle(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_project_bundle(uuid, jsonb) TO service_role;
