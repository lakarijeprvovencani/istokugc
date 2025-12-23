/**
 * Single Review API Route
 * 
 * GET /api/reviews/[id] - Dohvati pojedinačnu recenziju
 * PUT /api/reviews/[id] - Ažuriraj recenziju (biznis - svoju, admin - sve)
 * DELETE /api/reviews/[id] - Obriši recenziju (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Review, UpdateReviewInput } from '@/types/review';
import { MIN_COMMENT_LENGTH, MAX_COMMENT_LENGTH } from '@/types/review';

// Mock data - u produkciji ovo dolazi iz baze
import { mockReviews } from '@/lib/mockData';

// In-memory storage za demo
let reviewsStore: Review[] = [...mockReviews];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const review = reviewsStore.find(r => r.id === id);
    
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ review });

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
    const { id } = await params;
    const body: UpdateReviewInput = await request.json();

    const reviewIndex = reviewsStore.findIndex(r => r.id === id);
    
    if (reviewIndex === -1) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // DEMO: In production, check if user owns this review or is admin
    // const session = await getServerSession(authOptions);
    // if (review.businessId !== session.user.businessId && session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

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

    // Update review
    const existingReview = reviewsStore[reviewIndex];
    const updatedReview: Review = {
      ...existingReview,
      ...(body.rating && { rating: body.rating }),
      ...(body.comment && { comment: body.comment.trim() }),
      status: 'pending', // Reset to pending if content changes
      updatedAt: new Date().toISOString().split('T')[0],
    };

    reviewsStore[reviewIndex] = updatedReview;

    return NextResponse.json({
      review: updatedReview,
      message: 'Review updated. It will need to be re-approved by admin.',
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
    const { id } = await params;

    // DEMO: In production, check if user is admin
    // const session = await getServerSession(authOptions);
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const reviewIndex = reviewsStore.findIndex(r => r.id === id);
    
    if (reviewIndex === -1) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Remove review
    reviewsStore.splice(reviewIndex, 1);

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

