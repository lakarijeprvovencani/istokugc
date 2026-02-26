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

    // Process event FIRST, then mark as processed
    let processingError: string | null = null;

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
          const expiresAt = new Date(subscription.current_period_end * 1000);

          const { error } = await supabase
            .from('businesses')
            .update({
              subscription_status: 'active',
              expires_at: expiresAt.toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            processingError = `Error updating business after payment: ${error.message}`;
            console.error(processingError);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
          const attemptCount = invoice.attempt_count || 0;

          if (subscription.status === 'past_due' || subscription.status === 'unpaid' || attemptCount >= 3) {
            const { error } = await supabase
              .from('businesses')
              .update({ subscription_status: 'expired' })
              .eq('stripe_subscription_id', subscriptionId);

            if (error) {
              processingError = `Error updating failed payment status: ${error.message}`;
              console.error(processingError);
            } else {
              console.log(`Payment failed (attempt ${attemptCount}), subscription marked expired`);
            }
          } else {
            console.log(`Payment failed (attempt ${attemptCount}), Stripe will retry`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const { error } = await supabase
          .from('businesses')
          .update({ subscription_status: 'expired' })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          processingError = `Error updating cancelled subscription: ${error.message}`;
          console.error(processingError);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          const { error } = await supabase
            .from('businesses')
            .update({ subscription_status: 'expired' })
            .eq('stripe_subscription_id', subscription.id);

          if (error) {
            processingError = `Error updating subscription status: ${error.message}`;
            console.error(processingError);
          }
        } else if (subscription.status === 'active') {
          const expiresAt = new Date(subscription.current_period_end * 1000);
          
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
            processingError = `Error updating subscription: ${error.message}`;
            console.error(processingError);
          }
        } else if (subscription.status === 'past_due') {
          const { error } = await supabase
            .from('businesses')
            .update({ subscription_status: 'expired' })
            .eq('stripe_subscription_id', subscription.id);

          if (error) {
            processingError = `Error updating past_due subscription: ${error.message}`;
            console.error(processingError);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // If processing failed, return 500 so Stripe retries
    if (processingError) {
      return NextResponse.json({ error: processingError }, { status: 500 });
    }

    // Mark as processed ONLY after successful handling
    await supabase
      .from('webhook_events')
      .insert({ event_id: event.id, event_type: event.type });

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
