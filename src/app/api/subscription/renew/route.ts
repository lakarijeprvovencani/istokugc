import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-helper';
import { stripe, PRICE_IDS, getSubscriptionPeriodEnd } from '@/lib/stripe';

// POST /api/subscription/renew
// Ozivljavanje istekle/otkazane pretplate kroz NOVU Stripe Checkout Session.
//
// BEZBEDNOST: Klijent salje samo `businessId` i `sessionId`. Server validira:
//   - User je vlasnik tog biznisa (ili admin)
//   - Stripe session je `paid` + `subscription` mode + active subscription
//   - Customer/subscription/plan/expires se citaju IZ Stripe-a
// Klijent NIKAD ne moze da postavi `subscription_status: 'active'` bez naplate.
export async function POST(request: Request) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const { businessId, sessionId } = await request.json();

    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json({ error: 'businessId je obavezan' }, { status: 400 });
    }
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId je obavezan' }, { status: 400 });
    }

    if (user?.role !== 'admin' && user?.businessId !== businessId) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }

    // 1. KLJUCNA PROVERA: validiraj Stripe session
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });
    } catch {
      return NextResponse.json(
        { error: 'Plaćanje nije pronađeno.' },
        { status: 400 }
      );
    }

    if (session.mode !== 'subscription' || session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Plaćanje nije potvrđeno.' },
        { status: 402 }
      );
    }

    const subscription = typeof session.subscription === 'object' ? session.subscription : null;
    if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trialing')) {
      return NextResponse.json(
        { error: 'Pretplata nije aktivna.' },
        { status: 402 }
      );
    }

    const priceId = subscription.items.data[0]?.price?.id;
    let plan: 'monthly' | 'yearly';
    if (priceId === PRICE_IDS.monthly) {
      plan = 'monthly';
    } else if (priceId === PRICE_IDS.yearly) {
      plan = 'yearly';
    } else {
      return NextResponse.json({ error: 'Nepoznat plan pretplate.' }, { status: 400 });
    }

    const periodEnd = getSubscriptionPeriodEnd(subscription);
    if (!periodEnd) {
      return NextResponse.json({ error: 'Greška pri čitanju trajanja pretplate.' }, { status: 500 });
    }

    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const stripeSubscriptionId = subscription.id;

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'Greška pri čitanju Stripe podataka.' }, { status: 500 });
    }

    const supabase = createAdminClient();

    // 2. Update biznisa - probaj prvo po id, pa po user_id
    let updateResult = await supabase
      .from('businesses')
      .update({
        subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
        subscription_type: plan,
        subscribed_at: new Date().toISOString(),
        expires_at: periodEnd.toISOString(),
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
      })
      .eq('id', businessId);

    if (updateResult.error || updateResult.count === 0) {
      updateResult = await supabase
        .from('businesses')
        .update({
          subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
          subscription_type: plan,
          subscribed_at: new Date().toISOString(),
          expires_at: periodEnd.toISOString(),
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
        })
        .eq('user_id', businessId);
    }

    if (updateResult.error) {
      console.error('Error updating subscription:', updateResult.error);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Pretplata uspešno obnovljena',
      plan,
      expiresAt: periodEnd.toISOString(),
    });

  } catch (error: unknown) {
    console.error('Subscription renewal error:', error);
    const msg = error instanceof Error ? error.message : 'Greška pri obnovi pretplate';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
