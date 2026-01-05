import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/jobs - Dohvati poslove
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const category = searchParams.get('category');
    const platform = searchParams.get('platform');
    const budgetMin = searchParams.get('budgetMin');
    const budgetMax = searchParams.get('budgetMax');
    const status = searchParams.get('status') || 'open';
    const includeAll = searchParams.get('includeAll') === 'true'; // Admin flag to get all jobs
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createAdminClient();

    // Fetch jobs
    let query = supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by business (for dashboard) - return ALL statuses for that business
    if (businessId) {
      console.log('Filtering by businessId:', businessId);
      query = query.eq('business_id', businessId);
    } else if (includeAll) {
      // Admin view - get all jobs (no status filter)
      console.log('Admin view - no status filter, getting ALL jobs');
    } else {
      // Public view - only open (approved) jobs
      console.log('Public view - filtering by status:', status);
      query = query.eq('status', status);
    }

    // Filter by category
    if (category) {
      query = query.eq('category', category);
    }

    // Filter by platform
    if (platform) {
      query = query.contains('platforms', [platform]);
    }

    // Filter by budget
    if (budgetMin) {
      query = query.gte('budget_max', parseInt(budgetMin));
    }
    if (budgetMax) {
      query = query.lte('budget_min', parseInt(budgetMax));
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    // For each job, fetch its business company_name directly
    const jobsWithBusiness = await Promise.all(
      (jobs || []).map(async (job) => {
        let companyName = '';
        
        if (job.business_id) {
          const { data: business } = await supabase
            .from('businesses')
            .select('company_name')
            .eq('id', job.business_id)
            .single();
          
          if (business) {
            companyName = business.company_name;
          }
        }
        
        return { ...job, companyName };
      })
    );

    // Format jobs
    const formattedJobs = jobsWithBusiness.map(job => {
      // Check if job has expired deadline
      const isExpired = job.application_deadline && new Date(job.application_deadline) < new Date();
      
      return {
        id: job.id,
        businessId: job.business_id,
        businessName: job.companyName || '',
        title: job.title,
        description: job.description,
        category: job.category,
        platforms: job.platforms || [],
        budgetType: job.budget_type,
        budgetMin: job.budget_min,
        budgetMax: job.budget_max,
        duration: job.duration,
        experienceLevel: job.experience_level,
        applicationDeadline: job.application_deadline,
        isExpired,
        status: job.status,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      };
    });
    
    // For public view, filter out expired jobs (unless businessId is provided)
    const filteredJobs = businessId || includeAll 
      ? formattedJobs 
      : formattedJobs.filter(job => !job.isExpired);

    return NextResponse.json({ jobs: filteredJobs });

  } catch (error: any) {
    console.error('Jobs fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/jobs - Kreiraj novi posao
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      title,
      description,
      category,
      platforms,
      budgetType,
      budgetMin,
      budgetMax,
      duration,
      experienceLevel,
      applicationDeadline,
      isAdmin, // Flag to check if admin is creating the job
    } = body;

    if (!businessId || !title || !description || !category) {
      return NextResponse.json(
        { error: 'businessId, title, description i category su obavezni' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // If admin creates job, it's automatically approved ('open')
    // If business creates job, it needs approval ('pending')
    const initialStatus = isAdmin ? 'open' : 'pending';

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        business_id: businessId,
        title,
        description,
        category,
        platforms: platforms || [],
        budget_type: budgetType || 'fixed',
        budget_min: budgetMin || null,
        budget_max: budgetMax || null,
        duration: duration || null,
        experience_level: experienceLevel || null,
        application_deadline: applicationDeadline || null,
        status: initialStatus,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return NextResponse.json({ 
        error: error.message || 'Failed to create job',
        details: error.details || null,
        code: error.code || null
      }, { status: 500 });
    }

    console.log('Job created successfully:', job?.id);
    return NextResponse.json({ job, needsApproval: !isAdmin });

  } catch (error: any) {
    console.error('Job creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/jobs - Ažuriraj posao
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, ...updates } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId je obavezan' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Map camelCase to snake_case
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.platforms) dbUpdates.platforms = updates.platforms;
    if (updates.budgetType) dbUpdates.budget_type = updates.budgetType;
    if (updates.budgetMin !== undefined) dbUpdates.budget_min = updates.budgetMin;
    if (updates.budgetMax !== undefined) dbUpdates.budget_max = updates.budgetMax;
    if (updates.duration) dbUpdates.duration = updates.duration;
    if (updates.experienceLevel) dbUpdates.experience_level = updates.experienceLevel;
    if (updates.applicationDeadline !== undefined) dbUpdates.application_deadline = updates.applicationDeadline;
    if (updates.status) dbUpdates.status = updates.status;
    dbUpdates.updated_at = new Date().toISOString();

    const { data: job, error } = await supabase
      .from('jobs')
      .update(dbUpdates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Error updating job:', error);
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
    }

    return NextResponse.json({ job });

  } catch (error: any) {
    console.error('Job update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/jobs - Obriši posao
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId je obavezan' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // 1. First, update all job applications to 'cancelled' status
    const { error: appsError } = await supabase
      .from('job_applications')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('job_id', jobId);
    
    if (appsError) {
      console.error('Error cancelling applications:', appsError);
      // Continue anyway - some tables might not exist
    }
    
    // 2. Update all job invitations to 'cancelled' status
    const { error: invsError } = await supabase
      .from('job_invitations')
      .update({ 
        status: 'cancelled',
        responded_at: new Date().toISOString()
      })
      .eq('job_id', jobId);
    
    if (invsError) {
      console.error('Error cancelling invitations:', invsError);
      // Continue anyway - some tables might not exist
    }
    
    // 3. Instead of hard delete, mark job as deleted (so creators can see what happened)
    const { error } = await supabase
      .from('jobs')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (error) {
      console.error('Error deleting job:', error);
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Job deletion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

