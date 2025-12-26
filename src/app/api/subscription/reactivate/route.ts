/**
 * POST /api/subscription/reactivate
 * 
 * Reaktivira pretplatu koja je zakazana za otkazivanje.
 * Radi samo ako pretplata još nije istekla.
 */

import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { prisma } from '@/lib/db';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// });

export async function POST() {
  try {
    // ============================================
    // DEMO MODE
    // ============================================
    
    console.log('🔄 Subscription reactivation requested (demo)');

    return NextResponse.json({
      success: true,
      message: 'Pretplata je reaktivirana (demo)',
      status: 'active',
    });

    // ============================================
    // PRODUKCIJA
    // ============================================
    
    /*
    // Proveri autentifikaciju
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Dohvati subscription
    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      include: { subscription: true },
    });

    if (!business?.subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Proveri da li je zakazana za otkazivanje
    const stripeSubscription = await stripe.subscriptions.retrieve(
      business.subscription.stripeSubscriptionId
    );

    if (!stripeSubscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 }
      );
    }

    // Reaktiviraj u Stripe-u
    await stripe.subscriptions.update(
      business.subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    // Ažuriraj u bazi
    await prisma.subscription.update({
      where: { id: business.subscription.id },
      data: {
        cancelAt: null,
        canceledAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pretplata je reaktivirana',
      status: 'active',
    });
    */
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}


