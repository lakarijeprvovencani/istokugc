/**
 * POST /api/subscription/cancel
 * 
 * Otkazuje pretplatu korisnika.
 * Pretplata ostaje aktivna do kraja trenutnog perioda.
 */

import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { prisma } from '@/lib/db';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cancelImmediately = false } = body;

    // ============================================
    // DEMO MODE
    // ============================================
    
    console.log('📛 Subscription cancel requested (demo)');
    console.log('Cancel immediately:', cancelImmediately);

    return NextResponse.json({
      success: true,
      message: cancelImmediately 
        ? 'Pretplata je odmah otkazana (demo)'
        : 'Pretplata će biti otkazana na kraju perioda (demo)',
      cancelAt: cancelImmediately 
        ? new Date().toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Otkaži u Stripe-u
    const subscription = await stripe.subscriptions.update(
      business.subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: !cancelImmediately,
      }
    );

    // Ako je odmah, potpuno otkaži
    if (cancelImmediately) {
      await stripe.subscriptions.cancel(
        business.subscription.stripeSubscriptionId
      );
    }

    // Ažuriraj u bazi
    await prisma.subscription.update({
      where: { id: business.subscription.id },
      data: {
        status: cancelImmediately ? 'canceled' : business.subscription.status,
        cancelAt: cancelImmediately ? new Date() : new Date(subscription.current_period_end * 1000),
        canceledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: cancelImmediately 
        ? 'Pretplata je odmah otkazana'
        : 'Pretplata će biti otkazana na kraju perioda',
      cancelAt: cancelImmediately 
        ? new Date().toISOString()
        : new Date(subscription.current_period_end * 1000).toISOString(),
    });
    */
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}


