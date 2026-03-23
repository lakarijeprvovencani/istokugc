-- ============================================================
-- UGC PLATFORM — KOMPLETNI DATABASE BACKUP
-- Generisan: 26. februar 2026.
-- Izvor: Supabase projekat xupycbchatcnlvkaadcd
-- Sadrži: tabele, constrainti, indexi, funkcije, trigeri, RLS
-- ============================================================

-- ============================================================
-- 1. FUNKCIJE
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE created_at < NOW() - INTERVAL '5 minutes';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.webhook_events WHERE processed_at < now() - interval '30 days';
END;
$$;

-- ============================================================
-- 2. TABELE (redosled: bez zavisnosti → sa zavisnostima)
-- ============================================================

-- users (povezan sa auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'creator'::text CHECK (role = ANY (ARRAY['creator'::text, 'business'::text, 'admin'::text])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- creators
CREATE TABLE IF NOT EXISTS public.creators (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  location text NOT NULL,
  bio text NOT NULL,
  photo text,
  categories text[] DEFAULT '{}'::text[],
  platforms text[] DEFAULT '{}'::text[],
  languages text[] DEFAULT '{}'::text[],
  price_from integer NOT NULL DEFAULT 100,
  instagram text,
  tiktok text,
  youtube text,
  portfolio jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'deactivated'::text])),
  rejection_reason text,
  profile_views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- businesses
CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  email text NOT NULL,
  description text,
  website text,
  industry text,
  subscription_type text CHECK (subscription_type = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  subscription_status text DEFAULT 'none'::text CHECK (subscription_status = ANY (ARRAY['active'::text, 'expired'::text, 'none'::text])),
  subscribed_at timestamptz,
  expires_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  phone varchar(50),
  logo text
);

-- categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text NOT NULL,
  category varchar(100) NOT NULL,
  platforms text[] DEFAULT '{}'::text[],
  budget_type varchar(20) NOT NULL DEFAULT 'fixed'::character varying,
  budget_min integer,
  budget_max integer,
  duration varchar(50),
  experience_level varchar(50),
  status varchar(20) NOT NULL DEFAULT 'open'::character varying,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  application_deadline date
);

-- job_applications
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  cover_letter text NOT NULL,
  proposed_price integer NOT NULL,
  estimated_duration varchar(100),
  status varchar(20) NOT NULL DEFAULT 'pending'::character varying,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (job_id, creator_id)
);

-- job_messages
CREATE TABLE IF NOT EXISTS public.job_messages (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  sender_type varchar(20) NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- job_invitations
CREATE TABLE IF NOT EXISTS public.job_invitations (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
  message text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  responded_at timestamptz,
  UNIQUE (job_id, creator_id)
);

-- reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status varchar(20) DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  rejection_reason text,
  reply text,
  reply_date timestamptz
);

-- creator_views
CREATE TABLE IF NOT EXISTS public.creator_views (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE (business_id, creator_id)
);

-- saved_creators
CREATE TABLE IF NOT EXISTS public.saved_creators (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now(),
  UNIQUE (business_id, creator_id)
);

-- saved_jobs
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (creator_id, job_id)
);

-- rate_limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- webhook_events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. INDEXI (osim primarnih ključeva i unique — oni su gore)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses (user_id);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON public.creators (user_id);
CREATE INDEX IF NOT EXISTS idx_creators_status ON public.creators (status);
CREATE INDEX IF NOT EXISTS idx_creators_name ON public.creators (name);
CREATE INDEX IF NOT EXISTS idx_creators_price_from ON public.creators (price_from);
CREATE INDEX IF NOT EXISTS idx_creators_created_at ON public.creators (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creators_status_created ON public.creators (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creators_categories ON public.creators USING gin (categories);
CREATE INDEX IF NOT EXISTS idx_creators_platforms ON public.creators USING gin (platforms);
CREATE INDEX IF NOT EXISTS idx_creators_languages ON public.creators USING gin (languages);
CREATE INDEX IF NOT EXISTS idx_jobs_business_id ON public.jobs (business_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs (category);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_application_deadline ON public.jobs (application_deadline);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications (job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_creator_id ON public.job_applications (creator_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_engaged_per_job ON public.job_applications (job_id) WHERE status::text = 'engaged';
CREATE INDEX IF NOT EXISTS idx_job_messages_application_id ON public.job_messages (application_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_created_at ON public.job_messages (created_at);
CREATE INDEX IF NOT EXISTS idx_job_invitations_job_id ON public.job_invitations (job_id);
CREATE INDEX IF NOT EXISTS idx_job_invitations_business_id ON public.job_invitations (business_id);
CREATE INDEX IF NOT EXISTS idx_job_invitations_creator_id ON public.job_invitations (creator_id);
CREATE INDEX IF NOT EXISTS idx_job_invitations_status ON public.job_invitations (status);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews (business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_creator_id ON public.reviews (creator_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews (status);
CREATE INDEX IF NOT EXISTS idx_creator_views_business_id ON public.creator_views (business_id);
CREATE INDEX IF NOT EXISTS idx_creator_views_creator_id ON public.creator_views (creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_views_viewed_at ON public.creator_views (viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_views_business ON public.creator_views (business_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_creators_creator_id ON public.saved_creators (creator_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_creator_id ON public.saved_jobs (creator_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs (job_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created ON public.rate_limits (key, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events (event_id);

-- ============================================================
-- 4. TRIGERI
-- ============================================================

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER creators_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 5. RLS — ENABLE + POLITIKE
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- creators
CREATE POLICY "Anyone can view approved creators" ON public.creators FOR SELECT USING (status = 'approved');
CREATE POLICY "Creators can view own profile" ON public.creators FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Creators can update own profile" ON public.creators FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all creators" ON public.creators FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can update any creator" ON public.creators FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- businesses
CREATE POLICY "Businesses can view own data" ON public.businesses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Businesses can update own data" ON public.businesses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all businesses" ON public.businesses FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- categories
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage categories" ON public.categories FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- jobs
CREATE POLICY "Anyone can view open jobs" ON public.jobs FOR SELECT USING (status::text = 'open' OR status::text = 'in_progress');
CREATE POLICY "Businesses can manage their own jobs" ON public.jobs FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- job_applications
CREATE POLICY "Creators can view their own applications" ON public.job_applications FOR SELECT USING (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()));
CREATE POLICY "Creators can create applications" ON public.job_applications FOR INSERT WITH CHECK (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()));
CREATE POLICY "Creators can update their own applications" ON public.job_applications FOR UPDATE USING (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()));
CREATE POLICY "Businesses can view applications for their jobs" ON public.job_applications FOR SELECT USING (job_id IN (SELECT id FROM jobs WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));

-- job_messages
CREATE POLICY "Participants can view messages" ON public.job_messages FOR SELECT USING (application_id IN (SELECT ja.id FROM job_applications ja JOIN jobs j ON j.id = ja.job_id WHERE ja.creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()) OR j.business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));
CREATE POLICY "Participants can send messages" ON public.job_messages FOR INSERT WITH CHECK (application_id IN (SELECT ja.id FROM job_applications ja JOIN jobs j ON j.id = ja.job_id WHERE ja.creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()) OR j.business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));

-- job_invitations
CREATE POLICY "Creators can view their invitations" ON public.job_invitations FOR SELECT USING (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()) OR business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Businesses can create invitations" ON public.job_invitations FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Creators can respond to invitations" ON public.job_invitations FOR UPDATE USING (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()));
CREATE POLICY "Businesses can cancel pending invitations" ON public.job_invitations FOR DELETE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()) AND status = 'pending');

-- reviews
CREATE POLICY "Public can read approved reviews" ON public.reviews FOR SELECT USING (status::text = 'approved');
CREATE POLICY "Business can see own reviews" ON public.reviews FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Creator can see reviews on own profile" ON public.reviews FOR SELECT USING (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()));
CREATE POLICY "Business can create review" ON public.reviews FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Business can update own review" ON public.reviews FOR UPDATE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Business can delete own review" ON public.reviews FOR DELETE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Admin can see all reviews" ON public.reviews FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admin can update any review" ON public.reviews FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admin can delete any review" ON public.reviews FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- creator_views
CREATE POLICY "Businesses can view own views" ON public.creator_views FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Businesses can insert views" ON public.creator_views FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Businesses can update views" ON public.creator_views FOR UPDATE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- saved_creators
CREATE POLICY "Business can see own favorites" ON public.saved_creators FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Business can add favorites" ON public.saved_creators FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Business can remove favorites" ON public.saved_creators FOR DELETE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- saved_jobs
CREATE POLICY "Creators can view their saved jobs" ON public.saved_jobs FOR SELECT USING (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()));
CREATE POLICY "Creators can save jobs" ON public.saved_jobs FOR INSERT WITH CHECK (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()));
CREATE POLICY "Creators can unsave jobs" ON public.saved_jobs FOR DELETE USING (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()));

-- rate_limits (service_role only)
CREATE POLICY "Service role manages rate limits" ON public.rate_limits FOR ALL USING (auth.role() = 'service_role');

-- webhook_events (service_role only)
CREATE POLICY "Service role only" ON public.webhook_events FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 6. REALTIME — Uključi za tabele koje koriste real-time
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.job_messages;

-- ============================================================
-- KRAJ BACKUP-a
-- ============================================================
