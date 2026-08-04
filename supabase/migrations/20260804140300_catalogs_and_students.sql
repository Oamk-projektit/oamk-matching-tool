-- Catalog tables and student profile data

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_fi text NOT NULL,
  name_en text NOT NULL,
  credits integer NOT NULL DEFAULT 0 CHECK (credits >= 0),
  department text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fi text NOT NULL,
  name_en text NOT NULL,
  normalized_name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fi text NOT NULL,
  name_en text NOT NULL,
  normalized_name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  degree_programme text,
  department text,
  study_credits integer NOT NULL DEFAULT 0 CHECK (study_credits >= 0),
  availability_start date,
  availability_end date,
  preferred_project_types text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT students_preferred_project_types_valid CHECK (
    preferred_project_types <@ ARRAY['company_project', 'internship']::text[]
  )
);

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.student_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);

CREATE TABLE public.student_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, skill_id)
);

CREATE TABLE public.student_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  interest_id uuid NOT NULL REFERENCES public.interests (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, interest_id)
);
