/**
 * Change Stripe Subscription Plan
 * 
 * Menja plan pretplate (monthly ↔ yearly).
 * Stripe automatski računa prorata.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICE_IDS } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const body = await request.json();
    const { businessId, newPlan } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    if (user?.role !== 'admin' && user?.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Možete menjati samo svoj plan' },
        { status: 403 }
      );
    }

    if (!newPlan || !['monthly', 'yearly'].includes(newPlan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "monthly" or "yearly"' },
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
      .select('stripe_subscription_id, subscription_type')
      .eq('id', businessId)
      .single();

    if (dbError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    if (!business.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    if (business.subscription_type === newPlan) {
      return NextResponse.json(
        { error: 'Already on this plan' },
        { status: 400 }
      );
    }

    const newPriceId = PRICE_IDS[newPlan as 'monthly' | 'yearly'];

    // Dohvati trenutnu pretplatu da dobijemo subscription item ID
    const currentSubscription = await stripe.subscriptions.retrieve(
      business.stripe_subscription_id
    );

    const subscriptionItemId = currentSubscription.items.data[0].id;

    // Ažuriraj pretplatu sa novim planom
    const updatedSubscription: any = await stripe.subscriptions.update(
      business.stripe_subscription_id,
      {
        items: [
          {
            id: subscriptionItemId,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations', // Automatski prorata
      }
    );

    // Ažuriraj u bazi
    const newExpiresAt = new Date(updatedSubscription.current_period_end * 1000);
    
    await supabase
      .from('businesses')
      .update({
        subscription_type: newPlan,
        expires_at: newExpiresAt.toISOString(),
      })
      .eq('id', businessId);

    return NextResponse.json({
      success: true,
      message: `Plan promenjen na ${newPlan === 'monthly' ? 'mesečni' : 'godišnji'}.`,
      newPlan,
      currentPeriodEnd: newExpiresAt.toISOString(),
    });

  } catch (error) {
    console.error('Error changing plan:', error);
    return NextResponse.json(
      { error: 'Failed to change plan' },
      { status: 500 }
    );
  }
}



