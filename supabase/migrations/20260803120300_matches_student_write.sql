-- Allow students to insert/update their own match rows (own student_id).
-- Teachers/admins already covered by staff policies.

CREATE POLICY matches_insert_own_student
  ON public.matches FOR INSERT TO authenticated
  WITH CHECK (public.owns_student_row(student_id) OR public.is_admin());

CREATE POLICY matches_update_own_student
  ON public.matches FOR UPDATE TO authenticated
  USING (public.owns_student_row(student_id) OR public.is_admin())
  WITH CHECK (public.owns_student_row(student_id) OR public.is_admin());
