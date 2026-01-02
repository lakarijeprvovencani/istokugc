import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// POST - Dodaj odgovor na recenziju
export async function POST(request: NextRequest) {
  try {
    const { reviewId, reply } = await request.json();

    if (!reviewId || !reply) {
      return NextResponse.json({ error: 'Review ID and reply are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: review, error } = await supabase
      .from('reviews')
      .update({
        reply: reply.trim(),
        reply_date: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Error adding reply:', error);
      return NextResponse.json({ error: 'Failed to add reply' }, { status: 500 });
    }

    return NextResponse.json({ review });

  } catch (error: any) {
    console.error('Add reply error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Ažuriraj odgovor
export async function PUT(request: NextRequest) {
  try {
    const { reviewId, reply } = await request.json();

    if (!reviewId || !reply) {
      return NextResponse.json({ error: 'Review ID and reply are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: review, error } = await supabase
      .from('reviews')
      .update({
        reply: reply.trim(),
        reply_date: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reply:', error);
      return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 });
    }

    return NextResponse.json({ review });

  } catch (error: any) {
    console.error('Update reply error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Obriši odgovor
export async function DELETE(request: NextRequest) {
  try {
    const { reviewId } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: review, error } = await supabase
      .from('reviews')
      .update({
        reply: null,
        reply_date: null,
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting reply:', error);
      return NextResponse.json({ error: 'Failed to delete reply' }, { status: 500 });
    }

    return NextResponse.json({ review });

  } catch (error: any) {
    console.error('Delete reply error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

