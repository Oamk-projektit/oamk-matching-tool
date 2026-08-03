-- Static checks for schema objects (run after migrations in SQL editor or psql)
-- Not a substitute for supabase db reset; validates expected MVP objects exist.

DO $$
DECLARE
  missing text := '';
  tbl text;
  tables text[] := ARRAY[
    'profiles',
    'students',
    'student_courses',
    'student_skills',
    'student_interests',
    'student_project_preferences',
    'opportunities',
    'opportunity_required_courses',
    'opportunity_recommended_courses',
    'opportunity_required_skills',
    'opportunity_weights',
    'applications',
    'matches',
    'notifications'
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
    WHERE n.nspname = 'public' AND p.proname = 'current_user_role'
  ) THEN
    RAISE EXCEPTION 'Missing function current_user_role';
  END IF;

  RAISE NOTICE 'Schema check OK: all MVP tables and helpers present';
END $$;
