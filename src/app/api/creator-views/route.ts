import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - Dohvati nedavno pregledane kreatore za biznis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Dohvati preglede sa podacima o kreatorima
    const { data: views, error } = await supabase
      .from('creator_views')
      .select(`
        id,
        viewed_at,
        creator_id,
        creators (
          id,
          name,
          photo,
          location,
          categories,
          niches
        )
      `)
      .eq('business_id', businessId)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) {
      // If table doesn't exist or other error, just return empty array
      console.error('Error fetching creator views:', error);
      return NextResponse.json({ creators: [] });
    }

    // Transformiši podatke
    const recentCreators = views?.map(view => ({
      id: view.creators?.id,
      name: view.creators?.name,
      photo: view.creators?.photo,
      location: view.creators?.location,
      categories: view.creators?.categories || [],
      niches: view.creators?.niches || [],
      viewedAt: view.viewed_at,
    })).filter(c => c.id) || [];

    return NextResponse.json({ creators: recentCreators });

  } catch (error: any) {
    console.error('Creator views error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Zabeleži pregled kreatora
export async function POST(request: NextRequest) {
  try {
    const { businessId, creatorId } = await request.json();

    if (!businessId || !creatorId) {
      return NextResponse.json({ error: 'Business ID and Creator ID are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Upsert - ako već postoji, ažuriraj viewed_at
    const { error } = await supabase
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
      );

    if (error) {
      // If table doesn't exist, silently ignore
      console.error('Error recording view:', error);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Record view error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

