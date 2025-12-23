/**
 * Stripe Webhook Handler
 * 
 * Ovaj endpoint prima webhook događaje od Stripe-a i ažurira
 * status pretplate u bazi podataka.
 * 
 * VAŽNO: U produkciji je potrebno:
 * 1. Verifikovati Stripe potpis (stripe.webhooks.constructEvent)
 * 2. Povezati sa Supabase bazom
 * 3. Dodati error handling i retry logiku
 * 4. Logovati događaje za debugging
 */

import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { prisma } from '@/lib/db';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// });

// const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  // ============================================
  // DEMO MODE - Simulira webhook handling
  // ============================================
  
  const body = await request.json();
  
  console.log('📨 Stripe webhook received (demo):', body.type);
  
  // Simuliramo različite webhook događaje
  switch (body.type) {
    case 'checkout.session.completed':
      // Korisnik je uspešno platio
      console.log('✅ Checkout completed:', body.data?.object?.customer_email);
      // U produkciji: Kreiraj korisnika i aktiviraj pretplatu
      break;
      
    case 'customer.subscription.created':
      console.log('📝 Subscription created');
      // U produkciji: Kreiraj ili ažuriraj subscription record
      break;
      
    case 'customer.subscription.updated':
      console.log('🔄 Subscription updated');
      // U produkciji: Ažuriraj status pretplate
      break;
      
    case 'customer.subscription.deleted':
      console.log('❌ Subscription cancelled');
      // U produkciji: Deaktiviraj pretplatu
      break;
      
    case 'invoice.paid':
      console.log('💰 Invoice paid');
      // U produkciji: Produži pretplatu
      break;
      
    case 'invoice.payment_failed':
      console.log('⚠️ Payment failed');
      // U produkciji: Pošalji email upozorenja
      break;
      
    default:
      console.log('📌 Unhandled event:', body.type);
  }

  return NextResponse.json({ received: true });

  // ============================================
  // PRODUKCIJA - Pravi Stripe webhook handling
  // ============================================
  
  /*
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err);
    return new NextResponse('Webhook Error', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Kreiraj korisnika u bazi
      const business = await prisma.business.create({
        data: {
          email: session.customer_email!,
          companyName: session.metadata?.companyName || 'Company',
          stripeCustomerId: session.customer as string,
          subscriptionStatus: 'active',
          subscriptionPlan: session.metadata?.plan as 'monthly' | 'yearly',
          subscribedAt: new Date(),
          expiresAt: new Date(Date.now() + (session.metadata?.plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
        },
      });

      // Kreiraj User account
      await prisma.user.create({
        data: {
          email: session.customer_email!,
          name: session.metadata?.companyName || 'Company',
          role: 'business',
          businessId: business.id,
        },
      });

      console.log('✅ Business created:', business.id);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      
      await prisma.business.update({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          subscriptionStatus: subscription.status === 'active' ? 'active' : 'expired',
          expiresAt: new Date(subscription.current_period_end * 1000),
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      await prisma.business.update({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          subscriptionStatus: 'cancelled',
        },
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Pošalji email upozorenja
      console.log('⚠️ Payment failed for:', invoice.customer_email);
      
      // Opciono: Deaktiviraj pretplatu nakon X neuspelih pokušaja
      break;
    }
  }

  return NextResponse.json({ received: true });
  */
}

// Onemogući body parser za webhook (Stripe šalje raw payload)
export const config = {
  api: {
    bodyParser: false,
  },
};

