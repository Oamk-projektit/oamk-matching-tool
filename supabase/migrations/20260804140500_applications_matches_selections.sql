-- Applications, matches, selection decisions, notifications, audit_events

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (
      status IN (
        'submitted',
        'under_review',
        'shortlisted',
        'selected',
        'not_selected',
        'withdrawn'
      )
    ),
  message text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, project_id)
);

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  total_score integer NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  matched_courses text[] NOT NULL DEFAULT '{}',
  missing_required_courses text[] NOT NULL DEFAULT '{}',
  matched_skills text[] NOT NULL DEFAULT '{}',
  missing_required_skills text[] NOT NULL DEFAULT '{}',
  explanation text NOT NULL DEFAULT '',
  weights_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  -- One current matching result per student–project pair
  UNIQUE (student_id, project_id)
);

CREATE TABLE public.selection_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications (id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('selected', 'not_selected')),
  decided_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  reason text,
  decided_at timestamptz NOT NULL DEFAULT now(),
  -- One decision row per application (changes update the row; audit keeps history)
  UNIQUE (application_id)
);

-- Ensure selection targets the application’s student and project
CREATE OR REPLACE FUNCTION public.enforce_selection_application_link()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  app_project uuid;
  app_student uuid;
BEGIN
  SELECT project_id, student_id
  INTO app_project, app_student
  FROM public.applications
  WHERE id = NEW.application_id;

  IF app_project IS NULL THEN
    RAISE EXCEPTION 'selection_decisions: application % not found', NEW.application_id;
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

CREATE TRIGGER trg_selection_application_link
  BEFORE INSERT OR UPDATE ON public.selection_decisions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_selection_application_link();

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (
      type IN (
        'application_received',
        'application_status_changed',
        'match_ready',
        'selection_decided',
        'project_published'
      )
    ),
  language text NOT NULL DEFAULT 'fi' CHECK (language IN ('fi', 'en')),
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
