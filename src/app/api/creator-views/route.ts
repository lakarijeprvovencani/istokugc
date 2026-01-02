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
          display_name,
          profile_image_url,
          city,
          categories,
          niches
        )
      `)
      .eq('business_id', businessId)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching creator views:', error);
      return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
    }

    // Transformiši podatke
    const recentCreators = views?.map(view => ({
      id: view.creators?.id,
      name: view.creators?.display_name,
      profileImage: view.creators?.profile_image_url,
      city: view.creators?.city,
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
      console.error('Error recording view:', error);
      return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Record view error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

