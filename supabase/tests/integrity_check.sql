-- Integrity + RLS smoke checks for projects-model schema.
-- Intended to run as a privileged role AFTER seed (supabase db reset).
-- Uses fixed seed UUIDs from supabase/seed.sql.

DO $$
DECLARE
  v_count integer;
BEGIN
  -- Duplicate application must fail
  BEGIN
    INSERT INTO public.applications (project_id, student_id, status)
    VALUES (
      '90000000-0000-4000-8000-000000000001',
      'b0000000-0000-4000-8000-000000000011',
      'submitted'
    );
    RAISE EXCEPTION 'Expected duplicate application to fail';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'OK: duplicate application blocked';
  END;

  -- Duplicate match must fail
  BEGIN
    INSERT INTO public.matches (
      project_id, student_id, total_score, explanation
    ) VALUES (
      '90000000-0000-4000-8000-000000000001',
      'b0000000-0000-4000-8000-000000000011',
      50,
      'dup'
    );
    RAISE EXCEPTION 'Expected duplicate match to fail';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'OK: duplicate match blocked';
  END;

  -- Weights sum != 100 must fail
  BEGIN
    UPDATE public.project_weights
    SET skills = skills + 1
    WHERE project_id = '90000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Expected invalid weight sum to fail';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'OK: invalid weight sum blocked';
  END;

  -- Selection must match application student/project
  BEGIN
    INSERT INTO public.selection_decisions (
      project_id, student_id, application_id, decision, decided_by
    ) VALUES (
      '90000000-0000-4000-8000-000000000007',
      'b0000000-0000-4000-8000-000000000015',
      'd0000000-0000-4000-8000-000000000001', -- belongs to other project
      'selected',
      'a0000000-0000-4000-8000-000000000003'
    );
    RAISE EXCEPTION 'Expected mismatched selection to fail';
  EXCEPTION
    WHEN raise_exception THEN
      RAISE NOTICE 'OK: mismatched selection blocked';
    WHEN OTHERS THEN
      RAISE NOTICE 'OK: mismatched selection blocked (% )', SQLERRM;
  END;

  -- Selection capacity: project 001 has positions=2 and 1 selected (Aino).
  -- Select Mikko as well (fills capacity), then refuse lowering positions to 1.
  INSERT INTO public.selection_decisions (
    project_id, student_id, application_id, decision, decided_by
  ) VALUES (
    '90000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000012',
    'd0000000-0000-4000-8000-000000000002',
    'selected',
    'a0000000-0000-4000-8000-000000000003'
  );

  BEGIN
    UPDATE public.projects
    SET positions = 1
    WHERE id = '90000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'fail_test: expected positions below selected count to fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE 'fail_test:%' THEN
        RAISE;
      END IF;
      RAISE NOTICE 'OK: positions below selected count blocked';
  END;

  -- Project 007 has positions=1. Fill it, then a second selected must fail.
  INSERT INTO public.selection_decisions (
    project_id, student_id, application_id, decision, decided_by
  ) VALUES (
    '90000000-0000-4000-8000-000000000007',
    'b0000000-0000-4000-8000-000000000015',
    'd0000000-0000-4000-8000-000000000003',
    'selected',
    'a0000000-0000-4000-8000-000000000004'
  );

  INSERT INTO public.applications (
    id, project_id, student_id, status
  ) VALUES (
    'd0000000-0000-4000-8000-00000000ff01',
    '90000000-0000-4000-8000-000000000007',
    'b0000000-0000-4000-8000-000000000011',
    'submitted'
  );

  BEGIN
    INSERT INTO public.selection_decisions (
      project_id, student_id, application_id, decision, decided_by
    ) VALUES (
      '90000000-0000-4000-8000-000000000007',
      'b0000000-0000-4000-8000-000000000011',
      'd0000000-0000-4000-8000-00000000ff01',
      'selected',
      'a0000000-0000-4000-8000-000000000004'
    );
    RAISE EXCEPTION 'fail_test: expected over-capacity selection to fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE 'fail_test:%' THEN
        RAISE;
      END IF;
      RAISE NOTICE 'OK: over-capacity selection blocked';
  END;

  -- Cleanup probe rows so re-runs stay deterministic
  DELETE FROM public.selection_decisions
  WHERE application_id IN (
    'd0000000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000003'
  );
  DELETE FROM public.applications
  WHERE id = 'd0000000-0000-4000-8000-00000000ff01';

  RAISE NOTICE 'Integrity checks completed';
END $$;

-- RLS checks: impersonate users via request.jwt.claim.sub (Supabase pattern)
-- These require SET LOCAL role authenticated + jwt claims.

CREATE OR REPLACE FUNCTION public._test_set_auth(uid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', uid::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END;
$$;

DO $$
DECLARE
  n integer;
BEGIN
  -- Student Aino must not see Mikko's application
  PERFORM public._test_set_auth('a0000000-0000-4000-8000-000000000011');
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO n
  FROM public.applications
  WHERE student_id = 'b0000000-0000-4000-8000-000000000012';

  IF n <> 0 THEN
    RAISE EXCEPTION 'RLS fail: student saw another student application (count=%)', n;
  END IF;
  RAISE NOTICE 'OK: student cannot see other applications';

  -- Student must not see peer match scores on same project (Top-N leakage)
  SELECT count(*) INTO n
  FROM public.matches
  WHERE project_id = '90000000-0000-4000-8000-000000000001'
    AND student_id <> 'b0000000-0000-4000-8000-000000000011';

  IF n <> 0 THEN
    RAISE EXCEPTION 'RLS fail: student saw peer matches (count=%)', n;
  END IF;
  RAISE NOTICE 'OK: student cannot see project Top-N / peer matches';

  RESET ROLE;

  -- Nordic Soft company must not see Polar Byte applicants
  PERFORM public._test_set_auth('a0000000-0000-4000-8000-000000000003');
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO n
  FROM public.applications
  WHERE project_id = '90000000-0000-4000-8000-000000000004';

  IF n <> 0 THEN
    RAISE EXCEPTION 'RLS fail: company saw other company applicants (count=%)', n;
  END IF;
  RAISE NOTICE 'OK: company cannot see other company applicants';

  -- Own applicants visible
  SELECT count(*) INTO n
  FROM public.applications
  WHERE project_id = '90000000-0000-4000-8000-000000000001';

  IF n < 1 THEN
    RAISE EXCEPTION 'RLS fail: company cannot see own applicants';
  END IF;
  RAISE NOTICE 'OK: company can see own applicants';

  RESET ROLE;
  RAISE NOTICE 'RLS checks completed';
END $$;

DROP FUNCTION IF EXISTS public._test_set_auth(uuid);
