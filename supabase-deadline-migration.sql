-- =============================================
-- MIGRACIJA: Dodavanje application_deadline kolone
-- =============================================
-- Pokreni ovu SQL skriptu u Supabase SQL Editor-u

-- Dodaj kolonu za rok prijava (nullable - ako nije postavljeno, nema roka)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline DATE;

-- Kreiraj indeks za brže pretrage po datumu
CREATE INDEX IF NOT EXISTS idx_jobs_application_deadline ON jobs(application_deadline);

-- Proveri da je kolona dodata
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name = 'application_deadline';

