/**
 * POST /api/stripe/webhook
 * 
 * Stripe Webhook Handler
 * 
 * Prima webhook događaje od Stripe-a i ažurira status pretplate u bazi.
 * Ovo je kritična komponenta za automatsko upravljanje pretplatama.
 * 
 * Glavni eventi koje obrađujemo:
 * - checkout.session.completed: Novo plaćanje završeno
 * - customer.subscription.created: Nova pretplata kreirana
 * - customer.subscription.updated: Promena pretplate (upgrade/downgrade)
 * - customer.subscription.deleted: Pretplata otkazana
 * - invoice.paid: Uspešno plaćanje (za obnavljanje)
 * - invoice.payment_failed: Neuspelo plaćanje
 * - customer.subscription.trial_will_end: Trial ističe uskoro
 */

import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { prisma } from '@/lib/db';
// import { sendEmail } from '@/lib/email'; // Za slanje email notifikacija

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// });

// const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.json();
  
  console.log('📨 Stripe webhook received:', body.type);
  
  // ============================================
  // DEMO MODE - Logovanje svih događaja
  // ============================================
  
  switch (body.type) {
    // ==========================================
    // CHECKOUT EVENTS
    // ==========================================
    
    case 'checkout.session.completed': {
      const session = body.data?.object;
      console.log('✅ Checkout completed');
      console.log('   Customer:', session?.customer_email);
      console.log('   Plan:', session?.metadata?.plan);
      // PRODUKCIJA: Kreiraj business i subscription u bazi
      break;
    }

    case 'checkout.session.expired': {
      console.log('⏰ Checkout session expired');
      // PRODUKCIJA: Opciono pošalji reminder email
      break;
    }

    // ==========================================
    // SUBSCRIPTION LIFECYCLE EVENTS
    // ==========================================
    
    case 'customer.subscription.created': {
      const subscription = body.data?.object;
      console.log('📝 Subscription created');
      console.log('   Status:', subscription?.status);
      console.log('   Plan:', subscription?.items?.data?.[0]?.price?.id);
      // PRODUKCIJA: Kreiraj subscription record u bazi
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = body.data?.object;
      console.log('🔄 Subscription updated');
      console.log('   New status:', subscription?.status);
      console.log('   Cancel at period end:', subscription?.cancel_at_period_end);
      // PRODUKCIJA: Ažuriraj subscription u bazi
      // Moguće promene: plan change, cancel scheduled, reactivate
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = body.data?.object;
      console.log('❌ Subscription deleted/canceled');
      console.log('   ID:', subscription?.id);
      // PRODUKCIJA: Označi subscription kao otkazanu, ukloni pristup
      break;
    }

    case 'customer.subscription.paused': {
      console.log('⏸️ Subscription paused');
      // PRODUKCIJA: Ažuriraj status, možda ograniči pristup
      break;
    }

    case 'customer.subscription.resumed': {
      console.log('▶️ Subscription resumed');
      // PRODUKCIJA: Ažuriraj status, vrati pristup
      break;
    }

    case 'customer.subscription.trial_will_end': {
      const subscription = body.data?.object;
      console.log('⚠️ Trial ending soon');
      console.log('   Trial ends:', subscription?.trial_end);
      // PRODUKCIJA: Pošalji email da trial ističe za 3 dana
      break;
    }

    // ==========================================
    // INVOICE/PAYMENT EVENTS
    // ==========================================
    
    case 'invoice.created': {
      console.log('📄 Invoice created');
      // PRODUKCIJA: Opciono sačuvaj fakturu u bazi
      break;
    }

    case 'invoice.finalized': {
      console.log('📋 Invoice finalized');
      // PRODUKCIJA: Invoice je spreman za plaćanje
      break;
    }

    case 'invoice.paid': {
      const invoice = body.data?.object;
      console.log('💰 Invoice paid');
      console.log('   Amount:', invoice?.amount_paid);
      console.log('   Customer:', invoice?.customer_email);
      // PRODUKCIJA: Ažuriraj subscription period, sačuvaj fakturu
      // Ovo je glavni event za OBNAVLJANJE pretplate
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = body.data?.object;
      console.log('⚠️ Payment failed');
      console.log('   Customer:', invoice?.customer_email);
      console.log('   Attempt:', invoice?.attempt_count);
      // PRODUKCIJA: Pošalji email upozorenja
      // Stripe automatski pokušava ponovo (retry schedule)
      break;
    }

    case 'invoice.payment_action_required': {
      console.log('🔐 Payment requires action (3D Secure)');
      // PRODUKCIJA: Pošalji email sa linkom za autentifikaciju
      break;
    }

    case 'invoice.upcoming': {
      const invoice = body.data?.object;
      console.log('📅 Upcoming invoice');
      console.log('   Amount:', invoice?.amount_due);
      console.log('   Due date:', invoice?.due_date);
      // PRODUKCIJA: Opciono pošalji reminder email
      break;
    }

    // ==========================================
    // PAYMENT METHOD EVENTS
    // ==========================================
    
    case 'payment_method.attached': {
      console.log('💳 Payment method attached');
      // PRODUKCIJA: Sačuvaj payment method u bazi
      break;
    }

    case 'payment_method.detached': {
      console.log('💳 Payment method detached');
      // PRODUKCIJA: Ukloni payment method iz baze
      break;
    }

    case 'payment_method.updated': {
      console.log('💳 Payment method updated');
      // PRODUKCIJA: Ažuriraj podatke o kartici
      break;
    }

    // ==========================================
    // CUSTOMER EVENTS
    // ==========================================
    
    case 'customer.created': {
      console.log('👤 Customer created');
      break;
    }

    case 'customer.updated': {
      console.log('👤 Customer updated');
      break;
    }

    case 'customer.deleted': {
      console.log('👤 Customer deleted');
      // PRODUKCIJA: Opciono soft-delete business
      break;
    }

    // ==========================================
    // DEFAULT
    // ==========================================
    
    default:
      console.log('📌 Unhandled event type:', body.type);
  }

  // Uvek vraćamo 200 da Stripe zna da smo primili webhook
  return NextResponse.json({ received: true });

  // ============================================
  // PRODUKCIJA - Pravi webhook handling
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

  // Log event za debugging
  await prisma.webhookEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
      processed: false,
    },
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Kreiraj business
        const business = await prisma.business.create({
          data: {
            email: session.customer_email!,
            companyName: session.metadata?.companyName || 'Company',
            stripeCustomerId: session.customer as string,
          },
        });

        // Kreiraj subscription
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await prisma.subscription.create({
          data: {
            businessId: business.id,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: stripeSubscription.items.data[0].price.id,
            plan: session.metadata?.plan as 'monthly' | 'yearly',
            status: 'active',
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          },
        });

        // Pošalji welcome email
        await sendEmail({
          to: session.customer_email!,
          template: 'welcome',
          data: { companyName: session.metadata?.companyName },
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status as any,
            cancelAt: subscription.cancel_at 
              ? new Date(subscription.cancel_at * 1000) 
              : null,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            updatedAt: new Date(),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'canceled',
            endedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Pošalji goodbye email
        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
          include: { business: true },
        });
        
        if (sub?.business?.email) {
          await sendEmail({
            to: sub.business.email,
            template: 'subscription_canceled',
            data: { companyName: sub.business.companyName },
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Ažuriraj subscription period
        if (invoice.subscription) {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
          await prisma.subscription.update({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: {
              status: 'active',
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              updatedAt: new Date(),
            },
          });
        }

        // Sačuvaj fakturu
        await prisma.invoice.create({
          data: {
            stripeInvoiceId: invoice.id,
            subscriptionId: invoice.subscription as string,
            amountDue: invoice.amount_due,
            amountPaid: invoice.amount_paid,
            status: 'paid',
            hostedInvoiceUrl: invoice.hosted_invoice_url,
            invoicePdf: invoice.invoice_pdf,
            periodStart: new Date(invoice.period_start * 1000),
            periodEnd: new Date(invoice.period_end * 1000),
            paidAt: new Date(),
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Ažuriraj status
        if (invoice.subscription) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: {
              status: 'past_due',
              updatedAt: new Date(),
            },
          });
        }

        // Pošalji email upozorenja
        if (invoice.customer_email) {
          await sendEmail({
            to: invoice.customer_email,
            template: 'payment_failed',
            data: { 
              amount: invoice.amount_due / 100,
              retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 dana
            },
          });
        }
        break;
      }
    }

    // Označi event kao obrađen
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true },
    });

  } catch (err) {
    console.error('Error processing webhook:', err);
    
    // Zabeležimo grešku
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: { 
        processed: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
    });
    
    // Ne vraćamo error - Stripe bi pokušao ponovo
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
