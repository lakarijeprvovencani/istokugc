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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
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
    console.error('Error creating portal session:', error);
    console.error('Stripe error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
    });
    
    // Return more specific error message
    const errorMessage = error.message || 'Failed to create portal session';
    return NextResponse.json(
      { error: errorMessage, details: error.code || error.type },
      { status: 500 }
    );
  }
}




