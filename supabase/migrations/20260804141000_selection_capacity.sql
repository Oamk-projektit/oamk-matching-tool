-- Enforce selection capacity: selected students must not exceed projects.positions.
-- Complements enforce_selection_application_link (applicant-only selection).

CREATE OR REPLACE FUNCTION public.enforce_selection_capacity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_positions integer;
  v_selected_count integer;
BEGIN
  IF NEW.decision IS DISTINCT FROM 'selected' THEN
    RETURN NEW;
  END IF;

  SELECT positions
  INTO v_positions
  FROM public.projects
  WHERE id = NEW.project_id;

  IF v_positions IS NULL THEN
    RAISE EXCEPTION 'selection_decisions: project % not found', NEW.project_id;
  END IF;

  SELECT count(*)::integer
  INTO v_selected_count
  FROM public.selection_decisions
  WHERE project_id = NEW.project_id
    AND decision = 'selected'
    AND id IS DISTINCT FROM NEW.id;

  IF v_selected_count + 1 > v_positions THEN
    RAISE EXCEPTION
      'selection_decisions: project % allows at most % selected student(s)',
      NEW.project_id,
      v_positions;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_selection_capacity ON public.selection_decisions;

CREATE TRIGGER trg_selection_capacity
  BEFORE INSERT OR UPDATE ON public.selection_decisions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_selection_capacity();

-- Prevent lowering positions below already-selected count
CREATE OR REPLACE FUNCTION public.enforce_project_positions_capacity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_selected_count integer;
BEGIN
  IF NEW.positions IS NOT DISTINCT FROM OLD.positions THEN
    RETURN NEW;
  END IF;

  SELECT count(*)::integer
  INTO v_selected_count
  FROM public.selection_decisions
  WHERE project_id = NEW.id
    AND decision = 'selected';

  IF NEW.positions < v_selected_count THEN
    RAISE EXCEPTION
      'projects: positions (%) cannot be below current selected count (%)',
      NEW.positions,
      v_selected_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_project_positions_capacity ON public.projects;

CREATE TRIGGER trg_project_positions_capacity
  BEFORE UPDATE OF positions ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_positions_capacity();
