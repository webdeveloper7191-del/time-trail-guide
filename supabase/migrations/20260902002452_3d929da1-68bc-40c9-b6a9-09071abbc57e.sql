CREATE TABLE public.accounting_tokens (
  platform TEXT PRIMARY KEY,
  refresh_token TEXT NOT NULL,
  realm_id TEXT,
  company_file_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.accounting_tokens TO service_role;

ALTER TABLE public.accounting_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.accounting_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_accounting_tokens_updated_at
BEFORE UPDATE ON public.accounting_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();