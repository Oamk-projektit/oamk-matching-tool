-- Static checks for projects-model schema objects.
-- Run after migrations (SQL editor, psql, or supabase db reset + psql).

DO $$
DECLARE
  missing text := '';
  tbl text;
  tables text[] := ARRAY[
    'profiles',
    'companies',
    'company_users',
    'courses',
    'skills',
    'interests',
    'students',
    'student_courses',
    'student_skills',
    'student_interests',
    'projects',
    'project_required_courses',
    'project_recommended_courses',
    'project_required_skills',
    'project_recommended_skills',
    'project_interests',
    'project_weights',
    'applications',
    'matches',
    'selection_decisions',
    'notifications',
    'audit_events'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF to_regclass('public.' || tbl) IS NULL THEN
      missing := missing || tbl || ', ';
    END IF;
  END LOOP;

  IF missing <> '' THEN
    RAISE EXCEPTION 'Missing tables: %', missing;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'set_updated_at'
  ) THEN
    RAISE EXCEPTION 'Missing function set_updated_at';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'owns_project'
  ) THEN
    RAISE EXCEPTION 'Missing function owns_project';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'opportunities'
  ) THEN
    RAISE EXCEPTION 'Legacy table opportunities still present';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'companies'
      AND column_name = 'business_id'
  ) THEN
    RAISE EXCEPTION 'Missing companies.business_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'company_users'
      AND column_name = 'company_role'
  ) THEN
    RAISE EXCEPTION 'Missing company_users.company_role';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'create_project_bundle'
  ) THEN
    RAISE EXCEPTION 'Missing function create_project_bundle';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_project_bundle'
  ) THEN
    RAISE EXCEPTION 'Missing function update_project_bundle';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'replace_project_requirements'
  ) THEN
    RAISE EXCEPTION 'Missing function replace_project_requirements';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_company_role'
  ) THEN
    RAISE EXCEPTION 'Missing function is_company_role';
  END IF;

  RAISE NOTICE 'Schema check OK: projects-model tables and helpers present';
END $$;
