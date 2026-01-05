/**
 * Get Stripe Subscription Status
 * 
 * Vraća trenutni status pretplate za prikaz u dashboardu.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

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

    // Dohvati business iz baze
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: business, error: dbError } = await supabase
      .from('businesses')
      .select('stripe_subscription_id, stripe_customer_id, subscription_type, subscription_status, expires_at')
      .eq('id', businessId)
      .single();

    if (dbError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Ako nema Stripe subscription, vrati podatke iz baze
    if (!business.stripe_subscription_id) {
      return NextResponse.json({
        status: business.subscription_status || 'none',
        plan: business.subscription_type,
        expiresAt: business.expires_at,
        cancelAtPeriodEnd: false,
        hasStripeData: false,
      });
    }

    // Dohvati live podatke iz Stripe-a
    try {
      const subscription = await stripe.subscriptions.retrieve(
        business.stripe_subscription_id
      );

      return NextResponse.json({
        status: subscription.status,
        plan: business.subscription_type,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at 
          ? new Date(subscription.cancel_at * 1000).toISOString() 
          : null,
        hasStripeData: true,
      });
    } catch (stripeError) {
      // Ako Stripe vrati grešku, vrati podatke iz baze
      console.error('Stripe error:', stripeError);
      return NextResponse.json({
        status: business.subscription_status || 'unknown',
        plan: business.subscription_type,
        expiresAt: business.expires_at,
        cancelAtPeriodEnd: false,
        hasStripeData: false,
      });
    }

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}



