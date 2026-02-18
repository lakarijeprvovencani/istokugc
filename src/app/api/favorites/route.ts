import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-helper';

// GET /api/favorites - Get all favorites for business
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    if (user?.role !== 'admin' && user?.businessId !== businessId) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Step 1: Fetch favorites
    const { data: favorites, error: favError } = await supabase
      .from('saved_creators')
      .select('id, saved_at, creator_id')
      .eq('business_id', businessId)
      .order('saved_at', { ascending: false });

    if (favError) {
      console.error('Error fetching favorites:', favError);
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }

    if (!favorites || favorites.length === 0) {
      return NextResponse.json({ success: true, favorites: [] });
    }

    // Step 2: Get unique creator IDs
    const creatorIds = [...new Set(favorites.map(f => f.creator_id).filter(Boolean))];

    if (creatorIds.length === 0) {
      return NextResponse.json({ success: true, favorites: [] });
    }

    // Step 3: Fetch creators data
    const { data: creators, error: creatorsError } = await supabase
      .from('creators')
      .select('id, name, photo, location, categories, price_from')
      .in('id', creatorIds);

    if (creatorsError) {
      console.error('Error fetching creators:', creatorsError);
      return NextResponse.json({ success: true, favorites: [] });
    }

    // Step 4: Create lookup map
    const creatorMap = new Map(
      (creators || []).map(c => [c.id, c])
    );

    // Step 5: Combine favorites with creator data
    const formattedFavorites = favorites
      .map((fav) => {
        const creator = creatorMap.get(fav.creator_id);
        if (!creator) return null;
        return {
          id: creator.id,
          name: creator.name,
          photo: creator.photo,
          location: creator.location,
          categories: creator.categories || [],
          priceFrom: creator.price_from,
          savedAt: fav.saved_at,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      favorites: formattedFavorites,
    });

  } catch (error) {
    console.error('Favorites fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/favorites - Add creator to favorites
// ZAŠTIĆENO: Samo ulogovani biznisi mogu dodavati favorite
export async function POST(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const body = await request.json();
    const { businessId, creatorId } = body;

    if (!businessId || !creatorId) {
      return NextResponse.json(
        { error: 'Business ID and Creator ID are required' },
        { status: 400 }
      );
    }
    
    // 🔒 BEZBEDNOSNA PROVERA: Biznis može dodavati samo svoje favorite
    if (user?.businessId !== businessId) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_creators')
      .select('id')
      .eq('business_id', businessId)
      .eq('creator_id', creatorId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already in favorites' }, { status: 400 });
    }

    // Add to favorites
    const { error } = await supabase
      .from('saved_creators')
      .insert({
        business_id: businessId,
        creator_id: creatorId,
      });

    if (error) {
      console.error('Error adding favorite:', error);
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kreator sačuvan',
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

// DELETE /api/favorites - Remove creator from favorites
// ZAŠTIĆENO: Samo ulogovani biznisi mogu uklanjati favorite
export async function DELETE(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const creatorId = searchParams.get('creatorId');

    if (!businessId || !creatorId) {
      return NextResponse.json(
        { error: 'Business ID and Creator ID are required' },
        { status: 400 }
      );
    }
    
    // 🔒 BEZBEDNOSNA PROVERA: Biznis može uklanjati samo svoje favorite
    if (user?.businessId !== businessId) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('saved_creators')
      .delete()
      .eq('business_id', businessId)
      .eq('creator_id', creatorId);

    if (error) {
      console.error('Error removing favorite:', error);
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kreator uklonjen iz sačuvanih',
    });

  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
