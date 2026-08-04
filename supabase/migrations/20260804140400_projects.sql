-- Projects, requirement links, and matching weights (sum must be 100)

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  project_type text NOT NULL
    CHECK (project_type IN ('company_project', 'internship')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  positions integer NOT NULL DEFAULT 1 CHECK (positions >= 1),
  application_start date,
  application_deadline date,
  project_start date,
  project_end date,
  work_mode text NOT NULL DEFAULT 'hybrid'
    CHECK (work_mode IN ('onsite', 'hybrid', 'remote')),
  location text,
  remote_allowed boolean NOT NULL DEFAULT true,
  minimum_study_credits integer NOT NULL DEFAULT 0
    CHECK (minimum_study_credits >= 0),
  required_language text NOT NULL DEFAULT 'fi'
    CHECK (required_language IN ('fi', 'en')),
  department text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_required_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, course_id)
);

CREATE TABLE public.project_recommended_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, course_id)
);

CREATE TABLE public.project_required_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, skill_id)
);

CREATE TABLE public.project_recommended_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, skill_id)
);

CREATE TABLE public.project_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  interest_id uuid NOT NULL REFERENCES public.interests (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, interest_id)
);

CREATE TABLE public.project_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects (id) ON DELETE CASCADE,
  study_credits integer NOT NULL DEFAULT 10 CHECK (study_credits >= 0),
  required_courses integer NOT NULL DEFAULT 20 CHECK (required_courses >= 0),
  recommended_courses integer NOT NULL DEFAULT 10 CHECK (recommended_courses >= 0),
  skills integer NOT NULL DEFAULT 25 CHECK (skills >= 0),
  language integer NOT NULL DEFAULT 10 CHECK (language >= 0),
  availability integer NOT NULL DEFAULT 10 CHECK (availability >= 0),
  interests integer NOT NULL DEFAULT 10 CHECK (interests >= 0),
  degree_programme integer NOT NULL DEFAULT 5 CHECK (degree_programme >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_weights_sum_100 CHECK (
    study_credits
      + required_courses
      + recommended_courses
      + skills
      + language
      + availability
      + interests
      + degree_programme
    = 100
  )
);

CREATE TRIGGER trg_project_weights_updated_at
  BEFORE UPDATE ON public.project_weights
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
