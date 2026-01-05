-- ============================================
-- JOB INVITATIONS TABLE SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Create job_invitations table
CREATE TABLE IF NOT EXISTS public.job_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Prevent duplicate invitations for same job-creator combination
    UNIQUE(job_id, creator_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_job_invitations_creator_id ON public.job_invitations(creator_id);
CREATE INDEX IF NOT EXISTS idx_job_invitations_business_id ON public.job_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_job_invitations_job_id ON public.job_invitations(job_id);
CREATE INDEX IF NOT EXISTS idx_job_invitations_status ON public.job_invitations(status);

-- Enable RLS
ALTER TABLE public.job_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Creators can view invitations sent to them
CREATE POLICY "Creators can view their invitations"
    ON public.job_invitations FOR SELECT
    USING (creator_id::text = auth.uid()::text);

-- Businesses can view invitations they sent
CREATE POLICY "Businesses can view their sent invitations"
    ON public.job_invitations FOR SELECT
    USING (business_id::text = auth.uid()::text);

-- Businesses can create invitations
CREATE POLICY "Businesses can create invitations"
    ON public.job_invitations FOR INSERT
    WITH CHECK (business_id::text = auth.uid()::text);

-- Creators can update invitation status (accept/reject)
CREATE POLICY "Creators can respond to invitations"
    ON public.job_invitations FOR UPDATE
    USING (creator_id::text = auth.uid()::text)
    WITH CHECK (creator_id::text = auth.uid()::text);

-- Businesses can delete their pending invitations
CREATE POLICY "Businesses can cancel pending invitations"
    ON public.job_invitations FOR DELETE
    USING (business_id::text = auth.uid()::text AND status = 'pending');

-- Grant permissions
GRANT ALL ON public.job_invitations TO authenticated;
GRANT ALL ON public.job_invitations TO service_role;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the table was created:
-- SELECT * FROM public.job_invitations LIMIT 1;


