-- Selection decision snapshots (match + weights + rank at decision time)
-- Expanded notification types, idempotency, and finer audit actions.

ALTER TABLE public.selection_decisions
  ADD COLUMN IF NOT EXISTS match_id uuid REFERENCES public.matches (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS match_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS weights_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS algorithm_rank integer
    CHECK (algorithm_rank IS NULL OR algorithm_rank >= 1);

COMMENT ON COLUMN public.selection_decisions.match_snapshot IS
  'Matching result captured at decision time; independent of later rematches.';
COMMENT ON COLUMN public.selection_decisions.weights_snapshot IS
  'Project weight percentages captured at decision time.';
COMMENT ON COLUMN public.selection_decisions.algorithm_rank IS
  '1-based algorithm rank among project matches at decision time (informational).';

-- Expand notification types for the selection + notification backend contract.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'application_received',
      'application_status_changed',
      'application_shortlisted',
      'student_selected',
      'student_not_selected',
      'project_updated',
      'application_deadline_approaching',
      'new_application_for_company',
      'selection_completed_for_teacher',
      -- retained for existing seed / matching callers
      'match_ready',
      'selection_decided',
      'project_published'
    )
  );

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_idempotency_key_uidx
  ON public.notifications (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Finer selection audit actions while keeping selection_changed for generic updates.
CREATE OR REPLACE FUNCTION public.audit_selection_decisions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_event(
      CASE
        WHEN NEW.decision = 'selected' THEN 'selection_selected'
        ELSE 'selection_not_selected'
      END,
      'selection_decision',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.decision IS DISTINCT FROM NEW.decision THEN
      PERFORM public.write_audit_event(
        'selection_changed',
        'selection_decision',
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW)
      );
    ELSIF OLD.reason IS DISTINCT FROM NEW.reason THEN
      PERFORM public.write_audit_event(
        'selection_reason_changed',
        'selection_decision',
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW)
      );
    ELSE
      PERFORM public.write_audit_event(
        'selection_changed',
        'selection_decision',
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW)
      );
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Shortlist-specific audit actions on application status transitions.
CREATE OR REPLACE FUNCTION public.audit_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_event(
      'application_created',
      'application',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE'
    AND OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status = 'withdrawn' THEN
    PERFORM public.write_audit_event(
      'application_withdrawn',
      'application',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE'
    AND OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status = 'shortlisted' THEN
    PERFORM public.write_audit_event(
      'application_shortlisted',
      'application',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE'
    AND OLD.status IS DISTINCT FROM NEW.status
    AND OLD.status = 'shortlisted'
    AND NEW.status <> 'withdrawn' THEN
    PERFORM public.write_audit_event(
      'application_unshortlisted',
      'application',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE'
    AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.write_audit_event(
      'application_status_changed',
      'application',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
