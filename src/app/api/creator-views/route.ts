import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-helper';

// GET - Dohvati nedavno pregledane kreatore za biznis
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    if (user?.role !== 'admin' && user?.businessId !== businessId) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }

    const supabase = createAdminClient();
    
    // Step 1: Fetch views
    const { data: views, error: viewsError } = await supabase
      .from('creator_views')
      .select('id, viewed_at, creator_id, business_id')
      .eq('business_id', businessId)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (viewsError) {
      console.error('Error fetching creator views:', viewsError);
      return NextResponse.json({ creators: [], error: viewsError.message });
    }

    if (!views || views.length === 0) {
      return NextResponse.json({ creators: [] });
    }

    // Step 2: Get unique creator IDs
    const creatorIds = [...new Set(views.map(v => v.creator_id).filter(Boolean))];
    
    if (creatorIds.length === 0) {
      return NextResponse.json({ creators: [] });
    }

    // Step 3: Fetch creators data
    const { data: creators, error: creatorsError } = await supabase
      .from('creators')
      .select('id, name, photo, location, categories')
      .in('id', creatorIds);

    if (creatorsError) {
      console.error('Error fetching creators:', creatorsError);
      return NextResponse.json({ creators: [] });
    }

    // Step 4: Create a map for quick lookup
    const creatorMap = new Map(
      (creators || []).map(c => [c.id, c])
    );

    // Step 5: Combine views with creator data
    const recentCreators = views
      .map((view) => {
        const creator = creatorMap.get(view.creator_id);
        if (!creator) return null;
        return {
          id: creator.id,
          name: creator.name,
          photo: creator.photo,
          location: creator.location,
          categories: creator.categories || [],
          viewedAt: view.viewed_at,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ creators: recentCreators });

  } catch (error: any) {
    console.error('Creator views error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Zabeleži pregled kreatora
// ZAŠTIĆENO: Samo ulogovani biznisi mogu beležiti preglede
export async function POST(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const { businessId, creatorId } = await request.json();

    if (!businessId || !creatorId) {
      return NextResponse.json({ error: 'Business ID and Creator ID are required' }, { status: 400 });
    }
    
    // 🔒 BEZBEDNOSNA PROVERA: Biznis može beležiti samo svoje preglede
    if (user?.businessId !== businessId) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Check if this is a new view (this business hasn't viewed this creator before)
    const { data: existingView } = await supabase
      .from('creator_views')
      .select('id')
      .eq('business_id', businessId)
      .eq('creator_id', creatorId)
      .single();
    
    const isNewView = !existingView;

    // Upsert - ako već postoji, ažuriraj viewed_at
    const { data: upsertData, error } = await supabase
      .from('creator_views')
      .upsert(
        {
          business_id: businessId,
          creator_id: creatorId,
          viewed_at: new Date().toISOString(),
        },
        {
          onConflict: 'business_id,creator_id',
        }
      )
      .select();

    if (error) {
      console.error('Error recording view:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Increment profile_views only for new unique views
    if (isNewView) {
      const { data: creator } = await supabase
        .from('creators')
        .select('profile_views')
        .eq('id', creatorId)
        .single();
      
      if (creator) {
        await supabase
          .from('creators')
          .update({ profile_views: (creator.profile_views || 0) + 1 })
          .eq('id', creatorId);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Record view error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

