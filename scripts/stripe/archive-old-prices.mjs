/**
 * Arhivira stare Stripe cene ($49/$490) postavljanjem active:false.
 * Postojece pretplate (ako ih ima) ostaju netaknute; samo se vise ne
 * mogu koristiti u novim checkout sesijama.
 * Pokreni: node scripts/stripe/archive-old-prices.mjs
 */
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const OLD_PRICE_IDS = [
  'price_1TTbreIlTtFnfTPrD2VHHgDW', // stara mesecna $49
  'price_1TTbreIlTtFnfTPrN12RJTkj', // stara godisnja $490
];

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error('STRIPE_SECRET_KEY nije postavljen');
  const stripe = new Stripe(key, { apiVersion: '2025-12-15.clover' });

  // Prebaci default cenu proizvoda na novu mesecnu pre arhiviranja stare
  const newMonthly = (process.env.STRIPE_PRICE_MONTHLY || '').trim();
  if (newMonthly) {
    const np = await stripe.prices.retrieve(newMonthly);
    const productId = typeof np.product === 'string' ? np.product : np.product.id;
    await stripe.products.update(productId, { default_price: newMonthly });
    console.log(`Default cena proizvoda ${productId} -> ${newMonthly}`);
  }

  for (const id of OLD_PRICE_IDS) {
    const p = await stripe.prices.update(id, { active: false });
    console.log(`Arhivirano: ${id} (active=${p.active})`);
  }
  console.log('✅ Gotovo.');
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
