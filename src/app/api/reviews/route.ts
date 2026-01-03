import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - Dohvati recenzije
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const creatorId = searchParams.get('creatorId');
    const status = searchParams.get('status');

    const supabase = createAdminClient();

    // Prvo dohvati recenzije
    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtriraj po businessId
    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    // Filtriraj po creatorId
    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    // Filtriraj po statusu
    if (status) {
      query = query.eq('status', status);
    }

    const { data: reviews, error } = await query;

    console.log('Reviews fetched:', { count: reviews?.length, error: error?.message });

    if (error) {
      console.error('Error fetching reviews:', error);
      // Return empty array instead of error
      return NextResponse.json({ reviews: [] });
    }

    // Dohvati business i creator podatke odvojeno
    const formattedReviews = await Promise.all((reviews || []).map(async (review) => {
      // Dohvati business
      let businessName = 'Anonimni biznis';
      let businessData = null;
      if (review.business_id) {
        const { data: business } = await supabase
          .from('businesses')
          .select('id, company_name')
          .eq('id', review.business_id)
          .single();
        if (business) {
          businessName = business.company_name;
          businessData = { id: business.id, name: business.company_name };
        }
      }

      // Dohvati creator
      let creatorData = null;
      if (review.creator_id) {
        const { data: creator } = await supabase
          .from('creators')
          .select('id, name, photo')
          .eq('id', review.creator_id)
          .single();
        if (creator) {
          creatorData = { id: creator.id, name: creator.name, photo: creator.photo };
        }
      }

      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        rejectionReason: review.rejection_reason || null,
        createdAt: review.created_at,
        date: review.created_at,
        updatedAt: review.updated_at,
        businessId: review.business_id,
        creatorId: review.creator_id,
        businessName,
        business: businessData,
        creator: creatorData,
        reply: review.reply || null,
        replyDate: review.reply_date || null,
      };
    }));

    return NextResponse.json({ reviews: formattedReviews });

  } catch (error: any) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Kreiraj novu recenziju
export async function POST(request: NextRequest) {
  try {
    const { businessId, creatorId, rating, comment } = await request.json();

    console.log('Creating review:', { businessId, creatorId, rating, comment });

    if (!businessId || !creatorId || !rating) {
      console.log('Missing required fields:', { businessId, creatorId, rating });
      return NextResponse.json({ error: 'Business ID, Creator ID, and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        business_id: businessId,
        creator_id: creatorId,
        rating,
        comment: comment || null,
        status: 'pending', // Recenzije idu na odobrenje
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    return NextResponse.json({ review, message: 'Recenzija je poslata na odobrenje' });

  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Ažuriraj recenziju
export async function PUT(request: NextRequest) {
  try {
    const { reviewId, rating, comment, status, rejectionReason } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const updateData: any = { updated_at: new Date().toISOString() };
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;
    if (status !== undefined) updateData.status = status;
    if (status === 'rejected') {
      updateData.rejection_reason = rejectionReason || null;
    } else if (status === 'approved') {
      updateData.rejection_reason = null; // Očisti razlog ako se odobri
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Error updating review:', error);
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    return NextResponse.json({ review });

  } catch (error: any) {
    console.error('Update review error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Obriši recenziju
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
