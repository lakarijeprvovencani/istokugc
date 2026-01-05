import Stripe from 'stripe';

// Lazy initialization - kreira Stripe instance samo kad je potrebna
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
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
export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || '',
  yearly: process.env.STRIPE_PRICE_YEARLY || '',
};

// Cene za prikaz u UI
export const PRICES = {
  monthly: {
    amount: 4900, // €49.00
    currency: 'eur',
    interval: 'month' as const,
    name: 'Mesečni plan',
  },
  yearly: {
    amount: 49000, // €490.00
    currency: 'eur',
    interval: 'year' as const,
    name: 'Godišnji plan',
  },
};
