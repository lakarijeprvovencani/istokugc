import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/creators - Dohvati kreatore
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('includeAll') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();

    // Jednostavan query - bez kompleksnih filtera
    let query = supabase
      .from('creators')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter po statusu - ako nije admin, samo approved
    if (!includeAll) {
      query = query.eq('status', 'approved');
    }

    // Paginacija
    query = query.range(offset, offset + limit - 1);

    const { data: creators, error, count: totalCount } = await query;

    if (error) {
      console.error('Error fetching creators:', error);
      return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
    }

    // Transformiši podatke
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

    const response = NextResponse.json({ 
      creators: formattedCreators,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages,
        hasMore: page < totalPages,
      }
    });
    
    // Short cache for public creator list (10 seconds)
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    
    return response;

  } catch (error: any) {
    console.error('Creators fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
