import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/creators - Dohvati kreatore sa paginacijom
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('includeAll') === 'true'; // Za admin
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12'); // 12 kreatora po stranici
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();

    // Prvo dohvati ukupan broj za paginaciju
    let countQuery = supabase
      .from('creators')
      .select('*', { count: 'exact', head: true });
    
    if (!includeAll) {
      countQuery = countQuery.eq('status', 'approved');
    }
    
    const { count: totalCount } = await countQuery;

    // Dohvati kreatore sa paginacijom
    let query = supabase
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Ako nije admin, prikaži samo odobrene
    if (!includeAll) {
      query = query.eq('status', 'approved');
    }

    const { data: creators, error } = await query;

    if (error) {
      console.error('Error fetching creators:', error);
      return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
    }

    // Transformiši podatke u format koji frontend očekuje
    const formattedCreators = creators?.map(creator => ({
      id: creator.id,
      name: creator.name,
      photo: creator.photo || null,
      categories: creator.categories || [],
      platforms: creator.platforms || [],
      languages: creator.languages || ['Srpski'],
      location: creator.location || 'Srbija',
      bio: creator.bio || '',
      priceFrom: creator.price_from || 0,
      rating: creator.average_rating || 0,
      totalReviews: creator.total_reviews || 0,
      profileViews: creator.profile_views || 0,
      status: creator.status,
      // Dodatna polja
      email: creator.email,
      phone: creator.phone,
      instagram: creator.instagram,
      tiktok: creator.tiktok,
      youtube: creator.youtube,
      website: creator.website,
      niches: creator.niches || [],
      portfolio: creator.portfolio || [],
      createdAt: creator.created_at,
    })) || [];

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({ 
      creators: formattedCreators,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages,
        hasMore: page < totalPages,
      }
    });

  } catch (error: any) {
    console.error('Creators fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
