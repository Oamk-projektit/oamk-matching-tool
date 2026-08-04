-- Drop Sprint-1 / opportunities-era public objects so the projects-model
-- schema can be created cleanly. Safe on `supabase db reset` (runs after
-- 20260803120* migrations). Idempotent for partial environments.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.opportunity_weights CASCADE;
DROP TABLE IF EXISTS public.opportunity_required_skills CASCADE;
DROP TABLE IF EXISTS public.opportunity_recommended_courses CASCADE;
DROP TABLE IF EXISTS public.opportunity_required_courses CASCADE;
DROP TABLE IF EXISTS public.opportunities CASCADE;
DROP TABLE IF EXISTS public.student_project_preferences CASCADE;
DROP TABLE IF EXISTS public.student_interests CASCADE;
DROP TABLE IF EXISTS public.student_skills CASCADE;
DROP TABLE IF EXISTS public.student_courses CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.owns_opportunity(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.owns_student_row(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_teacher() CASCADE;
DROP FUNCTION IF EXISTS public.is_student() CASCADE;
-- set_updated_at is recreated in the next migration
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
