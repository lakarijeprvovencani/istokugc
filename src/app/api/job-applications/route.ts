import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-helper';

// GET /api/job-applications - Dohvati prijave
// NAPOMENA: GET ostaje otvoren jer se koristi za prikaz (bezbednost je u tome ŠTA se prikazuje)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const creatorId = searchParams.get('creatorId');
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status');

    const supabase = createAdminClient();

    // Simple query - no nested joins
    let query = supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by job
    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    // Filter by creator (for creator dashboard)
    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    // Filter by business (get all applications for all jobs of this business)
    if (businessId) {
      // First get all job IDs for this business
      const { data: businessJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('business_id', businessId);
      
      if (businessJobs && businessJobs.length > 0) {
        const jobIds = businessJobs.map(j => j.id);
        query = query.in('job_id', jobIds);
      } else {
        // No jobs for this business
        return NextResponse.json({ applications: [] });
      }
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ applications: [] });
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    // Fetch job details separately
    const jobIds = [...new Set(applications.map(a => a.job_id).filter(Boolean))];
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .in('id', jobIds);
    
    const jobsMap: Record<string, any> = {};
    if (jobs) {
      for (const job of jobs) {
        jobsMap[job.id] = job;
      }
    }

    // Fetch business details separately
    const businessIds = [...new Set(jobs?.map(j => j.business_id).filter(Boolean) || [])];
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, company_name')
      .in('id', businessIds);
    
    const businessesMap: Record<string, any> = {};
    if (businesses) {
      for (const b of businesses) {
        businessesMap[b.id] = b;
      }
    }

    // Fetch creator details separately
    const creatorIds = [...new Set(applications.map(a => a.creator_id).filter(Boolean))];
    const { data: creators } = await supabase
      .from('creators')
      .select('id, name, photo, email, categories')
      .in('id', creatorIds);
    
    const creatorsMap: Record<string, any> = {};
    if (creators) {
      for (const c of creators) {
        creatorsMap[c.id] = c;
      }
    }

    // Format applications with related data
    const formattedApplications = applications.map(app => {
      const job = jobsMap[app.job_id];
      const business = job ? businessesMap[job.business_id] : null;
      const creator = creatorsMap[app.creator_id];
      
      return {
        id: app.id,
        jobId: app.job_id,
        creatorId: app.creator_id,
        coverLetter: app.cover_letter,
        proposedPrice: app.proposed_price,
        estimatedDuration: app.estimated_duration,
        status: app.status,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
        job: job ? {
          id: job.id,
          title: job.title,
          description: job.description,
          category: job.category,
          platforms: job.platforms,
          budgetType: job.budget_type,
          budgetMin: job.budget_min,
          budgetMax: job.budget_max,
          status: job.status,
          businessId: job.business_id,
          businessName: business?.company_name || '',
        } : null,
        creator: creator ? {
          id: creator.id,
          name: creator.name,
          photo: creator.photo,
          email: creator.email,
          categories: creator.categories,
        } : null,
      };
    });

    return NextResponse.json({ applications: formattedApplications });

  } catch (error: any) {
    console.error('Applications fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/job-applications - Kreiraj novu prijavu
// ZAŠTIĆENO: Samo ulogovani kreatori mogu kreirati prijave
export async function POST(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const body = await request.json();
    const {
      jobId,
      creatorId,
      coverLetter,
      proposedPrice,
      estimatedDuration,
    } = body;

    if (!jobId || !creatorId || !coverLetter || !proposedPrice) {
      return NextResponse.json(
        { error: 'jobId, creatorId, coverLetter i proposedPrice su obavezni' },
        { status: 400 }
      );
    }
    
    // 🔒 BEZBEDNOSNA PROVERA: Kreator može prijaviti samo sebe
    if (user?.role === 'creator' && user?.creatorId !== creatorId) {
      return NextResponse.json(
        { error: 'Ne možete se prijaviti u ime drugog kreatora' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Check if already applied
    const { data: existing } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('creator_id', creatorId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Već ste se prijavili na ovaj posao' },
        { status: 400 }
      );
    }

    // Check if job is still open
    const { data: job } = await supabase
      .from('jobs')
      .select('status')
      .eq('id', jobId)
      .single();

    if (!job || job.status !== 'open') {
      return NextResponse.json(
        { error: 'Ovaj posao više nije otvoren za prijave' },
        { status: 400 }
      );
    }

    const { data: application, error } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        creator_id: creatorId,
        cover_letter: coverLetter,
        proposed_price: proposedPrice,
        estimated_duration: estimatedDuration || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    return NextResponse.json({ application });

  } catch (error: any) {
    console.error('Application creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/job-applications - Ažuriraj prijavu (prihvati/odbij)
// ZAŠTIĆENO: Samo vlasnik prijave ili vlasnik posla može menjati status
export async function PUT(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const body = await request.json();
    const { applicationId, status } = body;

    if (!applicationId || !status) {
      return NextResponse.json({ error: 'applicationId i status su obavezni' }, { status: 400 });
    }

    if (!['pending', 'accepted', 'rejected', 'withdrawn', 'engaged', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Nevažeći status' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // 🔒 BEZBEDNOSNA PROVERA: Dohvati prijavu i proveri vlasništvo
    const { data: existingApp } = await supabase
      .from('job_applications')
      .select('creator_id, job_id')
      .eq('id', applicationId)
      .single();
    
    if (!existingApp) {
      return NextResponse.json({ error: 'Prijava nije pronađena' }, { status: 404 });
    }
    
    // Dohvati posao da proverimo vlasnika
    const { data: job } = await supabase
      .from('jobs')
      .select('business_id')
      .eq('id', existingApp.job_id)
      .single();
    
    // Proveri da li korisnik ima pravo da menja status
    const isApplicationOwner = user?.creatorId === existingApp.creator_id;
    const isJobOwner = user?.businessId === job?.business_id;
    const isAdminUser = user?.role === 'admin';
    
    if (!isApplicationOwner && !isJobOwner && !isAdminUser) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za ovu akciju' },
        { status: 403 }
      );
    }
    
    // Kreator može samo povući svoju prijavu (withdrawn)
    if (isApplicationOwner && !isJobOwner && !isAdminUser && status !== 'withdrawn') {
      return NextResponse.json(
        { error: 'Možete samo povući svoju prijavu' },
        { status: 403 }
      );
    }

    const { data: application, error } = await supabase
      .from('job_applications')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // NOTE: Job status only changes when business clicks "Angažuj kreatora"
    // Accepting an application keeps the job "open" for other applications

    return NextResponse.json({ application });

  } catch (error: any) {
    console.error('Application update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/job-applications - Povuci prijavu
// ZAŠTIĆENO: Samo vlasnik prijave može obrisati svoju prijavu
export async function DELETE(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId je obavezan' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // 🔒 BEZBEDNOSNA PROVERA: Dohvati prijavu i proveri vlasništvo
    const { data: application } = await supabase
      .from('job_applications')
      .select('creator_id')
      .eq('id', applicationId)
      .single();
    
    if (!application) {
      return NextResponse.json({ error: 'Prijava nije pronađena' }, { status: 404 });
    }
    
    // Samo vlasnik prijave ili admin može obrisati
    const isOwner = user?.creatorId === application.creator_id;
    const isAdminUser = user?.role === 'admin';
    
    if (!isOwner && !isAdminUser) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za brisanje ove prijave' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', applicationId);

    if (error) {
      console.error('Error deleting application:', error);
      return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Application deletion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

