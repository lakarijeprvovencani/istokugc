/**
 * API Route: /api/businesses
 * 
 * Endpoints:
 * - GET /api/businesses - Lista svih biznisa (admin only)
 * - POST /api/businesses - Registracija novog biznisa
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser, isAdmin } from '@/lib/auth-helper';

// GET - Lista biznisa (admin only)
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    if (!isAdmin(user!)) {
      return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const status = searchParams.get('status'); // 'active' | 'expired' | 'none'
    
    const supabase = createAdminClient();
    
    // Build query
    let query = supabase
      .from('businesses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // Filter by subscription status
    if (status) {
      query = query.eq('subscription_status', status);
    }
    
    // Pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);
    
    const { data: businesses, error, count } = await query;
    
    if (error) {
      console.error('Error fetching businesses:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch businesses' },
        { status: 500 }
      );
    }
    
    // Transform data to expected format
    const formattedBusinesses = businesses?.map(b => ({
      id: b.id,
      companyName: b.company_name,
      email: b.email,
      phone: b.phone,
      description: b.description,
      website: b.website,
      industry: b.industry,
      subscriptionType: b.subscription_type,
      subscriptionStatus: b.subscription_status,
      stripeCustomerId: b.stripe_customer_id,
      subscribedAt: b.subscribed_at,
      expiresAt: b.expires_at,
      createdAt: b.created_at,
    })) || [];
    
    return NextResponse.json({
      success: true,
      data: {
        data: formattedBusinesses,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
    
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}

// POST - Kreiranje biznisa (admin only, registracija koristi /api/auth/register/business)
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    if (!isAdmin(user!)) {
      return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validacija
    if (!body.companyName || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Company name and email are required' },
        { status: 400 }
      );
    }
    
    const supabase = createAdminClient();
    
    // Provera da li već postoji biznis sa tim emailom
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('email', body.email)
      .single();
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Business with this email already exists' },
        { status: 409 }
      );
    }
    
    // Kreiranje biznisa
    const { data: newBusiness, error } = await supabase
      .from('businesses')
      .insert({
        company_name: body.companyName,
        email: body.email,
        phone: body.phone || null,
        description: body.description || null,
        website: body.website || null,
        industry: body.industry || null,
        subscription_status: 'none',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating business:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create business' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: newBusiness.id,
        companyName: newBusiness.company_name,
        email: newBusiness.email,
        subscriptionStatus: newBusiness.subscription_status,
      },
      message: 'Business registered successfully',
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create business' },
      { status: 500 }
    );
  }
}
