import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/admin/creators - Dohvati kreatore za admin panel
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected', 'deactivated', or null for all

    const supabase = createAdminClient();

    let query = supabase
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: creators, error } = await query;

    if (error) {
      console.error('Error fetching creators:', error);
      return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
    }

    // Transform data for frontend
    const formattedCreators = creators?.map(creator => ({
      id: creator.id,
      userId: creator.user_id,
      name: creator.name,
      email: creator.email,
      phone: creator.phone,
      photo: creator.photo,
      location: creator.location,
      bio: creator.bio,
      priceFrom: creator.price_from,
      categories: creator.categories || [],
      platforms: creator.platforms || [],
      languages: creator.languages || [],
      instagram: creator.instagram,
      tiktok: creator.tiktok,
      youtube: creator.youtube,
      portfolio: creator.portfolio || [],
      status: creator.status,
      rejectionReason: creator.rejection_reason,
      profileViews: creator.profile_views || 0,
      averageRating: creator.average_rating || 0,
      totalReviews: creator.total_reviews || 0,
      createdAt: creator.created_at,
    })) || [];

    return NextResponse.json({ creators: formattedCreators });

  } catch (error: any) {
    console.error('Admin creators fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/creators - Ažuriraj status kreatora (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const { creatorId, action, rejectionReason } = await request.json();

    if (!creatorId || !action) {
      return NextResponse.json({ error: 'Creator ID and action are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    let updateData: any = {};

    if (action === 'approve') {
      updateData = { status: 'approved', rejection_reason: null };
    } else if (action === 'reject') {
      updateData = { status: 'rejected', rejection_reason: rejectionReason || null };
    } else if (action === 'deactivate') {
      updateData = { status: 'deactivated' };
    } else if (action === 'reactivate') {
      updateData = { status: 'approved' };
    } else if (action === 'set_pending') {
      updateData = { status: 'pending', rejection_reason: null };
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('creators')
      .update(updateData)
      .eq('id', creatorId)
      .select()
      .single();

    if (error) {
      console.error('Error updating creator:', error);
      return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 });
    }

    return NextResponse.json({ success: true, creator: data });

  } catch (error: any) {
    console.error('Admin creator update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/creators - Obriši kreatora
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get creator to find user_id
    const { data: creator, error: fetchError } = await supabase
      .from('creators')
      .select('user_id')
      .eq('id', creatorId)
      .single();

    if (fetchError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Delete creator record
    const { error: deleteCreatorError } = await supabase
      .from('creators')
      .delete()
      .eq('id', creatorId);

    if (deleteCreatorError) {
      console.error('Error deleting creator:', deleteCreatorError);
      return NextResponse.json({ error: 'Failed to delete creator' }, { status: 500 });
    }

    // Delete user record
    if (creator.user_id) {
      await supabase
        .from('users')
        .delete()
        .eq('id', creator.user_id);

      // Delete from Supabase Auth
      await supabase.auth.admin.deleteUser(creator.user_id);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Admin creator delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

