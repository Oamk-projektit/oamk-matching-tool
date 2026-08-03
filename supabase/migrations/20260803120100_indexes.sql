-- Indexes for common lookup and sort paths
-- See docs/SCHEMA.md

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students (user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students (email);

CREATE INDEX IF NOT EXISTS idx_student_courses_student_id
  ON public.student_courses (student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_student_id
  ON public.student_skills (student_id);
CREATE INDEX IF NOT EXISTS idx_student_interests_student_id
  ON public.student_interests (student_id);
CREATE INDEX IF NOT EXISTS idx_student_project_preferences_student_id
  ON public.student_project_preferences (student_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_teacher_id
  ON public.opportunities (teacher_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_type
  ON public.opportunities (type);

CREATE INDEX IF NOT EXISTS idx_opportunity_required_courses_opportunity_id
  ON public.opportunity_required_courses (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_recommended_courses_opportunity_id
  ON public.opportunity_recommended_courses (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_required_skills_opportunity_id
  ON public.opportunity_required_skills (opportunity_id);

CREATE INDEX IF NOT EXISTS idx_applications_student_id
  ON public.applications (student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id
  ON public.applications (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status
  ON public.applications (status);

CREATE INDEX IF NOT EXISTS idx_matches_student_id ON public.matches (student_id);
CREATE INDEX IF NOT EXISTS idx_matches_opportunity_id
  ON public.matches (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON public.matches (score DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON public.notifications (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications (recipient_user_id, read)
  WHERE read = false;
