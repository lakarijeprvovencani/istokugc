/**
 * GET /api/subscription/status
 * 
 * Vraća trenutni status pretplate korisnika.
 * Koristi se za proveru da li korisnik ima pristup premium funkcijama.
 */

import { NextResponse } from 'next/server';
import type { SubscriptionResponse, SubscriptionStatus } from '@/types/subscription';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // ============================================
    // DEMO MODE
    // ============================================
    
    // Simuliramo aktivnu godišnju pretplatu
    const demoResponse: SubscriptionResponse = {
      subscription: {
        id: 'demo_sub_123',
        businessId: 'demo_business_123',
        stripeCustomerId: 'cus_demo123',
        stripeSubscriptionId: 'sub_demo123',
        stripePriceId: 'price_yearly_demo',
        plan: 'yearly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isActive: true,
      daysUntilExpiry: 365,
      canAccessPremium: true,
    };

    return NextResponse.json(demoResponse);

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

    // Dohvati business sa subscription
    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      include: { subscription: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const subscription = business.subscription;
    
    // Izračunaj dane do isteka
    let daysUntilExpiry = 0;
    if (subscription?.currentPeriodEnd) {
      const now = new Date();
      const endDate = new Date(subscription.currentPeriodEnd);
      const diffTime = endDate.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysUntilExpiry = Math.max(0, daysUntilExpiry);
    }

    // Proveri da li ima pristup premium funkcijama
    const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
    const canAccessPremium = isActive || subscription?.status === 'past_due';

    const response: SubscriptionResponse = {
      subscription: subscription || null,
      isActive,
      daysUntilExpiry,
      canAccessPremium,
    };

    return NextResponse.json(response);
    */
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

