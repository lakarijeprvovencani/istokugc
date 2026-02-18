import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-helper';

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

    // Prebroj unikatne preglede iz creator_views tabele
    const { count: viewCount } = await supabase
      .from('creator_views')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', id);

    // Proveri da li je korisnik ulogovan (za kontakt info)
    const supabaseAuth = await (await import('@/lib/supabase/server')).createClient();
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
    let userRole: string | null = null;
    let userCreatorId: string | null = null;
    if (authUser) {
      const { data: ud } = await supabaseAuth.from('users').select('role').eq('id', authUser.id).single();
      userRole = ud?.role || null;
      if (userRole === 'creator') {
        const { data: cd } = await supabaseAuth.from('creators').select('id').eq('user_id', authUser.id).single();
        userCreatorId = cd?.id || null;
      }
    }

    const isOwner = userCreatorId === id;
    const canSeeContact = userRole === 'admin' || userRole === 'business' || isOwner;

    const formattedCreator: Record<string, unknown> = {
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
      profileViews: viewCount || creator.profile_views || 0,
      status: creator.status,
      approved: creator.status === 'approved',
      rejectionReason: creator.rejection_reason || null,
      instagram: creator.instagram,
      tiktok: creator.tiktok,
      youtube: creator.youtube,
      website: creator.website,
      niches: creator.niches || [],
      portfolio: creator.portfolio || [],
      createdAt: creator.created_at,
      userId: creator.user_id,
    };

    // Kontakt info samo za ulogovane korisnike sa pravom pristupa
    if (canSeeContact) {
      formattedCreator.email = creator.email;
      formattedCreator.phone = creator.phone;
    }

    // Short cache for creator profile (10 seconds)
    const response = NextResponse.json({ creator: formattedCreator });
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    
    return response;

  } catch (error: any) {
    console.error('Creator fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/creators/[id] - Ažuriraj kreatora
// ZAŠTIĆENO: Kreator može menjati samo svoj profil, admin može sve
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const { id } = await params;
    const body = await request.json();
    
    const isOwner = user?.creatorId === id;
    const isAdminUser = user?.role === 'admin';
    
    if (!isOwner && !isAdminUser) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za izmenu ovog profila' },
        { status: 403 }
      );
    }
    
    if (body.status !== undefined && !isAdminUser) {
      return NextResponse.json(
        { error: 'Samo admin može menjati status kreatora' },
        { status: 403 }
      );
    }

    const { validate, creatorUpdateSchema } = await import('@/lib/validations');
    const { data: validated, error: validationError } = validate(creatorUpdateSchema, body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = createAdminClient();

    const updateData: any = {};
    
    if (validated!.bio !== undefined) updateData.bio = validated!.bio;
    if (validated!.categories !== undefined) updateData.categories = validated!.categories;
    if (validated!.platforms !== undefined) updateData.platforms = validated!.platforms;
    if (validated!.languages !== undefined) updateData.languages = validated!.languages;
    if (validated!.email !== undefined) updateData.email = validated!.email;
    if (validated!.phone !== undefined) updateData.phone = validated!.phone;
    if (validated!.instagram !== undefined) updateData.instagram = validated!.instagram;
    if (validated!.tiktok !== undefined) updateData.tiktok = validated!.tiktok;
    if (validated!.youtube !== undefined) updateData.youtube = validated!.youtube;
    if (validated!.price_from !== undefined) updateData.price_from = validated!.price_from;
    if (validated!.photo !== undefined) updateData.photo = validated!.photo;
    if (validated!.portfolio !== undefined) updateData.portfolio = validated!.portfolio;
    if (validated!.name !== undefined) updateData.name = validated!.name;
    if (validated!.location !== undefined) updateData.location = validated!.location;
    if (validated!.status !== undefined) updateData.status = validated!.status;

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
