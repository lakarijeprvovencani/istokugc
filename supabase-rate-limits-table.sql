-- Tabela za rate limiting (koristi se umesto eksternog servisa)
-- Pokreni ovo u Supabase SQL editoru

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created 
  ON public.rate_limits (key, created_at);

-- RLS: samo service_role moze pristupiti (API rute koriste service_role)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Automatsko ciscenje starih zapisa (starijih od 5 minuta)
-- Ovo se pokrece svaki put kad se pozove checkRateLimit, ali za svaki slucaj:
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE created_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
