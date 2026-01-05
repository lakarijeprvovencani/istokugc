-- ============================================
-- SUPABASE SETUP - UGC PLATFORM
-- ============================================
-- Pokreni ovaj SQL u Supabase SQL Editor
-- Dashboard > SQL Editor > New query
-- ============================================

-- 1. USERS TABELA (povezana sa Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('creator', 'business', 'admin')) DEFAULT 'creator',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATORS TABELA
-- ============================================
CREATE TABLE IF NOT EXISTS public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Osnovni podaci
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT NOT NULL,
  bio TEXT NOT NULL,
  photo TEXT, -- URL ili base64
  
  -- Kategorije i platforme (JSON arrays)
  categories TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  
  -- Cena
  price_from INTEGER NOT NULL DEFAULT 100,
  
  -- Društvene mreže
  instagram TEXT,
  tiktok TEXT,
  youtube TEXT,
  
  -- Portfolio (JSON)
  portfolio JSONB DEFAULT '[]',
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'deactivated')) DEFAULT 'pending',
  rejection_reason TEXT,
  
  -- Statistika
  profile_views INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUSINESSES TABELA (za kasnije)
-- ============================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Osnovni podaci
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  description TEXT,
  website TEXT,
  industry TEXT,
  
  -- Subscription
  subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly')),
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('active', 'expired', 'none')),
  subscribed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Uključi RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Creators policies
CREATE POLICY "Anyone can view approved creators" ON public.creators
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Creators can view own profile" ON public.creators
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Creators can update own profile" ON public.creators
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can insert creators" ON public.creators
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all creators" ON public.creators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update any creator" ON public.creators
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Businesses policies
CREATE POLICY "Businesses can view own data" ON public.businesses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Businesses can update own data" ON public.businesses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can insert businesses" ON public.businesses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all businesses" ON public.businesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger za users
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger za creators
DROP TRIGGER IF EXISTS creators_updated_at ON public.creators;
CREATE TRIGGER creators_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger za businesses
DROP TRIGGER IF EXISTS businesses_updated_at ON public.businesses;
CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_creators_status ON public.creators(status);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON public.creators(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);

-- ============================================
-- DONE! Tabele su kreirane.
-- ============================================



