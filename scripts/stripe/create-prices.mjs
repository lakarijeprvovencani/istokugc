/**
 * Kreira nove Stripe cene na ISTOM proizvodu kao trenutna mesecna cena.
 * Mesecna: $99.00 | Godisnja: $948.00 ($79/mes, 20% popust).
 * Koristi STRIPE_SECRET_KEY iz .env.local (isti nalog/mod kao app).
 * NE dira postojece cene/pretplate. Stampa nove price ID-eve.
 *
 * Pokreni: node scripts/stripe/create-prices.mjs
 */
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const NEW_MONTHLY = 9900;  // $99.00
const NEW_YEARLY = 94800;  // $948.00

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error('STRIPE_SECRET_KEY nije postavljen');
  const mode = key.startsWith('sk_live') ? 'LIVE' : 'TEST';
  const stripe = new Stripe(key, { apiVersion: '2025-12-15.clover' });

  const currentMonthlyId = (process.env.STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_ID_MONTHLY || '').trim();
  if (!currentMonthlyId) throw new Error('STRIPE_PRICE_MONTHLY nije postavljen');

  // Nadji proizvod sa trenutne mesecne cene da nove budu na istom proizvodu
  const currentPrice = await stripe.prices.retrieve(currentMonthlyId);
  const productId = typeof currentPrice.product === 'string' ? currentPrice.product : currentPrice.product.id;
  console.log(`Mod: ${mode} | Proizvod: ${productId}`);

  const monthly = await stripe.prices.create({
    product: productId,
    unit_amount: NEW_MONTHLY,
    currency: 'usd',
    recurring: { interval: 'month' },
    nickname: 'Mesecni plan $99',
  });

  const yearly = await stripe.prices.create({
    product: productId,
    unit_amount: NEW_YEARLY,
    currency: 'usd',
    recurring: { interval: 'year' },
    nickname: 'Godisnji plan $948',
  });

  console.log('\n✅ Nove cene kreirane:');
  console.log('STRIPE_PRICE_MONTHLY=' + monthly.id);
  console.log('STRIPE_PRICE_YEARLY=' + yearly.id);
  console.log('\nStare cene (za kasnije arhiviranje):');
  console.log('  monthly:', currentMonthlyId);
  console.log('  yearly :', (process.env.STRIPE_PRICE_YEARLY || process.env.STRIPE_PRICE_ID_YEARLY || '').trim());
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
