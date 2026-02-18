-- ============================================
-- FIX: creator_views RLS policies
-- Problem: business_id se poredilo sa auth.uid() ali to su razliciti ID-jevi
-- ============================================

DROP POLICY IF EXISTS "Businesses can view own views" ON public.creator_views;
DROP POLICY IF EXISTS "Businesses can insert views" ON public.creator_views;
DROP POLICY IF EXISTS "Businesses can update views" ON public.creator_views;

CREATE POLICY "Businesses can view own views" ON public.creator_views
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Businesses can insert views" ON public.creator_views
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Businesses can update views" ON public.creator_views
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );


-- ============================================
-- FIX: job_invitations RLS policies
-- Problem: creator_id i business_id se poredili sa auth.uid() ali to su razliciti ID-jevi
-- ============================================

DROP POLICY IF EXISTS "Creators can view their invitations" ON public.job_invitations;
DROP POLICY IF EXISTS "Businesses can create invitations" ON public.job_invitations;
DROP POLICY IF EXISTS "Creators can respond to invitations" ON public.job_invitations;
DROP POLICY IF EXISTS "Businesses can cancel pending invitations" ON public.job_invitations;

CREATE POLICY "Creators can view their invitations" ON public.job_invitations
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
    OR business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Businesses can create invitations" ON public.job_invitations
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Creators can respond to invitations" ON public.job_invitations
  FOR UPDATE USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

CREATE POLICY "Businesses can cancel pending invitations" ON public.job_invitations
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    AND status = 'pending'
  );
