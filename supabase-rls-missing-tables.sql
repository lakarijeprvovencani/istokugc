-- ============================================
-- RLS polise za tabele: reviews, saved_creators, categories
-- NAPOMENA: Ako tabela vec ima RLS ukljucen, ALTER TABLE nece nista pokvariti.
-- Ako polise vec postoje, DROP POLICY ce ih obrisati pre kreiranja novih.
-- ============================================


-- ============================================
-- 1. REVIEWS
-- ============================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Business can see own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Creator can see reviews on own profile" ON public.reviews;
DROP POLICY IF EXISTS "Admin can see all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Business can create review" ON public.reviews;
DROP POLICY IF EXISTS "Business can update own review" ON public.reviews;
DROP POLICY IF EXISTS "Business can delete own review" ON public.reviews;
DROP POLICY IF EXISTS "Admin can update any review" ON public.reviews;
DROP POLICY IF EXISTS "Admin can delete any review" ON public.reviews;

-- Javno: svako moze videti odobrene recenzije
CREATE POLICY "Public can read approved reviews" ON public.reviews
  FOR SELECT USING (status = 'approved');

-- Biznis vidi sve svoje recenzije (i pending i rejected)
CREATE POLICY "Business can see own reviews" ON public.reviews
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Kreator vidi recenzije na svom profilu
CREATE POLICY "Creator can see reviews on own profile" ON public.reviews
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- Admin vidi sve
CREATE POLICY "Admin can see all reviews" ON public.reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Biznis moze kreirati recenziju
CREATE POLICY "Business can create review" ON public.reviews
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Biznis moze menjati svoju recenziju
CREATE POLICY "Business can update own review" ON public.reviews
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Biznis moze obrisati svoju recenziju
CREATE POLICY "Business can delete own review" ON public.reviews
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Admin moze menjati sve recenzije (odobrenje/odbijanje)
CREATE POLICY "Admin can update any review" ON public.reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin moze obrisati sve recenzije
CREATE POLICY "Admin can delete any review" ON public.reviews
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================
-- 2. SAVED_CREATORS (favorites)
-- ============================================

ALTER TABLE public.saved_creators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business can see own favorites" ON public.saved_creators;
DROP POLICY IF EXISTS "Business can add favorites" ON public.saved_creators;
DROP POLICY IF EXISTS "Business can remove favorites" ON public.saved_creators;

-- Biznis vidi samo svoje favorite
CREATE POLICY "Business can see own favorites" ON public.saved_creators
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Biznis moze dodavati favorite
CREATE POLICY "Business can add favorites" ON public.saved_creators
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Biznis moze uklanjati favorite
CREATE POLICY "Business can remove favorites" ON public.saved_creators
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );


-- ============================================
-- 3. CATEGORIES
-- ============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;

-- Svi mogu citati kategorije (javni podatak)
CREATE POLICY "Anyone can read categories" ON public.categories
  FOR SELECT USING (true);

-- Samo admin moze menjati kategorije
CREATE POLICY "Admin can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
