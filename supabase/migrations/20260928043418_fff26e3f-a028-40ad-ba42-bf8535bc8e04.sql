CREATE TABLE public.worker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('ai','human')),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  agent_id text,
  user_id uuid UNIQUE,
  email text,
  skills text[] NOT NULL DEFAULT '{}',
  max_concurrent integer NOT NULL DEFAULT 3,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'ai' AND agent_id IS NOT NULL) OR (kind = 'human' AND user_id IS NOT NULL))
);
GRANT SELECT ON public.worker_profiles TO authenticated;
GRANT ALL ON public.worker_profiles TO service_role;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in read worker profiles" ON public.worker_profiles FOR SELECT TO authenticated USING (true);
CREATE TRIGGER worker_profiles_touch BEFORE UPDATE ON public.worker_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.worker_tasks ADD COLUMN worker_id uuid REFERENCES public.worker_profiles(id);
CREATE INDEX worker_tasks_worker_idx ON public.worker_tasks(worker_id);