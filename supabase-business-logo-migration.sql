-- ============================================
-- MIGRACIJA: Dodaj logo kolonu u businesses tabelu
-- ============================================

-- Dodaj logo kolonu
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS logo TEXT;

-- Dodaj phone kolonu ako ne postoji
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Ažuriraj jobs tabelu da ima business_logo kolonu za denormalizaciju
-- (opciono, za brže čitanje)
-- ALTER TABLE public.jobs 
-- ADD COLUMN IF NOT EXISTS business_logo TEXT;

COMMENT ON COLUMN public.businesses.logo IS 'URL loga kompanije (uploadovan na Supabase Storage)';



