/**
 * Business Profile API
 * 
 * GET - Dohvata profil biznisa
 * PUT - Ažurira profil biznisa (ZAŠTIĆENO)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/business/profile?businessId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (error || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(business);

  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business profile' },
      { status: 500 }
    );
  }
}

// PUT /api/business/profile
// ZAŠTIĆENO: Biznis može menjati samo svoj profil
export async function PUT(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const body = await request.json();

    const { validate, businessUpdateSchema } = await import('@/lib/validations');
    const { data: validated, error: validationError } = validate(businessUpdateSchema, body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { businessId, companyName, website, industry, description, phone, logo } = validated!;

    if (user?.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za izmenu ovog profila' },
        { status: 403 }
      );
    }

    const updateData: Record<string, any> = {};
    if (companyName !== undefined) updateData.company_name = companyName;
    if (website !== undefined) updateData.website = website;
    if (industry !== undefined) updateData.industry = industry;
    if (description !== undefined) updateData.description = description;
    if (phone !== undefined) updateData.phone = phone;
    if (logo !== undefined) updateData.logo = logo;

    const { data, error } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)
      .select()
      .single();

    if (error) {
      console.error('Error updating business:', error);
      return NextResponse.json(
        { error: 'Failed to update business profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      business: data,
    });

  } catch (error) {
    console.error('Error updating business profile:', error);
    return NextResponse.json(
      { error: 'Failed to update business profile' },
      { status: 500 }
    );
  }
}

