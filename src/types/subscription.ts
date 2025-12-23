/**
 * Subscription Types
 * 
 * Svi tipovi vezani za pretplate i plaćanja.
 * Spremno za Stripe integraciju.
 */

// Status pretplate
export type SubscriptionStatus = 
  | 'active'      // Aktivna pretplata
  | 'past_due'    // Plaćanje kasni (Stripe pokušava ponovo)
  | 'unpaid'      // Neuspelo plaćanje
  | 'canceled'    // Korisnik otkazao
  | 'expired'     // Istekla (nije obnovljena)
  | 'trialing'    // Probni period (ako ga koristimo)
  | 'incomplete'  // Checkout nije završen
  | 'incomplete_expired'; // Checkout istekao

// Plan pretplate
export type SubscriptionPlan = 'monthly' | 'yearly';

// Interval naplate
export type BillingInterval = 'month' | 'year';

// Subscription model (za bazu)
export interface Subscription {
  id: string;
  businessId: string;
  
  // Stripe IDs
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  
  // Plan info
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  
  // Datumi
  currentPeriodStart: Date;
  currentPeriodEnd: Date;   // Kada ističe trenutni period
  cancelAt?: Date;          // Ako je zakazano otkazivanje
  canceledAt?: Date;        // Kada je otkazano
  endedAt?: Date;           // Kada je definitivno završena
  
  // Trial (opciono)
  trialStart?: Date;
  trialEnd?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Business sa subscription info
export interface BusinessWithSubscription {
  id: string;
  email: string;
  companyName: string;
  website?: string;
  industry?: string;
  
  // Subscription
  subscription?: Subscription;
  
  // Stripe
  stripeCustomerId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Invoice/Faktura
export interface Invoice {
  id: string;
  stripeInvoiceId: string;
  subscriptionId: string;
  businessId: string;
  
  // Amounts (u centima)
  amountDue: number;
  amountPaid: number;
  
  // Status
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  
  // URLs
  hostedInvoiceUrl?: string;  // Link za plaćanje
  invoicePdf?: string;        // PDF fakture
  
  // Datumi
  periodStart: Date;
  periodEnd: Date;
  dueDate?: Date;
  paidAt?: Date;
  
  createdAt: Date;
}

// Payment method
export interface PaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  businessId: string;
  
  // Card info (masked)
  cardBrand: string;      // visa, mastercard, etc.
  cardLast4: string;      // Poslednje 4 cifre
  cardExpMonth: number;
  cardExpYear: number;
  
  isDefault: boolean;
  
  createdAt: Date;
}

// Webhook event log (za debugging)
export interface WebhookEvent {
  id: string;
  stripeEventId: string;
  type: string;
  processed: boolean;
  error?: string;
  createdAt: Date;
}

// API Response types
export interface SubscriptionResponse {
  subscription: Subscription | null;
  isActive: boolean;
  daysUntilExpiry: number;
  canAccessPremium: boolean;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}

// Helper functions
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing';
}

export function canAccessPremiumFeatures(subscription?: Subscription): boolean {
  if (!subscription) return false;
  
  // Aktivna ili u probnom periodu
  if (isSubscriptionActive(subscription.status)) return true;
  
  // Past due - dajemo grace period (Stripe pokušava ponovo)
  if (subscription.status === 'past_due') return true;
  
  return false;
}

export function getDaysUntilExpiry(subscription?: Subscription): number {
  if (!subscription) return 0;
  
  const now = new Date();
  const endDate = new Date(subscription.currentPeriodEnd);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  const statusMap: Record<SubscriptionStatus, string> = {
    active: 'Aktivna',
    past_due: 'Plaćanje kasni',
    unpaid: 'Neplaćeno',
    canceled: 'Otkazana',
    expired: 'Istekla',
    trialing: 'Probni period',
    incomplete: 'Nedovršeno',
    incomplete_expired: 'Isteklo',
  };
  return statusMap[status] || status;
}

export function getStatusColor(status: SubscriptionStatus): string {
  const colorMap: Record<SubscriptionStatus, string> = {
    active: 'text-success',
    past_due: 'text-warning',
    unpaid: 'text-error',
    canceled: 'text-muted',
    expired: 'text-error',
    trialing: 'text-primary',
    incomplete: 'text-warning',
    incomplete_expired: 'text-muted',
  };
  return colorMap[status] || 'text-muted';
}

