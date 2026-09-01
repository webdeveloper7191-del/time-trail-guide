CREATE TABLE public.pay_runs (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  locked boolean NOT NULL DEFAULT false,
  period_start date,
  period_end date,
  reversal_of_run_id text,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.pay_runs TO service_role;
ALTER TABLE public.pay_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages pay runs" ON public.pay_runs FOR ALL TO service_role USING (true) WITH CHECK (true);