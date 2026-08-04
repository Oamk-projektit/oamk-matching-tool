-- Align application audit actions with API contract and block selection on withdrawn apps.

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
    AND NEW.status = 'withdrawn' THEN
    PERFORM public.write_audit_event(
      'application_withdrawn',
      'application',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE'
    AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.write_audit_event(
      'application_status_changed',
      'application',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Withdrawn applications cannot be processed through selection decisions.
CREATE OR REPLACE FUNCTION public.enforce_selection_application_link()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  app_project uuid;
  app_student uuid;
  app_status text;
BEGIN
  SELECT project_id, student_id, status
  INTO app_project, app_student, app_status
  FROM public.applications
  WHERE id = NEW.application_id;

  IF app_project IS NULL THEN
    RAISE EXCEPTION 'selection_decisions: application % not found', NEW.application_id;
  END IF;

  IF app_status = 'withdrawn' THEN
    RAISE EXCEPTION
      'selection_decisions: withdrawn application % cannot be selected',
      NEW.application_id;
  END IF;

  IF NEW.project_id IS DISTINCT FROM app_project
     OR NEW.student_id IS DISTINCT FROM app_student THEN
    RAISE EXCEPTION
      'selection_decisions: student/project must match application %',
      NEW.application_id;
  END IF;

  RETURN NEW;
END;
$$;
