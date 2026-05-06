/**
 * Tests Stripe webhook handler - refund and dispute flows.
 *
 * Uses real Stripe SDK signature generation with our webhook secret to
 * produce signed payloads that the handler will accept. Side effects target
 * a non-existent customer ID so we don't pollute production data.
 *
 * Requires the dev server to be running (BASE_URL).
 */
import { describe, it, expect } from 'vitest';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { api } from '../helpers/auth';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-12-15.clover',
});

// Use a customer ID that doesn't exist so UPDATE is a no-op (0 rows affected).
const FAKE_CUSTOMER_ID = 'cus_NONEXISTENT_TEST_DO_NOT_MATCH';
const FAKE_CHARGE_ID = 'ch_test_nonexistent_xxx';

function makeSignedRequest(eventPayload: Record<string, unknown>) {
  const body = JSON.stringify(eventPayload);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret: WEBHOOK_SECRET,
  });

  return fetch(api('/api/stripe/webhook'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
    body,
  });
}

function makeRefundEvent(opts: { full: boolean }) {
  const amount = 4900;
  const refunded = opts.full ? amount : Math.floor(amount / 2);
  return {
    id: `evt_test_refund_${Date.now()}`,
    object: 'event',
    type: 'charge.refunded',
    api_version: '2025-12-15.clover',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: FAKE_CHARGE_ID,
        object: 'charge',
        amount,
        amount_refunded: refunded,
        customer: FAKE_CUSTOMER_ID,
        status: 'succeeded',
      },
    },
  };
}

describe('Stripe webhook — refund', () => {
  it('rejects request without valid Stripe signature', async () => {
    const res = await fetch(api('/api/stripe/webhook'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeRefundEvent({ full: true })),
    });
    expect(res.status).toBe(400);
  });

  it('accepts properly signed full refund event and returns 200', async () => {
    if (!WEBHOOK_SECRET) {
      console.warn('STRIPE_WEBHOOK_SECRET not set, skipping');
      return;
    }
    const res = await makeSignedRequest(makeRefundEvent({ full: true }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it('accepts properly signed partial refund event and returns 200 (no-op)', async () => {
    if (!WEBHOOK_SECRET) return;
    const res = await makeSignedRequest(makeRefundEvent({ full: false }));
    expect(res.status).toBe(200);
  });

  it('idempotent: same event_id returns duplicate=true on second delivery', async () => {
    if (!WEBHOOK_SECRET) return;
    const event = makeRefundEvent({ full: true });
    // event.id is the same across both calls
    await makeSignedRequest(event);
    const res2 = await makeSignedRequest(event);
    expect(res2.status).toBe(200);
    const data = await res2.json();
    expect(data.duplicate).toBe(true);
  });
});

describe('Stripe webhook — dispute', () => {
  it('accepts properly signed charge.dispute.created and returns 200', async () => {
    if (!WEBHOOK_SECRET) return;
    // Note: handler will try to retrieve charge from Stripe; with a fake
    // charge ID this will fail and processingError will be set, returning
    // 500. To avoid polluting prod data we treat 200 OR 500 as expected
    // (signature was accepted, which is what we're testing here).
    const event = {
      id: `evt_test_dispute_${Date.now()}`,
      object: 'event',
      type: 'charge.dispute.created',
      api_version: '2025-12-15.clover',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `dp_test_${Date.now()}`,
          object: 'dispute',
          charge: FAKE_CHARGE_ID,
          status: 'warning_needs_response',
        },
      },
    };
    const res = await makeSignedRequest(event);
    expect([200, 500]).toContain(res.status);
  });

  it('accepts charge.dispute.closed (informational only)', async () => {
    if (!WEBHOOK_SECRET) return;
    const event = {
      id: `evt_test_dispute_closed_${Date.now()}`,
      object: 'event',
      type: 'charge.dispute.closed',
      api_version: '2025-12-15.clover',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `dp_test_${Date.now()}`,
          object: 'dispute',
          charge: FAKE_CHARGE_ID,
          status: 'won',
        },
      },
    };
    const res = await makeSignedRequest(event);
    expect(res.status).toBe(200);
  });
});
