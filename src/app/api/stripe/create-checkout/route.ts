/**
 * Create Stripe Checkout Session
 * 
 * Kreira Stripe checkout sesiju za plaćanje pretplate.
 * Koristi prave Price ID-eve iz Stripe Dashboard-a.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICE_IDS } from '@/lib/stripe';
import { checkRateLimit, getAuthLimiter, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // 🚦 RATE LIMIT: Sprecava spam Stripe Checkout sesija (5/min po IP-ju).
    // Endpoint je javan jer se zove pre login-a tokom registracije, pa
    // koristimo IP-based limit umesto auth-based.
    const rateLimited = await checkRateLimit(getAuthLimiter(), getClientIp(request));
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { plan, email, couponCode } = body;

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

    // NOTE: Registration data (including password) is intentionally NOT stored
    // in Stripe metadata for security/GDPR reasons. It lives only in the
    // user's browser localStorage and is used on the success page.
    const metadata: Record<string, string> = {
      plan,
      email: email || '',
    };

    // If a coupon was entered on our own page, look up the matching Stripe
    // promotion code and apply it directly so the customer doesn't have to
    // re-type it on Stripe's hosted checkout. `discounts` and
    // `allow_promotion_codes` are mutually exclusive on a Checkout Session,
    // so we only fall back to the manual entry field when no valid code
    // was pre-applied.
    let discounts: { promotion_code: string }[] | undefined;
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const promotionCodes = await stripe.promotionCodes.list({
        code: couponCode.trim(),
        active: true,
        limit: 1,
      });
      if (promotionCodes.data.length > 0) {
        discounts = [{ promotion_code: promotionCodes.data[0].id }];
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
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
