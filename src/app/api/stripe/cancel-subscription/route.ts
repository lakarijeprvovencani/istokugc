/**
 * Cancel Stripe Subscription
 * 
 * Otkazuje pretplatu na kraju trenutnog billing perioda.
 * Korisnik može nastaviti da koristi servis do isteka.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, immediate = false } = body;

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
      .select('stripe_subscription_id')
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

    let subscription;

    if (immediate) {
      // Odmah otkaži pretplatu
      subscription = await stripe.subscriptions.cancel(
        business.stripe_subscription_id
      );

      // Ažuriraj status u bazi odmah
      await supabase
        .from('businesses')
        .update({ subscription_status: 'expired' })
        .eq('id', businessId);
    } else {
      // Otkaži na kraju billing perioda
      subscription = await stripe.subscriptions.update(
        business.stripe_subscription_id,
        { cancel_at_period_end: true }
      );

      // Ažuriraj u bazi da se zna da je zakazano otkazivanje
      await supabase
        .from('businesses')
        .update({ 
          // Status ostaje active dok ne istekne
          // Možemo dodati polje 'cancel_at_period_end' ako treba
        })
        .eq('id', businessId);
    }

    return NextResponse.json({
      success: true,
      message: immediate 
        ? 'Pretplata je otkazana.' 
        : 'Pretplata će biti otkazana na kraju trenutnog perioda.',
      cancelAt: subscription.cancel_at 
        ? new Date(subscription.cancel_at * 1000).toISOString() 
        : null,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}



