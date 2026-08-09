-- Prevent privilege escalation via profiles.role:
-- 1) Self-updates cannot change role (BEFORE UPDATE trigger)
-- 2) Signup metadata may only seed student|company (handle_new_user)

-- ---------------------------------------------------------------------------
-- Immutable role for non-admin / non-service actors
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_profiles_role_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    -- service_role JWT (PostgREST / admin client)
    IF coalesce(auth.jwt() ->> 'role', '') = 'service_role' THEN
      RETURN NEW;
    END IF;

    -- Admin may change roles (including others')
    IF public.is_admin() THEN
      RETURN NEW;
    END IF;

    -- Seed / migrations: no JWT, session is postgres / supabase_admin
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'profiles.role cannot be changed by non-admin users'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_role_immutable ON public.profiles;

CREATE TRIGGER trg_profiles_role_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profiles_role_immutable();

REVOKE ALL ON FUNCTION public.enforce_profiles_role_immutable() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Auth bootstrap: metadata may only seed student|company
-- Teacher/admin must come from seed, admin, or service_role — never signup.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'student');
  IF v_role NOT IN ('student', 'company') THEN
    v_role := 'student';
  END IF;

  INSERT INTO public.profiles (
    id,
    role,
    display_name,
    email,
    preferred_language
  )
  VALUES (
    NEW.id,
    v_role,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      split_part(COALESCE(NEW.email, 'user'), '@', 1)
    ),
    COALESCE(NEW.email, ''),
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data ->> 'preferred_language', 'fi') IN ('fi', 'en')
        THEN COALESCE(NEW.raw_user_meta_data ->> 'preferred_language', 'fi')
      ELSE 'fi'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
