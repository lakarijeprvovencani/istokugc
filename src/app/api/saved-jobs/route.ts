import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch saved jobs for a creator
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    
    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID required' }, { status: 400 });
    }
    
    // Fetch saved jobs with job details
    const { data: savedJobs, error } = await supabase
      .from('saved_jobs')
      .select('id, created_at, job_id')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching saved jobs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // If no saved jobs, return empty array
    if (!savedJobs || savedJobs.length === 0) {
      return NextResponse.json({ savedJobs: [] });
    }
    
    // Fetch job details for each saved job
    const jobIds = savedJobs.map(sj => sj.job_id);
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        description,
        category,
        budget_min,
        budget_max,
        budget_type,
        status,
        created_at,
        business_id
      `)
      .in('id', jobIds);
    
    if (jobsError) {
      console.error('Error fetching job details:', jobsError);
      return NextResponse.json({ error: jobsError.message }, { status: 500 });
    }
    
    // Get business names
    const businessIds = [...new Set(jobs?.map(j => j.business_id) || [])];
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, company_name, logo')
      .in('id', businessIds);
    
    const businessMap = new Map(businesses?.map(b => [b.id, b]) || []);
    
    // Combine saved jobs with job details
    const result = savedJobs.map(sj => {
      const job = jobs?.find(j => j.id === sj.job_id);
      const business = job ? businessMap.get(job.business_id) : null;
      
      return {
        id: sj.id,
        savedAt: sj.created_at,
        job: job ? {
          id: job.id,
          title: job.title,
          description: job.description,
          category: job.category,
          budgetMin: job.budget_min,
          budgetMax: job.budget_max,
          budgetType: job.budget_type,
          status: job.status,
          createdAt: job.created_at,
          businessName: business?.company_name || 'Biznis',
          businessLogo: business?.logo || null,
        } : null
      };
    }).filter(sj => sj.job !== null);
    
    return NextResponse.json({ savedJobs: result });
    
  } catch (error) {
    console.error('Error in saved jobs GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save a job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { creatorId, jobId } = await request.json();
    
    if (!creatorId || !jobId) {
      return NextResponse.json({ error: 'Creator ID and Job ID required' }, { status: 400 });
    }
    
    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('creator_id', creatorId)
      .eq('job_id', jobId)
      .single();
    
    if (existing) {
      return NextResponse.json({ message: 'Already saved', alreadySaved: true });
    }
    
    // Save the job
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert({
        creator_id: creatorId,
        job_id: jobId,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving job:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, savedJob: data });
    
  } catch (error) {
    console.error('Error in saved jobs POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Unsave a job
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const jobId = searchParams.get('jobId');
    
    if (!creatorId || !jobId) {
      return NextResponse.json({ error: 'Creator ID and Job ID required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('creator_id', creatorId)
      .eq('job_id', jobId);
    
    if (error) {
      console.error('Error unsaving job:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error in saved jobs DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

