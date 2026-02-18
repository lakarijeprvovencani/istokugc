/**
 * Create Stripe Checkout Session
 * 
 * Kreira Stripe checkout sesiju za plaćanje pretplate.
 * Koristi prave Price ID-eve iz Stripe Dashboard-a.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICE_IDS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, email, registrationData } = body;

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim();

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[plan as 'monthly' | 'yearly'];
    
    if (!priceId) {
      console.error('Price ID not found for plan:', plan, 'Available:', PRICE_IDS);
      return NextResponse.json(
        { error: `Price not configured for ${plan} plan. Please check STRIPE_PRICE_MONTHLY/YEARLY env variables.` },
        { status: 500 }
      );
    }

    const metadata: Record<string, string> = {
      plan,
      email: email || '',
    };

    if (registrationData) {
      metadata.reg_email = registrationData.email || '';
      metadata.reg_password = registrationData.password || '';
      metadata.reg_companyName = registrationData.companyName || '';
      metadata.reg_website = registrationData.website || '';
      metadata.reg_industry = registrationData.industry || '';
      metadata.reg_description = (registrationData.description || '').substring(0, 500);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      ...(email && { customer_email: email }),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata,
      subscription_data: {
        metadata: {
          plan,
        },
      },
      success_url: `${baseUrl}/checkout/success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
