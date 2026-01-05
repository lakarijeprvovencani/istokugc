import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// GET /api/stripe/session/[sessionId]
// Dohvata podatke o Stripe checkout session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    return NextResponse.json({
      customerId: typeof session.customer === 'string' 
        ? session.customer 
        : session.customer?.id || null,
      subscriptionId: typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id || null,
      customerEmail: session.customer_email,
      paymentStatus: session.payment_status,
    });

  } catch (error) {
    console.error('Error fetching Stripe session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}



