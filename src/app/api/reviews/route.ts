/**
 * Reviews API Route
 * 
 * DEMO MODE: Koristi mock podatke
 * PRODUCTION: Koristi Prisma/Supabase
 * 
 * GET /api/reviews - Lista recenzija (filter po creatorId, status)
 * POST /api/reviews - Biznis kreira recenziju
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Review, ReviewFilters, ReviewsResponse, CreateReviewInput } from '@/types/review';
import { generateReviewStats, MIN_COMMENT_LENGTH, MAX_COMMENT_LENGTH } from '@/types/review';

// Mock data - u produkciji ovo dolazi iz baze
import { mockReviews } from '@/lib/mockData';

// In-memory storage za demo (u produkciji je Prisma/Supabase)
let reviewsStore: Review[] = [...mockReviews];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: ReviewFilters = {
      creatorId: searchParams.get('creatorId') || undefined,
      businessId: searchParams.get('businessId') || undefined,
      status: (searchParams.get('status') as ReviewFilters['status']) || undefined,
      minRating: searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) as 1|2|3|4|5 : undefined,
      maxRating: searchParams.get('maxRating') ? parseInt(searchParams.get('maxRating')!) as 1|2|3|4|5 : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 10,
    };

    // Filter reviews
    let filteredReviews = reviewsStore;

    if (filters.creatorId) {
      filteredReviews = filteredReviews.filter(r => r.creatorId === filters.creatorId);
    }
    
    if (filters.businessId) {
      filteredReviews = filteredReviews.filter(r => r.businessId === filters.businessId);
    }
    
    if (filters.status) {
      filteredReviews = filteredReviews.filter(r => r.status === filters.status);
    }
    
    if (filters.minRating) {
      filteredReviews = filteredReviews.filter(r => r.rating >= filters.minRating!);
    }
    
    if (filters.maxRating) {
      filteredReviews = filteredReviews.filter(r => r.rating <= filters.maxRating!);
    }

    // Sort by newest first
    filteredReviews.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const paginatedReviews = filteredReviews.slice(startIndex, startIndex + pageSize);

    // Generate stats (only for approved reviews)
    const stats = generateReviewStats(filteredReviews);

    const response: ReviewsResponse = {
      reviews: paginatedReviews,
      stats,
      totalCount: filteredReviews.length,
      page,
      pageSize,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateReviewInput = await request.json();

    // Validate required fields
    if (!body.creatorId || !body.rating || !body.comment) {
      return NextResponse.json(
        { error: 'Missing required fields: creatorId, rating, comment' },
        { status: 400 }
      );
    }

    // Validate rating
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate comment length
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

    // DEMO: Get business info from mock
    // PRODUCTION: Get from auth session
    const businessId = 'b1'; // Demo business ID
    const businessName = 'TechStart d.o.o.'; // Demo business name

    // Check if business has already reviewed this creator
    const existingReview = reviewsStore.find(
      r => r.businessId === businessId && r.creatorId === body.creatorId
    );
    
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this creator. You can edit your existing review.' },
        { status: 409 }
      );
    }

    // Create new review
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      creatorId: body.creatorId,
      businessId,
      businessName,
      rating: body.rating,
      comment: trimmedComment,
      status: 'pending', // All new reviews require admin approval
      createdAt: new Date().toISOString().split('T')[0],
    };

    // DEMO: Add to in-memory store
    // PRODUCTION: Insert into database via Prisma
    reviewsStore.push(newReview);

    return NextResponse.json(
      { 
        review: newReview,
        message: 'Review submitted successfully. It will be visible after admin approval.' 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

// Export for use in other routes
export { reviewsStore };

