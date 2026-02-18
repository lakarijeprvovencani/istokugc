/**
 * Single Review API Route
 * 
 * GET /api/reviews/[id] - Dohvati pojedinačnu recenziju
 * PUT /api/reviews/[id] - Ažuriraj recenziju
 * DELETE /api/reviews/[id] - Obriši recenziju
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser, isAdmin } from '@/lib/auth-helper';
import { MIN_COMMENT_LENGTH, MAX_COMMENT_LENGTH } from '@/types/review';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    
    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        *,
        creators (id, name, photo),
        businesses (id, company_name)
      `)
      .eq('id', id)
      .single();
    
    if (error || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Transform to expected format
    const formattedReview = {
      id: review.id,
      creatorId: review.creator_id,
      creatorName: review.creators?.name,
      creatorPhoto: review.creators?.photo,
      businessId: review.business_id,
      businessName: review.businesses?.company_name,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      creatorReply: review.reply,
      replyDate: review.reply_date,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
    };

    return NextResponse.json({ review: formattedReview });

  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    // Check if review exists and verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('reviews')
      .select('id, business_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (!isAdmin(user!) && user?.businessId !== existing.business_id) {
      return NextResponse.json(
        { error: 'Možete menjati samo svoje recenzije' },
        { status: 403 }
      );
    }

    // Validate updates
    if (body.rating && (body.rating < 1 || body.rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (body.comment) {
      const trimmedComment = body.comment.trim();
      if (trimmedComment.length < MIN_COMMENT_LENGTH) {
        return NextResponse.json(
          { error: `Comment must be at least ${MIN_COMMENT_LENGTH} characters` },
          { status: 400 }
        );
      }
      if (trimmedComment.length > MAX_COMMENT_LENGTH) {
        return NextResponse.json(
          { error: `Comment must not exceed ${MAX_COMMENT_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.rating) updateData.rating = body.rating;
    if (body.comment) updateData.comment = body.comment.trim();
    if (body.status && isAdmin(user!)) updateData.status = body.status;

    // If content changes, reset to pending for re-moderation
    if (body.rating || body.comment) {
      updateData.status = 'pending';
    }

    // Update review
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      review: updatedReview,
      message: 'Review updated successfully',
    });

  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const { id } = await params;
    const supabase = createAdminClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('reviews')
      .select('business_id')
      .eq('id', id)
      .single();

    if (existing && !isAdmin(user!) && user?.businessId !== existing.business_id) {
      return NextResponse.json({ error: 'Možete obrisati samo svoje recenzije' }, { status: 403 });
    }

    // Delete review
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Review deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
