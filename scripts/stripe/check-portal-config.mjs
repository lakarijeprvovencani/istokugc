/**
 * Inspekcija Stripe Billing Portal konfiguracije (live):
 * - da li je aktivna
 * - da li portal nudi promenu plana i koje cene referencira
 *   (bitno posle arhiviranja starih cena).
 * Read-only. Pokreni: node scripts/stripe/check-portal-config.mjs
 */
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error('STRIPE_SECRET_KEY nije postavljen');
  const stripe = new Stripe(key, { apiVersion: '2025-12-15.clover' });

  const newMonthly = (process.env.STRIPE_PRICE_MONTHLY || '').trim();
  const newYearly = (process.env.STRIPE_PRICE_YEARLY || '').trim();
  console.log('Nove cene u env:', { newMonthly, newYearly });

  const configs = await stripe.billingPortal.configurations.list({ limit: 10 });
  if (!configs.data.length) {
    console.log('\n⚠️ Nema portal konfiguracija (koristi se default). Promena plana verovatno nije eksplicitno podesena.');
  }
  for (const c of configs.data) {
    console.log(`\n--- Config ${c.id} (active=${c.active}, default=${c.is_default}) ---`);
    const su = c.features?.subscription_update;
    console.log('  subscription_update.enabled:', su?.enabled);
    if (su?.enabled) {
      const products = su.products || [];
      for (const p of products) {
        console.log(`    proizvod ${p.product}: cene =`, p.prices);
      }
      const referencesOld = products.some((p) => (p.prices || []).some((pr) => pr !== newMonthly && pr !== newYearly));
      const hasNew = products.some((p) => (p.prices || []).includes(newMonthly)) && products.some((p) => (p.prices || []).includes(newYearly));
      console.log('    -> referencira nove cene (obe):', hasNew);
      console.log('    -> referencira neku staru/drugu cenu:', referencesOld);
    }
    console.log('  cancel.enabled:', c.features?.subscription_cancel?.enabled);
    console.log('  payment_method_update.enabled:', c.features?.payment_method_update?.enabled);
  }
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
