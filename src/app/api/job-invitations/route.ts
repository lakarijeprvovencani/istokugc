import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch invitations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const businessId = searchParams.get('businessId');
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch related data for each invitation
    const enrichedInvitations = await Promise.all(
      (invitations || []).map(async (invitation) => {
        // Fetch job details
        const { data: job } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', invitation.job_id)
          .single();

        // Fetch business details
        const { data: business } = await supabase
          .from('businesses')
          .select('id, company_name, industry')
          .eq('id', invitation.business_id)
          .single();

        // Fetch creator details
        const { data: creator, error: creatorError } = await supabase
          .from('creators')
          .select('id, name, photo, location')
          .eq('id', invitation.creator_id)
          .single();
        
        if (creatorError) {
          console.error('Error fetching creator:', creatorError, 'creator_id:', invitation.creator_id);
        }

        return {
          ...invitation,
          job: job || null,
          business: business || null,
          creator: creator || null,
          businessName: business?.company_name || 'Nepoznat biznis',
          creatorName: creator?.name || 'Nepoznat kreator',
          jobTitle: job?.title || 'Nepoznat posao',
        };
      })
    );

    return NextResponse.json({ invitations: enrichedInvitations });
  } catch (error) {
    console.error('Error in GET job-invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new invitation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, businessId, creatorId, message } = body;

    if (!jobId || !businessId || !creatorId) {
      return NextResponse.json(
        { error: 'jobId, businessId, and creatorId are required' },
        { status: 400 }
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error in POST job-invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update invitation status (accept/reject)
export async function PUT(request: Request) {
  try {
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

    if (error) {
      console.error('Error updating invitation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If accepted, create a job application with 'engaged' status and close the job
    if (status === 'accepted' && invitation) {
      // Get job details for the application
      const { data: job } = await supabase
        .from('jobs')
        .select('budget_min, budget_max')
        .eq('id', invitation.job_id)
        .single();
      
      // Create application with 'engaged' status (directly engaged, skipping accepted)
      const { data: newApp, error: appError } = await supabase
        .from('job_applications')
        .insert({
          job_id: invitation.job_id,
          creator_id: invitation.creator_id,
          status: 'engaged',
          cover_letter: `Prihvaćen poziv na posao`,
          proposed_price: job?.budget_min || job?.budget_max || 0,
        })
        .select()
        .single();

      if (appError) {
        console.error('Error creating application from invitation:', appError);
      }
      
      // Close the job (move to "U toku")
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', invitation.job_id);
        
      if (jobError) {
        console.error('Error closing job:', jobError);
      }
      
      // Return the application ID so frontend can use it for chat
      return NextResponse.json({ 
        invitation,
        applicationId: newApp?.id || null 
      });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error in PUT job-invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Cancel invitation
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'invitationId is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('job_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Error deleting invitation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE job-invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


