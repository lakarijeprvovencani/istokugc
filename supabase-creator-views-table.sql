-- ============================================
-- TABELA: creator_views
-- Beleži kada biznis pregleda profil kreatora
-- ============================================

-- Kreiraj tabelu
CREATE TABLE IF NOT EXISTS public.creator_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint - jedan biznis može imati samo jedan view za jednog kreatora
  -- (viewed_at se ažurira svakim pregledom)
  CONSTRAINT unique_business_creator_view UNIQUE (business_id, creator_id)
);

-- Index za brže pretrage
CREATE INDEX IF NOT EXISTS idx_creator_views_business_id ON public.creator_views(business_id);
CREATE INDEX IF NOT EXISTS idx_creator_views_creator_id ON public.creator_views(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_views_viewed_at ON public.creator_views(viewed_at DESC);

-- RLS policies (opciono - zavisi od tvoje konfiguracije)
ALTER TABLE public.creator_views ENABLE ROW LEVEL SECURITY;

-- Biznis može videti samo svoje preglede
CREATE POLICY "Businesses can view own views" ON public.creator_views
  FOR SELECT USING (business_id = auth.uid()::text::uuid);

-- Biznis može beležiti samo svoje preglede  
CREATE POLICY "Businesses can insert own views" ON public.creator_views
  FOR INSERT WITH CHECK (business_id = auth.uid()::text::uuid);

-- Biznis može ažurirati samo svoje preglede
CREATE POLICY "Businesses can update own views" ON public.creator_views
  FOR UPDATE USING (business_id = auth.uid()::text::uuid);

COMMENT ON TABLE public.creator_views IS 'Beleži preglede profila kreatora od strane biznisa';

