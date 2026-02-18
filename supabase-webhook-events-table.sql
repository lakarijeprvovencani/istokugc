-- Idempotency table for Stripe webhook events
-- Prevents duplicate processing of the same event

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_webhook_events_event_id ON public.webhook_events (event_id);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON public.webhook_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-cleanup: events older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  DELETE FROM public.webhook_events WHERE processed_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
