import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser, isAdmin } from '@/lib/auth-helper';

async function requireAdmin() {
  const { user, error } = await getAuthUser();
  if (error) return { user: null, error };
  if (!user || !isAdmin(user)) {
    return { user: null, error: NextResponse.json({ error: 'Samo admin ima pristup' }, { status: 403 }) };
  }
  return { user, error: null };
}

// GET /api/admin/creators - Dohvati kreatore za admin panel
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAdmin();
    if (authError) return authError;

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

    // Get email verification status for each creator from auth.users
    const userIds = creators?.map(c => c.user_id).filter(Boolean) || [];
    const emailVerificationMap: Record<string, boolean> = {};
    
    if (userIds.length > 0) {
      // Fetch auth users to check email_confirmed_at
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      if (authUsers?.users) {
        for (const user of authUsers.users) {
          if (userIds.includes(user.id)) {
            emailVerificationMap[user.id] = user.email_confirmed_at !== null;
          }
        }
      }
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
      emailVerified: creator.user_id ? emailVerificationMap[creator.user_id] ?? false : false,
    })) || [];

    return NextResponse.json({ creators: formattedCreators });

  } catch (error: any) {
    console.error('Admin creators fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/creators - Ažuriraj kreatora (status ili profile)
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { creatorId, action, rejectionReason, ...profileUpdates } = body;

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    let updateData: any = {};

    // Ako ima action, to je status update
    if (action) {
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
    } else {
      // Profile update - mapiranje polja
      if (profileUpdates.name !== undefined) updateData.name = profileUpdates.name;
      if (profileUpdates.bio !== undefined) updateData.bio = profileUpdates.bio;
      if (profileUpdates.location !== undefined) updateData.location = profileUpdates.location;
      if (profileUpdates.phone !== undefined) updateData.phone = profileUpdates.phone;
      if (profileUpdates.email !== undefined) updateData.email = profileUpdates.email;
      if (profileUpdates.instagram !== undefined) updateData.instagram = profileUpdates.instagram;
      if (profileUpdates.tiktok !== undefined) updateData.tiktok = profileUpdates.tiktok;
      if (profileUpdates.youtube !== undefined) updateData.youtube = profileUpdates.youtube;
      if (profileUpdates.price_from !== undefined) updateData.price_from = profileUpdates.price_from;
      if (profileUpdates.priceFrom !== undefined) updateData.price_from = profileUpdates.priceFrom;
      if (profileUpdates.categories !== undefined) updateData.categories = profileUpdates.categories;
      if (profileUpdates.platforms !== undefined) updateData.platforms = profileUpdates.platforms;
      if (profileUpdates.languages !== undefined) updateData.languages = profileUpdates.languages;
      if (profileUpdates.portfolio !== undefined) updateData.portfolio = profileUpdates.portfolio;
      if (profileUpdates.photo !== undefined) updateData.photo = profileUpdates.photo;
      if (profileUpdates.status !== undefined) updateData.status = profileUpdates.status;
      
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('creators')
      .update(updateData)
      .eq('id', creatorId)
      .select()
      .single();

    if (error) {
      console.error('Error updating creator:', error);
      return NextResponse.json({ error: 'Failed to update creator', details: error.message }, { status: 500 });
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
    const { user, error: authError } = await requireAdmin();
    if (authError) return authError;

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

