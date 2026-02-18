import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Idempotency: skip already-processed events
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', event.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await supabase
      .from('webhook_events')
      .insert({ event_id: event.id, event_type: event.type });

    // Handle different event types
    switch (event.type) {
      // Pretplata uspešno kreirana ili obnovljena
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;

        if (subscriptionId) {
          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Izračunaj datum isteka na osnovu billing perioda
          const expiresAt = new Date(subscription.current_period_end * 1000);

          // Ažuriraj business u bazi
          const { error } = await supabase
            .from('businesses')
            .update({
              subscription_status: 'active',
              expires_at: expiresAt.toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            console.error('Error updating business after payment:', error);
          } else {
            console.log('Subscription renewed successfully');
          }
        }
        break;
      }

      // Plaćanje nije uspelo (npr. kartica istekla)
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          // Označi pretplatu kao problematičnu (Stripe će pokušati ponovo)
          console.log('Payment failed for subscription');
          
          // Opcionalno: pošalji email korisniku
        }
        break;
      }

      // Pretplata otkazana
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const { error } = await supabase
          .from('businesses')
          .update({
            subscription_status: 'expired',
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating cancelled subscription:', error);
        }
        break;
      }

      // Pretplata ažurirana
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          const { error } = await supabase
            .from('businesses')
            .update({
              subscription_status: 'expired',
            })
            .eq('stripe_subscription_id', subscription.id);

          if (error) {
            console.error('Error updating subscription status:', error);
          }
        } else if (subscription.status === 'active') {
          const expiresAt = new Date(subscription.current_period_end * 1000);
          
          // Detect plan type from the subscription's price
          let subscriptionType: string | undefined;
          const priceId = subscription.items?.data?.[0]?.price?.id;
          if (priceId) {
            const monthlyPriceId = (process.env.STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_ID_MONTHLY || '').trim();
            const yearlyPriceId = (process.env.STRIPE_PRICE_YEARLY || process.env.STRIPE_PRICE_ID_YEARLY || '').trim();
            if (priceId === monthlyPriceId) subscriptionType = 'monthly';
            else if (priceId === yearlyPriceId) subscriptionType = 'yearly';
          }

          const updateData: Record<string, any> = {
            subscription_status: 'active',
            expires_at: expiresAt.toISOString(),
          };
          if (subscriptionType) {
            updateData.subscription_type = subscriptionType;
          }
          
          const { error } = await supabase
            .from('businesses')
            .update(updateData)
            .eq('stripe_subscription_id', subscription.id);

          if (error) {
            console.error('Error updating subscription:', error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Next.js App Router automatically handles raw body for route handlers
// No config needed - request.text() gives us the raw body
