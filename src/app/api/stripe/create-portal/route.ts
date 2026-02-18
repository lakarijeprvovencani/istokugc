/**
 * Create Stripe Customer Portal Session
 * 
 * Omogućava korisnicima da upravljaju svojom pretplatom:
 * - Promene plan (monthly ↔ yearly)
 * - Otkažu pretplatu
 * - Ažuriraju način plaćanja
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    if (user?.role !== 'admin' && user?.businessId !== businessId) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }

    // Dohvati business iz baze da dobijemo stripe_customer_id
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: business, error: dbError } = await supabase
      .from('businesses')
      .select('stripe_customer_id')
      .eq('id', businessId)
      .single();

    if (dbError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    if (!business.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this business' },
        { status: 400 }
      );
    }

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9898').trim();

    // Kreiraj Customer Portal sesiju
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: business.stripe_customer_id,
      return_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });

  } catch (error: any) {
    console.error('Error creating portal session:', error.message);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}




