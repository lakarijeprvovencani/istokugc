-- Create saved_jobs table for creators to bookmark jobs
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a creator can only save a job once
    UNIQUE(creator_id, job_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_jobs_creator_id ON public.saved_jobs(creator_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id);

-- Enable RLS
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Creators can see their own saved jobs
CREATE POLICY "Creators can view their saved jobs"
    ON public.saved_jobs FOR SELECT
    USING (creator_id IN (
        SELECT id FROM public.creators WHERE user_id = auth.uid()
    ));

-- Creators can save jobs
CREATE POLICY "Creators can save jobs"
    ON public.saved_jobs FOR INSERT
    WITH CHECK (creator_id IN (
        SELECT id FROM public.creators WHERE user_id = auth.uid()
    ));

-- Creators can unsave their jobs
CREATE POLICY "Creators can unsave jobs"
    ON public.saved_jobs FOR DELETE
    USING (creator_id IN (
        SELECT id FROM public.creators WHERE user_id = auth.uid()
    ));


