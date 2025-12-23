/**
 * Stripe Customer Portal
 * 
 * Kreira link ka Stripe Customer Portal gde korisnik može:
 * - Promeniti plan
 * - Ažurirati karticu
 * - Otkazati pretplatu
 * - Pregledati fakturu
 */

import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { getSession } from '@/lib/auth';
// import { prisma } from '@/lib/db';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// });

export async function POST(request: Request) {
  try {
    // ============================================
    // DEMO MODE - Vraća mock portal URL
    // ============================================
    
    return NextResponse.json({
      url: '/dashboard?portal=demo',
      message: 'Demo: Customer portal would open here',
    });

    // ============================================
    // PRODUKCIJA - Pravi Stripe Customer Portal
    // ============================================
    
    /*
    // Proveri da li je korisnik ulogovan
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Pronađi biznis i Stripe customer ID
    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId },
    });

    if (!business?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Kreiraj portal sesiju
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: business.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
    */
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

