-- =============================================
-- JOB BOARD TABLES - UGC Select
-- =============================================

-- Jobs table - poslovi koje biznisi postavljaju
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  platforms TEXT[] DEFAULT '{}', -- Instagram, TikTok, YouTube
  budget_type VARCHAR(20) NOT NULL DEFAULT 'fixed', -- 'fixed' or 'hourly'
  budget_min INTEGER, -- minimalni budžet u EUR
  budget_max INTEGER, -- maksimalni budžet u EUR
  duration VARCHAR(50), -- npr. "1 nedelja", "2-4 nedelje", "1+ mesec"
  experience_level VARCHAR(50), -- 'beginner', 'intermediate', 'expert'
  application_deadline DATE, -- rok za prijave (nullable - ako nije postavljeno, nema roka)
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'closed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dodaj kolonu ako tabela već postoji (za migraciju)
-- ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline DATE;

-- Job applications table - prijave kreatora na poslove
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL,
  proposed_price INTEGER NOT NULL, -- predložena cena u EUR
  estimated_duration VARCHAR(100), -- procenjeno vreme za završetak
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'withdrawn'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, creator_id) -- kreator može aplicirati samo jednom po poslu
);

-- Job messages table - poruke unutar prijave
CREATE TABLE IF NOT EXISTS job_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- 'business' or 'creator'
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes za brže pretrage
CREATE INDEX IF NOT EXISTS idx_jobs_business_id ON jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_creator_id ON job_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

CREATE INDEX IF NOT EXISTS idx_job_messages_application_id ON job_messages(application_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_created_at ON job_messages(created_at);

-- RLS Policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_messages ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Anyone can view open jobs" ON jobs
  FOR SELECT USING (status = 'open' OR status = 'in_progress');

CREATE POLICY "Businesses can manage their own jobs" ON jobs
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Job applications policies
CREATE POLICY "Creators can view their own applications" ON job_applications
  FOR SELECT USING (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Businesses can view applications for their jobs" ON job_applications
  FOR SELECT USING (
    job_id IN (
      SELECT id FROM jobs WHERE business_id IN (
        SELECT id FROM businesses WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Creators can create applications" ON job_applications
  FOR INSERT WITH CHECK (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update their own applications" ON job_applications
  FOR UPDATE USING (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

-- Job messages policies
CREATE POLICY "Participants can view messages" ON job_messages
  FOR SELECT USING (
    application_id IN (
      SELECT ja.id FROM job_applications ja
      JOIN jobs j ON j.id = ja.job_id
      WHERE 
        ja.creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
        OR j.business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages" ON job_messages
  FOR INSERT WITH CHECK (
    application_id IN (
      SELECT ja.id FROM job_applications ja
      JOIN jobs j ON j.id = ja.job_id
      WHERE 
        ja.creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
        OR j.business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    )
  );


