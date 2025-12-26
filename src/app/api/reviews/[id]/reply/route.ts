/**
 * Reply to Review API Route
 * 
 * POST /api/reviews/[id]/reply - Kreator odgovara na recenziju
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Review, ReplyToReviewInput } from '@/types/review';
import { MAX_REPLY_LENGTH, isValidReply } from '@/types/review';

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
    const body: ReplyToReviewInput = await request.json();

    // DEMO: In production, verify creator owns the reviewed profile
    // const session = await getServerSession(authOptions);
    // const review = await prisma.review.findUnique({ where: { id } });
    // if (review.creatorId !== session.user.creatorId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // Validate reply
    if (!body.reply || !isValidReply(body.reply)) {
      return NextResponse.json(
        { error: `Reply must be between 1 and ${MAX_REPLY_LENGTH} characters` },
        { status: 400 }
      );
    }

    const reviewIndex = reviewsStore.findIndex(r => r.id === id);
    
    if (reviewIndex === -1) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const existingReview = reviewsStore[reviewIndex];

    // Only allow replying to approved reviews
    if (existingReview.status !== 'approved') {
      return NextResponse.json(
        { error: 'Can only reply to approved reviews' },
        { status: 400 }
      );
    }

    // Check if already replied
    if (existingReview.creatorReply) {
      return NextResponse.json(
        { error: 'You have already replied to this review' },
        { status: 400 }
      );
    }

    // Add reply
    const updatedReview: Review = {
      ...existingReview,
      creatorReply: body.reply.trim(),
      creatorReplyAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    reviewsStore[reviewIndex] = updatedReview;

    // FUTURE: Send notification to business that creator replied
    // await sendNotification(existingReview.businessId, 'creator_replied', { reviewId: id });

    return NextResponse.json({
      review: updatedReview,
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


