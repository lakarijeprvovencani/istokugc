import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-helper';

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

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ reviews: [] });
    }

    // OPTIMIZED: Fetch all businesses and creators in bulk (2 queries instead of N*2)
    const businessIds = [...new Set((reviews || []).map(r => r.business_id).filter(Boolean))];
    const creatorIds = [...new Set((reviews || []).map(r => r.creator_id).filter(Boolean))];

    const [businessesResult, creatorsResult] = await Promise.all([
      businessIds.length > 0 
        ? supabase.from('businesses').select('id, company_name').in('id', businessIds)
        : { data: [] },
      creatorIds.length > 0
        ? supabase.from('creators').select('id, name, photo').in('id', creatorIds)
        : { data: [] }
    ]);

    // Create lookup maps
    const businessMap = new Map(
      (businessesResult.data || []).map(b => [b.id, { id: b.id, name: b.company_name }])
    );
    const creatorMap = new Map(
      (creatorsResult.data || []).map(c => [c.id, { id: c.id, name: c.name, photo: c.photo }])
    );

    // Format reviews using lookup maps
    const formattedReviews = (reviews || []).map(review => {
      const businessData = businessMap.get(review.business_id);
      const creatorData = creatorMap.get(review.creator_id);

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
        businessName: businessData?.name || 'Anonimni biznis',
        business: businessData || null,
        creator: creatorData || null,
        creatorReply: review.reply || null,
        creatorReplyAt: review.reply_date || null,
      };
    });

    const response = NextResponse.json({ reviews: formattedReviews });
    
    // Cache public reviews (for creator profiles) for 2 minutes
    if (creatorId && !businessId) {
      response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    }
    
    return response;

  } catch (error: any) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Kreiraj novu recenziju
// ZAŠTIĆENO: Samo biznisi mogu kreirati recenzije za kreatore
export async function POST(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const { businessId, creatorId, rating, comment } = await request.json();

    console.log('Creating review:', { businessId, creatorId, rating, comment });

    if (!businessId || !creatorId || !rating) {
      console.log('Missing required fields:', { businessId, creatorId, rating });
      return NextResponse.json({ error: 'Business ID, Creator ID, and rating are required' }, { status: 400 });
    }
    
    // 🔒 BEZBEDNOSNA PROVERA: Biznis može kreirati recenziju samo u svoje ime
    if (user?.businessId !== businessId) {
      return NextResponse.json({ error: 'Nemate dozvolu da kreirate recenziju u ime drugog biznisa' }, { status: 403 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 🔒 Proveri da li ovaj biznis već ima recenziju za ovog kreatora
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id, status')
      .eq('business_id', businessId)
      .eq('creator_id', creatorId)
      .single();

    if (existingReview) {
      return NextResponse.json({ 
        error: 'Već ste ostavili recenziju za ovog kreatora',
        existingReviewId: existingReview.id 
      }, { status: 409 }); // 409 Conflict
    }

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
// ZAŠTIĆENO: Samo vlasnik recenzije ili admin može menjati
export async function PUT(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const { reviewId, rating, comment, status, rejectionReason } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // 🔒 BEZBEDNOSNA PROVERA: Proveri vlasništvo
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('business_id')
      .eq('id', reviewId)
      .single();
    
    if (!existingReview) {
      return NextResponse.json({ error: 'Recenzija nije pronađena' }, { status: 404 });
    }
    
    // Samo vlasnik ili admin može menjati
    const isOwner = user?.businessId === existingReview.business_id;
    const isAdmin = user?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Nemate dozvolu za izmenu ove recenzije' }, { status: 403 });
    }
    
    // Samo admin može menjati status (odobrenje/odbijanje)
    if (status !== undefined && !isAdmin) {
      return NextResponse.json({ error: 'Samo admin može menjati status recenzije' }, { status: 403 });
    }

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
// ZAŠTIĆENO: Samo vlasnik recenzije ili admin može obrisati
export async function DELETE(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // 🔒 BEZBEDNOSNA PROVERA: Proveri vlasništvo
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('business_id')
      .eq('id', reviewId)
      .single();
    
    if (!existingReview) {
      return NextResponse.json({ error: 'Recenzija nije pronađena' }, { status: 404 });
    }
    
    // Samo vlasnik ili admin može obrisati
    if (user?.businessId !== existingReview.business_id && user?.role !== 'admin') {
      return NextResponse.json({ error: 'Nemate dozvolu za brisanje ove recenzije' }, { status: 403 });
    }

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
