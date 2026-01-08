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
  console.log('🔔 Webhook received!');
  
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    console.log('Webhook signature present:', !!signature);
    console.log('Webhook secret configured:', !!webhookSecret);

    if (!signature) {
      console.error('❌ No signature provided');
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified');
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature', details: err.message },
        { status: 400 }
      );
    }

    console.log('📨 Event type:', event.type);
    console.log('📨 Event ID:', event.id);

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
            console.log(`✅ Subscription renewed for customer ${customerId}`);
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
          console.log(`⚠️ Payment failed for subscription ${subscriptionId}`);
          
          // Opcionalno: pošalji email korisniku
        }
        break;
      }

      // Pretplata otkazana
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🗑️ Processing subscription.deleted for:', subscription.id);
        
        const { data, error } = await supabase
          .from('businesses')
          .update({
            subscription_status: 'expired',
          })
          .eq('stripe_subscription_id', subscription.id)
          .select();

        if (error) {
          console.error('❌ Error updating cancelled subscription:', error);
        } else {
          console.log(`✅ Subscription cancelled: ${subscription.id}`, data);
        }
        break;
      }

      // Pretplata ažurirana
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        console.log('🔄 Processing subscription.updated for:', subscription.id);
        console.log('🔄 Subscription status:', subscription.status);
        console.log('🔄 Cancel at period end:', subscription.cancel_at_period_end);
        
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          console.log('🔄 Setting status to expired');
          const { data, error } = await supabase
            .from('businesses')
            .update({
              subscription_status: 'expired',
            })
            .eq('stripe_subscription_id', subscription.id)
            .select();

          if (error) {
            console.error('❌ Error updating subscription status:', error);
          } else {
            console.log('✅ Updated to expired:', data);
          }
        } else if (subscription.status === 'active') {
          const expiresAt = new Date(subscription.current_period_end * 1000);
          console.log('🔄 Subscription still active, expires:', expiresAt);
          
          const { data, error } = await supabase
            .from('businesses')
            .update({
              subscription_status: 'active',
              expires_at: expiresAt.toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id)
            .select();

          if (error) {
            console.error('❌ Error updating subscription:', error);
          } else {
            console.log('✅ Updated subscription:', data);
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
