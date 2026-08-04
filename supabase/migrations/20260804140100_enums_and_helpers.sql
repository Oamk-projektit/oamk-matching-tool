-- Enums (as check constraints / domain helpers) and shared trigger helpers.
-- Aligned with types/domain.ts and docs/API.md (projects model).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Auth → profile bootstrap
-- profiles.id = auth.users.id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    role,
    display_name,
    email,
    preferred_language
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      split_part(COALESCE(NEW.email, 'user'), '@', 1)
    ),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'preferred_language', 'fi')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
