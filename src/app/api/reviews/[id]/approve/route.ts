/**
 * Approve Review API Route
 * 
 * POST /api/reviews/[id]/approve - Admin odobrava recenziju
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Review } from '@/types/review';

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

    if (existingReview.status === 'approved') {
      return NextResponse.json(
        { error: 'Review is already approved' },
        { status: 400 }
      );
    }

    // Update review status
    const updatedReview: Review = {
      ...existingReview,
      status: 'approved',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    reviewsStore[reviewIndex] = updatedReview;

    // FUTURE: Send notification to business that their review was approved
    // await sendNotification(existingReview.businessId, 'review_approved', { reviewId: id });

    return NextResponse.json({
      review: updatedReview,
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


