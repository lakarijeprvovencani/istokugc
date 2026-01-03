/**
 * Approve Review API Route
 * 
 * POST /api/reviews/[id]/approve - Odobri recenziju (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Update review status to approved
    const { data: review, error } = await supabase
      .from('reviews')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error approving review:', error);
      return NextResponse.json(
        { error: 'Failed to approve review' },
        { status: 500 }
      );
    }

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Update creator's average rating
    await updateCreatorRating(supabase, review.creator_id);

    return NextResponse.json({
      review,
      message: 'Review approved successfully',
    });

  } catch (error) {
    console.error('Error approving review:', error);
    return NextResponse.json(
      { error: 'Failed to approve review' },
      { status: 500 }
    );
  }
}

// Helper to update creator's average rating
async function updateCreatorRating(supabase: any, creatorId: string) {
  try {
    // Get all approved reviews for this creator
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('creator_id', creatorId)
      .eq('status', 'approved');

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
      
      await supabase
        .from('creators')
        .update({ 
          average_rating: Math.round(avgRating * 10) / 10,
          total_reviews: reviews.length,
        })
        .eq('id', creatorId);
    }
  } catch (error) {
    console.error('Error updating creator rating:', error);
  }
}
