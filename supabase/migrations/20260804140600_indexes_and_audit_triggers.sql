-- Indexes and automatic audit triggers

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

CREATE INDEX IF NOT EXISTS idx_company_users_company_id
  ON public.company_users (company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_profile_id
  ON public.company_users (profile_id);

CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students (profile_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_student_id
  ON public.student_courses (student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_student_id
  ON public.student_skills (student_id);
CREATE INDEX IF NOT EXISTS idx_student_interests_student_id
  ON public.student_interests (student_id);

CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses (code);
CREATE INDEX IF NOT EXISTS idx_skills_normalized_name ON public.skills (normalized_name);
CREATE INDEX IF NOT EXISTS idx_interests_normalized_name
  ON public.interests (normalized_name);

CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects (company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON public.projects (project_type);

CREATE INDEX IF NOT EXISTS idx_project_required_courses_project_id
  ON public.project_required_courses (project_id);
CREATE INDEX IF NOT EXISTS idx_project_recommended_courses_project_id
  ON public.project_recommended_courses (project_id);
CREATE INDEX IF NOT EXISTS idx_project_required_skills_project_id
  ON public.project_required_skills (project_id);
CREATE INDEX IF NOT EXISTS idx_project_recommended_skills_project_id
  ON public.project_recommended_skills (project_id);
CREATE INDEX IF NOT EXISTS idx_project_interests_project_id
  ON public.project_interests (project_id);

CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.applications (student_id);
CREATE INDEX IF NOT EXISTS idx_applications_project_id ON public.applications (project_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications (status);

CREATE INDEX IF NOT EXISTS idx_matches_student_id ON public.matches (student_id);
CREATE INDEX IF NOT EXISTS idx_matches_project_id ON public.matches (project_id);
CREATE INDEX IF NOT EXISTS idx_matches_total_score ON public.matches (total_score DESC);

CREATE INDEX IF NOT EXISTS idx_selection_decisions_project_id
  ON public.selection_decisions (project_id);
CREATE INDEX IF NOT EXISTS idx_selection_decisions_student_id
  ON public.selection_decisions (student_id);

CREATE INDEX IF NOT EXISTS idx_notifications_profile_id
  ON public.notifications (profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications (profile_id)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_events_entity
  ON public.audit_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor
  ON public.audit_events (actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at
  ON public.audit_events (created_at DESC);

-- ---------------------------------------------------------------------------
-- Audit helper + triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.write_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_old jsonb,
  p_new jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_events (
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  )
  VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old,
    p_new
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_projects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_event(
      'project_created',
      'project',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.write_audit_event(
      CASE
        WHEN OLD.status IS DISTINCT FROM NEW.status
          AND NEW.status = 'published' THEN 'project_published'
        ELSE 'project_updated'
      END,
      'project',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_projects
  AFTER INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.audit_projects();

CREATE OR REPLACE FUNCTION public.audit_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_event(
      'application_created',
      'application',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE'
    AND OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status = 'shortlisted' THEN
    PERFORM public.write_audit_event(
      'application_shortlisted',
      'application',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.write_audit_event(
      'application_updated',
      'application',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_applications
  AFTER INSERT OR UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.audit_applications();

CREATE OR REPLACE FUNCTION public.audit_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_event(
      'match_saved',
      'match',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.write_audit_event(
      'match_updated',
      'match',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_matches
  AFTER INSERT OR UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.audit_matches();

CREATE OR REPLACE FUNCTION public.audit_selection_decisions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_event(
      'selection_decided',
      'selection_decision',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.write_audit_event(
      'selection_changed',
      'selection_decision',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_selection_decisions
  AFTER INSERT OR UPDATE ON public.selection_decisions
  FOR EACH ROW EXECUTE FUNCTION public.audit_selection_decisions();

CREATE OR REPLACE FUNCTION public.audit_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_event(
      'notification_created',
      'notification',
      NEW.id,
      NULL,
      jsonb_build_object(
        'id', NEW.id,
        'profile_id', NEW.profile_id,
        'type', NEW.type,
        'title', NEW.title
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_notifications
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.audit_notifications();
