/**
 * Reject Review API Route
 * 
 * POST /api/reviews/[id]/reject - Odbij recenziju (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser, isAdmin } from '@/lib/auth-helper';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Samo admin može odbiti recenzije' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const supabase = createAdminClient();

    // Update review status to rejected
    const { data: review, error } = await supabase
      .from('reviews')
      .update({ 
        status: 'rejected',
        rejection_reason: body.reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting review:', error);
      return NextResponse.json(
        { error: 'Failed to reject review' },
        { status: 500 }
      );
    }

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      review,
      message: 'Review rejected successfully',
    });

  } catch (error) {
    console.error('Error rejecting review:', error);
    return NextResponse.json(
      { error: 'Failed to reject review' },
      { status: 500 }
    );
  }
}
