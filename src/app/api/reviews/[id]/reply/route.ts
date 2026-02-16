/**
 * Review Reply API Route
 * 
 * POST /api/reviews/[id]/reply - Dodaj odgovor na recenziju (kreator)
 * PUT /api/reviews/[id]/reply - Ažuriraj odgovor
 * DELETE /api/reviews/[id]/reply - Obriši odgovor
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// POST - Dodaj odgovor
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reply } = await request.json();
    const supabase = createAdminClient();

    if (!reply || !reply.trim()) {
      return NextResponse.json(
        { error: 'Reply is required' },
        { status: 400 }
      );
    }

    // Update review with reply
    const { data: review, error } = await supabase
      .from('reviews')
      .update({ 
        reply: reply.trim(),
        reply_date: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error adding reply:', error);
      return NextResponse.json(
        { error: 'Failed to add reply' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      review,
      message: 'Reply added successfully',
    });

  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json(
      { error: 'Failed to add reply' },
      { status: 500 }
    );
  }
}

// PUT - Ažuriraj odgovor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reply } = await request.json();
    const supabase = createAdminClient();

    if (!reply || !reply.trim()) {
      return NextResponse.json(
        { error: 'Reply is required' },
        { status: 400 }
      );
    }

    // Update reply
    const { data: review, error } = await supabase
      .from('reviews')
      .update({ 
        reply: reply.trim(),
        reply_date: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reply:', error);
      return NextResponse.json(
        { error: 'Failed to update reply' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      review,
      message: 'Reply updated successfully',
    });

  } catch (error) {
    console.error('Error updating reply:', error);
    return NextResponse.json(
      { error: 'Failed to update reply' },
      { status: 500 }
    );
  }
}

// DELETE - Obriši odgovor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Remove reply
    const { data: review, error } = await supabase
      .from('reviews')
      .update({ 
        reply: null,
        reply_date: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting reply:', error);
      return NextResponse.json(
        { error: 'Failed to delete reply' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      review,
      message: 'Reply deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting reply:', error);
    return NextResponse.json(
      { error: 'Failed to delete reply' },
      { status: 500 }
    );
  }
}