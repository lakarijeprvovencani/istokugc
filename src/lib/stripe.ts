import Stripe from 'stripe';

// Lazy initialization - kreira Stripe instance samo kad je potrebna
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  
  return stripeInstance;
};

// For backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  },
});

// Price IDs iz Stripe Dashboard-a
// Podržava oba formata imena: STRIPE_PRICE_MONTHLY i STRIPE_PRICE_ID_MONTHLY
// trim() uklanja whitespace koji može izazvati greške
export const PRICE_IDS = {
  monthly: (process.env.STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_ID_MONTHLY || '').trim(),
  yearly: (process.env.STRIPE_PRICE_YEARLY || process.env.STRIPE_PRICE_ID_YEARLY || '').trim(),
};

/**
 * Stripe API 2025+ removed `current_period_end` / `current_period_start` from
 * the top-level Subscription object and moved them onto each subscription_item.
 * This helper reads from the new location with a legacy fallback.
 */
export function getSubscriptionPeriodEnd(subscription: any): Date | null {
  const fromItem = subscription?.items?.data?.[0]?.current_period_end;
  const legacy = subscription?.current_period_end;
  const ts = (typeof fromItem === 'number' ? fromItem : null) ??
             (typeof legacy === 'number' ? legacy : null);
  return ts ? new Date(ts * 1000) : null;
}

export function getSubscriptionPeriodStart(subscription: any): Date | null {
  const fromItem = subscription?.items?.data?.[0]?.current_period_start;
  const legacy = subscription?.current_period_start;
  const ts = (typeof fromItem === 'number' ? fromItem : null) ??
             (typeof legacy === 'number' ? legacy : null);
  return ts ? new Date(ts * 1000) : null;
}

/**
 * Stripe API 2025+ removed `invoice.subscription` and exposes the linked
 * subscription via `invoice.parent.subscription_details.subscription` instead.
 */
export function getInvoiceSubscriptionId(invoice: any): string | null {
  const fromParent = invoice?.parent?.subscription_details?.subscription;
  const legacy = invoice?.subscription;
  return (typeof fromParent === 'string' && fromParent) ||
         (typeof legacy === 'string' && legacy) || null;
}

// Cene za prikaz u UI (mora se poklapati sa Stripe Price-evima u live mode-u)
export const PRICES = {
  monthly: {
    amount: 9900, // $99.00
    currency: 'usd',
    interval: 'month' as const,
    name: 'Mesečni plan',
  },
  yearly: {
    amount: 94800, // $948.00 ($79/mes, 20% popust)
    currency: 'usd',
    interval: 'year' as const,
    name: 'Godišnji plan',
  },
};
