-- Ensure service_role can read/write application tables for server-only admin jobs
-- (health checks, match persistence, notification emit). RLS still applies to
-- anon/authenticated; service_role bypasses RLS but still needs table privileges.
--
-- Root cause: 20260804140700 granted table DML only to authenticated/anon.

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;

-- Helper functions used by policies / bundles may be invoked under service_role.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, p.proname AS func_name, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'current_user_role',
        'is_admin',
        'is_teacher',
        'is_teacher_or_admin',
        'is_company_role',
        'is_student',
        'owns_student_row',
        'member_of_company',
        'owns_project',
        'can_view_project_staff',
        'write_audit_event',
        'create_project_bundle',
        'update_project_bundle',
        'replace_project_requirements',
        'find_or_create_skill',
        'find_or_create_interest'
      )
  LOOP
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',
      r.schema_name,
      r.func_name,
      r.args
    );
  END LOOP;
END $$;
