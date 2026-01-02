import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/creators/[id] - Dohvati pojedinačnog kreatora
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createAdminClient();

    const { data: creator, error } = await supabase
      .from('creators')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !creator) {
      console.error('Error fetching creator:', error);
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Transformiši podatke u format koji frontend očekuje
    const formattedCreator = {
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
      approved: creator.status === 'approved',
      // Kontakt info
      email: creator.email,
      phone: creator.phone,
      instagram: creator.instagram,
      tiktok: creator.tiktok,
      youtube: creator.youtube,
      website: creator.website,
      // Dodatna polja
      niches: creator.niches || [],
      portfolio: creator.portfolio || [],
      createdAt: creator.created_at,
      userId: creator.user_id,
    };

    return NextResponse.json({ creator: formattedCreator });

  } catch (error: any) {
    console.error('Creator fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/creators/[id] - Ažuriraj kreatora
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const supabase = createAdminClient();

    // Mapiranje frontend polja na database polja
    const updateData: any = {};
    
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.categories !== undefined) updateData.categories = body.categories;
    if (body.platforms !== undefined) updateData.platforms = body.platforms;
    if (body.languages !== undefined) updateData.languages = body.languages;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.instagram !== undefined) updateData.instagram = body.instagram;
    if (body.tiktok !== undefined) updateData.tiktok = body.tiktok;
    if (body.youtube !== undefined) updateData.youtube = body.youtube;
    if (body.price_from !== undefined) updateData.price_from = body.price_from;
    if (body.photo !== undefined) updateData.photo = body.photo;
    if (body.portfolio !== undefined) updateData.portfolio = body.portfolio;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.status !== undefined) updateData.status = body.status;

    const { data: creator, error } = await supabase
      .from('creators')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating creator:', error);
      return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 });
    }

    return NextResponse.json({ success: true, creator });

  } catch (error: any) {
    console.error('Creator update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
