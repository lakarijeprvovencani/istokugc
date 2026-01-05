/**
 * Admin Jobs API Route
 * 
 * POST /api/admin/jobs - Kreiraj novi posao (admin)
 * PUT /api/admin/jobs - Ažuriraj posao (admin)
 * DELETE /api/admin/jobs - Obriši posao (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// POST - Create new job (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      platforms,
      budgetType,
      budgetMin,
      budgetMax,
      duration,
      experienceLevel,
      businessId,
    } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'title, description i category su obavezni' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Admin kreiran posao je automatski 'open'
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        business_id: businessId || null, // Admin može kreirati bez business_id
        title,
        description,
        category,
        platforms: platforms || [],
        budget_type: budgetType || 'fixed',
        budget_min: budgetMin || null,
        budget_max: budgetMax || null,
        duration: duration || null,
        experience_level: experienceLevel || null,
        status: 'open', // Admin jobs su automatski odobreni
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return NextResponse.json(
        { error: 'Greška pri kreiranju posla', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ job, message: 'Posao uspešno kreiran' });

  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Greška pri kreiranju posla', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update job (status or all fields)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, status, ...updates } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId je obavezan' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Status update
    if (status) {
      const validStatuses = ['open', 'closed', 'pending', 'rejected', 'completed', 'deleted'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Nevažeći status' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Other field updates
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.platforms !== undefined) updateData.platforms = updates.platforms;
    if (updates.budgetType !== undefined) updateData.budget_type = updates.budgetType;
    if (updates.budgetMin !== undefined) updateData.budget_min = updates.budgetMin;
    if (updates.budgetMax !== undefined) updateData.budget_max = updates.budgetMax;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.experienceLevel !== undefined) updateData.experience_level = updates.experienceLevel;
    if (updates.applicationDeadline !== undefined) updateData.application_deadline = updates.applicationDeadline;

    const { data: job, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Error updating job:', error);
      return NextResponse.json(
        { error: 'Greška pri ažuriranju posla', details: error.message },
        { status: 500 }
      );
    }

    if (!job) {
      return NextResponse.json(
        { error: 'Posao nije pronađen' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      job,
      message: 'Posao uspešno ažuriran',
    });

  } catch (error: any) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju posla', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete job (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId je obavezan' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Soft delete - set status to 'deleted'
    const { error } = await supabase
      .from('jobs')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      console.error('Error deleting job:', error);
      return NextResponse.json(
        { error: 'Greška pri brisanju posla', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Posao uspešno obrisan',
    });

  } catch (error: any) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju posla', details: error.message },
      { status: 500 }
    );
  }
}
