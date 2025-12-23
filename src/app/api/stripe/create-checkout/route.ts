/**
 * Create Stripe Checkout Session
 * 
 * Kreira Stripe checkout sesiju za plaćanje pretplate.
 * Koristi se kada korisnik izabere plan na pricing stranici.
 * 
 * NAPOMENA: U demo modu, ovo samo vraća mock URL.
 * U produkciji, kreira pravu Stripe sesiju.
 */

import { NextResponse } from 'next/server';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// });

// Stripe price IDs (kreirati u Stripe dashboard)
const PRICE_IDS = {
  monthly: 'price_monthly_placeholder', // Zameniti pravim ID-om
  yearly: 'price_yearly_placeholder',   // Zameniti pravim ID-om
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan, email, companyName } = body;

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // ============================================
    // DEMO MODE - Vraća mock checkout URL
    // ============================================
    
    const checkoutUrl = `/checkout?plan=${plan}`;
    
    return NextResponse.json({
      url: checkoutUrl,
      sessionId: 'demo_session_' + Date.now(),
    });

    // ============================================
    // PRODUKCIJA - Pravi Stripe Checkout
    // ============================================
    
    /*
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[plan as 'monthly' | 'yearly'],
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        plan,
        companyName,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      subscription_data: {
        metadata: {
          plan,
          companyName,
        },
      },
      // Omogući automatsko slanje računa
      invoice_creation: {
        enabled: true,
      },
      // Probni period (opciono)
      // subscription_data: {
      //   trial_period_days: 7,
      // },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
    */
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

