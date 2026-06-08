import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getOptionalAuthUser } from '@/lib/auth-helper';

// GET /api/creators - Dohvati kreatore
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // includeAll (pending/rejected/deactivated kreatori) je dozvoljen SAMO adminu.
    // Za sve ostale ignorišemo flag i vraćamo samo approved.
    const requestedIncludeAll = searchParams.get('includeAll') === 'true';
    let includeAll = false;
    if (requestedIncludeAll) {
      const viewer = await getOptionalAuthUser();
      includeAll = viewer?.role === 'admin';
    }
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;
    const cityId = searchParams.get('cityId');
    const nearLat = searchParams.get('nearLat');
    const nearLng = searchParams.get('nearLng');
    const radiusKm = searchParams.get('radiusKm');

    const supabase = createAdminClient();

    const formatCreator = (creator: any) => ({
      id: creator.id,
      name: creator.name,
      photo: creator.photo || null,
      categories: creator.categories || [],
      platforms: creator.platforms || [],
      languages: creator.languages || ['Srpski'],
      location: creator.location || 'Srbija',
      cityId: creator.city_id ?? null,
      bio: creator.bio || '',
      priceFrom: creator.price_from || 0,
      profileViews: creator.profile_views || 0,
      status: creator.status,
      instagram: creator.instagram,
      tiktok: creator.tiktok,
      youtube: creator.youtube,
      createdAt: creator.created_at,
    });

    // NEARBY mod: kreatori u krugu od zadate tačke, sortirani po blizini (PostGIS RPC)
    if (nearLat && nearLng) {
      const { data, error } = await supabase.rpc('creators_nearby', {
        in_lat: parseFloat(nearLat),
        in_lng: parseFloat(nearLng),
        in_radius_km: radiusKm ? parseFloat(radiusKm) : 50,
      });
      if (error) {
        console.error('creators_nearby error:', error);
        return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
      }
      const formatted = (data || []).map(formatCreator);
      const response = NextResponse.json({
        creators: formatted,
        pagination: { page: 1, limit: formatted.length, total: formatted.length, totalPages: 1, hasMore: false },
      });
      response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
      return response;
    }

    let query = supabase
      .from('creators')
      .select('id, name, photo, categories, platforms, languages, location, city_id, bio, price_from, profile_views, status, instagram, tiktok, youtube, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter po statusu - ako nije admin, samo approved
    if (!includeAll) {
      query = query.eq('status', 'approved');
    }

    // Filter po gradu (tačan grad)
    if (cityId) {
      query = query.eq('city_id', Number(cityId));
    }

    // Paginacija
    query = query.range(offset, offset + limit - 1);

    const { data: creators, error, count: totalCount } = await query;

    if (error) {
      console.error('Error fetching creators:', error);
      return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
    }

    const formattedCreators = creators?.map(formatCreator) || [];

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
    return NextResponse.json({ error: 'Greška pri učitavanju kreatora' }, { status: 500 });
  }
}
