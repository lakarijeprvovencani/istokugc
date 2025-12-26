/**
 * Reject Review API Route
 * 
 * POST /api/reviews/[id]/reject - Admin odbija recenziju
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Review, RejectReviewInput } from '@/types/review';

// Mock data - u produkciji ovo dolazi iz baze
import { mockReviews } from '@/lib/mockData';

// In-memory storage za demo
let reviewsStore: Review[] = [...mockReviews];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: RejectReviewInput = await request.json().catch(() => ({}));

    // DEMO: In production, verify admin role
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

    const existingReview = reviewsStore[reviewIndex];

    if (existingReview.status === 'rejected') {
      return NextResponse.json(
        { error: 'Review is already rejected' },
        { status: 400 }
      );
    }

    // Update review status
    const updatedReview: Review = {
      ...existingReview,
      status: 'rejected',
      rejectionReason: body.reason || undefined,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    reviewsStore[reviewIndex] = updatedReview;

    // FUTURE: Send notification to business that their review was rejected
    // await sendNotification(existingReview.businessId, 'review_rejected', { 
    //   reviewId: id, 
    //   reason: body.reason 
    // });

    return NextResponse.json({
      review: updatedReview,
      message: 'Review rejected',
    });

  } catch (error) {
    console.error('Error rejecting review:', error);
    return NextResponse.json(
      { error: 'Failed to reject review' },
      { status: 500 }
    );
  }
}


