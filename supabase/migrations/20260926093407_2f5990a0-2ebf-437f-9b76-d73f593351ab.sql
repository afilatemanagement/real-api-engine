CREATE TYPE public.worker_task_status AS ENUM ('queued','waiting_approval','approved','running','completed','failed','verified','rejected','cancelled');

CREATE TABLE public.worker_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  instructions text NOT NULL DEFAULT '' CHECK (char_length(instructions) <= 4000),
  agent_id text NOT NULL,
  priority text NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  source text NOT NULL DEFAULT 'Manual',
  requires_approval boolean NOT NULL DEFAULT false,
  status public.worker_task_status NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.worker_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.worker_tasks(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('running','completed','failed')),
  model text,
  error text,
  started_by uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE TABLE public.task_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.worker_tasks(id) ON DELETE CASCADE,
  run_id uuid REFERENCES public.worker_runs(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('input_context','output','note')),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.task_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.worker_tasks(id) ON DELETE CASCADE,
  run_id uuid REFERENCES public.worker_runs(id) ON DELETE SET NULL,
  verdict text NOT NULL CHECK (verdict IN ('verified','rejected')),
  note text NOT NULL DEFAULT '',
  verified_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.worker_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  task_id uuid REFERENCES public.worker_tasks(id) ON DELETE SET NULL,
  actor_id uuid,
  actor_label text NOT NULL,
  action text NOT NULL,
  from_status text,
  to_status text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.worker_tasks (status, created_at DESC);
CREATE INDEX ON public.worker_runs (task_id, started_at DESC);
CREATE INDEX ON public.task_evidence (task_id);
CREATE INDEX ON public.task_verifications (task_id);
CREATE INDEX ON public.worker_audit_log (task_id, created_at DESC);

GRANT SELECT ON public.worker_tasks, public.worker_runs, public.task_evidence, public.task_verifications, public.worker_audit_log TO authenticated;
GRANT ALL ON public.worker_tasks, public.worker_runs, public.task_evidence, public.task_verifications, public.worker_audit_log TO service_role;

ALTER TABLE public.worker_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_audit_log ENABLE ROW LEVEL SECURITY;

-- Signed-in operators can read; all writes go through server functions that enforce the lifecycle.
CREATE POLICY "Signed-in read tasks" ON public.worker_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read runs" ON public.worker_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read evidence" ON public.task_evidence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read verifications" ON public.task_verifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read audit" ON public.worker_audit_log FOR SELECT TO authenticated USING (true);

-- Audit history is append-only, even for privileged writers.
CREATE OR REPLACE FUNCTION public.prevent_audit_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Audit history is append-only'; END; $$;
CREATE TRIGGER worker_audit_log_immutable BEFORE UPDATE OR DELETE ON public.worker_audit_log FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_mutation();

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER worker_tasks_touch BEFORE UPDATE ON public.worker_tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_tasks;