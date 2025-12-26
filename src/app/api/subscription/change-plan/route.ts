/**
 * POST /api/subscription/change-plan
 * 
 * Menja plan pretplate (mesečno <-> godišnje).
 * Promena se primenjuje odmah sa prorata obračunom.
 */

import { NextResponse } from 'next/server';
import type { SubscriptionPlan } from '@/types/subscription';
// import Stripe from 'stripe';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { prisma } from '@/lib/db';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// });

// Stripe Price IDs
const PRICE_IDS = {
  monthly: 'price_monthly_placeholder',
  yearly: 'price_yearly_placeholder',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { newPlan } = body as { newPlan: SubscriptionPlan };

    if (!newPlan || !['monthly', 'yearly'].includes(newPlan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "monthly" or "yearly"' },
        { status: 400 }
      );
    }

    // ============================================
    // DEMO MODE
    // ============================================
    
    console.log('🔄 Plan change requested (demo):', newPlan);

    const pricing = {
      monthly: { price: 49, interval: 'mesec' },
      yearly: { price: 490, interval: 'godina' },
    };

    return NextResponse.json({
      success: true,
      message: `Plan promenjen na ${newPlan === 'yearly' ? 'godišnji' : 'mesečni'} (demo)`,
      newPlan,
      price: pricing[newPlan].price,
      interval: pricing[newPlan].interval,
      effectiveDate: new Date().toISOString(),
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

    // Dohvati trenutnu subscription iz Stripe-a
    const currentSubscription = await stripe.subscriptions.retrieve(
      business.subscription.stripeSubscriptionId
    );

    // Proveri da li je isti plan
    if (business.subscription.plan === newPlan) {
      return NextResponse.json(
        { error: 'Already on this plan' },
        { status: 400 }
      );
    }

    // Promeni plan u Stripe-u
    const updatedSubscription = await stripe.subscriptions.update(
      business.subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: currentSubscription.items.data[0].id,
            price: PRICE_IDS[newPlan],
          },
        ],
        proration_behavior: 'create_prorations', // Automatski prorata
      }
    );

    // Ažuriraj u bazi
    await prisma.subscription.update({
      where: { id: business.subscription.id },
      data: {
        plan: newPlan,
        stripePriceId: PRICE_IDS[newPlan],
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Plan promenjen na ${newPlan === 'yearly' ? 'godišnji' : 'mesečni'}`,
      newPlan,
      effectiveDate: new Date().toISOString(),
      nextBillingDate: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    });
    */
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to change subscription plan' },
      { status: 500 }
    );
  }
}


