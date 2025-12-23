/**
 * GET /api/subscription/invoices
 * 
 * Vraća listu svih faktura korisnika.
 * Uključuje linkove za pregled i download PDF-a.
 */

import { NextResponse } from 'next/server';
import type { Invoice } from '@/types/subscription';
// import Stripe from 'stripe';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { prisma } from '@/lib/db';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// });

export async function GET() {
  try {
    // ============================================
    // DEMO MODE
    // ============================================
    
    // Simulirane fakture
    const demoInvoices: Invoice[] = [
      {
        id: 'inv_demo_001',
        stripeInvoiceId: 'in_demo001',
        subscriptionId: 'sub_demo123',
        businessId: 'bus_demo123',
        amountDue: 49000, // €490 u centima
        amountPaid: 49000,
        status: 'paid',
        hostedInvoiceUrl: '#',
        invoicePdf: '#',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        paidAt: new Date(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'inv_demo_002',
        stripeInvoiceId: 'in_demo002',
        subscriptionId: 'sub_demo123',
        businessId: 'bus_demo123',
        amountDue: 49000,
        amountPaid: 49000,
        status: 'paid',
        hostedInvoiceUrl: '#',
        invoicePdf: '#',
        periodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
    ];

    return NextResponse.json({
      invoices: demoInvoices,
      totalCount: demoInvoices.length,
    });

    // ============================================
    // PRODUKCIJA
    // ============================================
    
    /*
    // Proveri autentifikaciju
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Dohvati business
    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });

    if (!business?.stripeCustomerId) {
      return NextResponse.json({
        invoices: [],
        totalCount: 0,
      });
    }

    // Dohvati fakture iz Stripe-a
    const stripeInvoices = await stripe.invoices.list({
      customer: business.stripeCustomerId,
      limit: 100,
    });

    // Mapiraj u naš format
    const invoices: Invoice[] = stripeInvoices.data.map((inv) => ({
      id: inv.id,
      stripeInvoiceId: inv.id,
      subscriptionId: inv.subscription as string,
      businessId: business.id,
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      status: inv.status as Invoice['status'],
      hostedInvoiceUrl: inv.hosted_invoice_url || undefined,
      invoicePdf: inv.invoice_pdf || undefined,
      periodStart: new Date(inv.period_start * 1000),
      periodEnd: new Date(inv.period_end * 1000),
      dueDate: inv.due_date ? new Date(inv.due_date * 1000) : undefined,
      paidAt: inv.status_transitions.paid_at 
        ? new Date(inv.status_transitions.paid_at * 1000) 
        : undefined,
      createdAt: new Date(inv.created * 1000),
    }));

    return NextResponse.json({
      invoices,
      totalCount: stripeInvoices.data.length,
    });
    */
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

