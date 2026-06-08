import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-helper';
import { checkRateLimit, getApplyLimiter, getClientIp } from '@/lib/rate-limit';

// Maksimalna dužina poruke u pozivu (sprečava DOS i DB bloat)
const MAX_INVITATION_MESSAGE_LENGTH = 1000;

// GET - Fetch invitations
export async function GET(request: Request) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const supabase = createAdminClient();
    
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const businessId = searchParams.get('businessId');
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');

    if (user?.role !== 'admin') {
      if (!creatorId && !businessId) {
        return NextResponse.json({ error: 'creatorId ili businessId je obavezan' }, { status: 400 });
      }
      if (creatorId && user?.creatorId !== creatorId) {
        return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
      }
      if (businessId && user?.businessId !== businessId) {
        return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
      }
    }

    let query = supabase
      .from('job_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }
    if (businessId) {
      query = query.eq('business_id', businessId);
    }
    if (jobId) {
      query = query.eq('job_id', jobId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: invitations, error } = await query;

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json({ error: 'Greška na serveru' }, { status: 500 });
    }

    // OPTIMIZED: Fetch all related data in bulk (3 queries instead of N*3)
    const jobIds = [...new Set((invitations || []).map(i => i.job_id).filter(Boolean))];
    const businessIds = [...new Set((invitations || []).map(i => i.business_id).filter(Boolean))];
    const creatorIds = [...new Set((invitations || []).map(i => i.creator_id).filter(Boolean))];

    const [jobsResult, businessesResult, creatorsResult] = await Promise.all([
      jobIds.length > 0 
        ? supabase.from('jobs').select('*').in('id', jobIds)
        : { data: [] },
      businessIds.length > 0
        ? supabase.from('businesses').select('id, company_name, industry').in('id', businessIds)
        : { data: [] },
      creatorIds.length > 0
        ? supabase.from('creators').select('id, name, photo, location').in('id', creatorIds)
        : { data: [] }
    ]);

    // Create lookup maps
    const jobsMap = new Map((jobsResult.data || []).map(j => [j.id, j]));
    const businessesMap = new Map((businessesResult.data || []).map(b => [b.id, b]));
    const creatorsMap = new Map((creatorsResult.data || []).map(c => [c.id, c]));

    // Enrich invitations using lookup maps
    const enrichedInvitations = (invitations || []).map(invitation => {
      const job = jobsMap.get(invitation.job_id);
      const business = businessesMap.get(invitation.business_id);
      const creator = creatorsMap.get(invitation.creator_id);

      return {
        id: invitation.id,
        jobId: invitation.job_id,
        creatorId: invitation.creator_id,
        businessId: invitation.business_id,
        message: invitation.message,
        status: invitation.status,
        createdAt: invitation.created_at,
        respondedAt: invitation.responded_at,
        job: job || null,
        business: business || null,
        creator: creator || null,
        businessName: business?.company_name || 'Nepoznat biznis',
        creatorName: creator?.name || 'Nepoznat kreator',
        jobTitle: job?.title || 'Nepoznat posao',
      };
    });

    return NextResponse.json({ invitations: enrichedInvitations });
  } catch (error) {
    console.error('Error in GET job-invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new invitation
// ZAŠTIĆENO: Samo biznis vlasnik posla može slati pozive
export async function POST(request: Request) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    // 🚦 RATE LIMIT: Spreči spam poziva (10/min po korisniku)
    const rateLimitId = user?.id || getClientIp(request);
    const rateLimited = await checkRateLimit(getApplyLimiter(), rateLimitId);
    if (rateLimited) return rateLimited;

    const supabase = createAdminClient();
    
    const body = await request.json();
    const { jobId, businessId, creatorId, message } = body;

    if (!jobId || !businessId || !creatorId) {
      return NextResponse.json(
        { error: 'jobId, businessId, and creatorId are required' },
        { status: 400 }
      );
    }

    // Validacija dužine poruke
    if (message && (typeof message !== 'string' || message.length > MAX_INVITATION_MESSAGE_LENGTH)) {
      return NextResponse.json(
        { error: `Poruka u pozivu je predugačka (maksimalno ${MAX_INVITATION_MESSAGE_LENGTH} karaktera)` },
        { status: 400 }
      );
    }
    
    // 🔒 BEZBEDNOSNA PROVERA: Samo vlasnik može slati pozive
    if (user?.role === 'business' && user?.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Ne možete slati pozive u ime drugog biznisa' },
        { status: 403 }
      );
    }

    // Check if invitation already exists
    const { data: existing } = await supabase
      .from('job_invitations')
      .select('id')
      .eq('job_id', jobId)
      .eq('creator_id', creatorId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Već ste poslali poziv ovom kreatoru za ovaj posao' },
        { status: 400 }
      );
    }

    // Check if creator already applied for this job
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('creator_id', creatorId)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Kreator se već prijavio za ovaj posao' },
        { status: 400 }
      );
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('job_invitations')
      .insert({
        job_id: jobId,
        business_id: businessId,
        creator_id: creatorId,
        message: message || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return NextResponse.json({ error: 'Greška na serveru' }, { status: 500 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error in POST job-invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update invitation status (accept/reject)
// ZAŠTIĆENO: Samo kreator koji je pozvan može prihvatiti/odbiti
export async function PUT(request: Request) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const supabase = createAdminClient();
    
    const body = await request.json();
    const { invitationId, status } = body;

    if (!invitationId || !status) {
      return NextResponse.json(
        { error: 'invitationId and status are required' },
        { status: 400 }
      );
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be accepted or rejected' },
        { status: 400 }
      );
    }
    
    // 🔒 BEZBEDNOSNA PROVERA: Dohvati poziv i proveri vlasništvo
    const { data: existingInvitation } = await supabase
      .from('job_invitations')
      .select('creator_id, job_id, business_id')
      .eq('id', invitationId)
      .single();
    
    if (!existingInvitation) {
      return NextResponse.json({ error: 'Poziv nije pronađen' }, { status: 404 });
    }
    
    // Samo kreator koji je pozvan ili admin može odgovoriti
    if (user?.creatorId !== existingInvitation.creator_id && user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Nemate dozvolu za ovu akciju' },
        { status: 403 }
      );
    }

    // Update invitation
    const { data: invitation, error } = await supabase
      .from('job_invitations')
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .select()
      .single();
    
    // Merge with existing data to ensure we have job_id
    const fullInvitation = { ...existingInvitation, ...invitation };

    if (error) {
      console.error('Error updating invitation:', error);
      return NextResponse.json({ error: 'Greška na serveru' }, { status: 500 });
    }

    // If accepted, create a job application with 'engaged' status and close the job
    if (status === 'accepted' && fullInvitation.job_id) {
      console.log('Accepting invitation for job:', fullInvitation.job_id);
      
      // Get job details for the application
      const { data: job } = await supabase
        .from('jobs')
        .select('budget_min, budget_max')
        .eq('id', fullInvitation.job_id)
        .single();
      
      // Create application with 'engaged' status (directly engaged, skipping accepted)
      const { data: newApp, error: appError } = await supabase
        .from('job_applications')
        .insert({
          job_id: fullInvitation.job_id,
          creator_id: fullInvitation.creator_id,
          status: 'engaged',
          cover_letter: `Prihvaćen poziv na posao`,
          proposed_price: job?.budget_min || job?.budget_max || 0,
        })
        .select()
        .single();

      if (appError) {
        console.error('Error creating application from invitation:', appError);
      } else {
        console.log('Created engaged application:', newApp?.id);
      }
      
      // Close the job (move to "U toku")
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', fullInvitation.job_id);
        
      if (jobError) {
        console.error('Error closing job:', jobError);
      } else {
        console.log('Job closed successfully:', fullInvitation.job_id);
      }
      
      // Return the application ID so frontend can use it for chat
      return NextResponse.json({ 
        invitation: fullInvitation,
        applicationId: newApp?.id || null 
      });
    }

    return NextResponse.json({ invitation: fullInvitation });
  } catch (error) {
    console.error('Error in PUT job-invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Cancel invitation
// ZAŠTIĆENO: Samo biznis koji je poslao poziv može ga obrisati
export async function DELETE(request: Request) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const supabase = createAdminClient();
    
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'invitationId is required' },
        { status: 400 }
      );
    }
    
    // 🔒 BEZBEDNOSNA PROVERA: Dohvati poziv i proveri vlasništvo
    const { data: existingInvitation } = await supabase
      .from('job_invitations')
      .select('business_id')
      .eq('id', invitationId)
      .single();
    
    if (!existingInvitation) {
      return NextResponse.json({ error: 'Poziv nije pronađen' }, { status: 404 });
    }
    
    // Samo biznis koji je poslao poziv ili admin može obrisati
    if (user?.businessId !== existingInvitation.business_id && user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Nemate dozvolu za brisanje ovog poziva' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('job_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Error deleting invitation:', error);
      return NextResponse.json({ error: 'Greška na serveru' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE job-invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


