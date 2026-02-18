/**
 * Tests Stripe-related API routes.
 * Verifies auth and basic request handling.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { api, getAdminCookies, fetchAs } from '../helpers/auth';

let adminCookies: string;

beforeAll(async () => {
  adminCookies = await getAdminCookies();
});

describe('Stripe routes — auth required', () => {
  it('POST /api/stripe/cancel-subscription requires auth', async () => {
    const res = await fetch(api('/api/stripe/cancel-subscription'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: 'test' }),
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/stripe/reactivate-subscription requires auth', async () => {
    const res = await fetch(api('/api/stripe/reactivate-subscription'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: 'test' }),
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/stripe/create-portal requires auth', async () => {
    const res = await fetch(api('/api/stripe/create-portal'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: 'test' }),
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/stripe/subscription-status requires auth', async () => {
    const res = await fetch(api('/api/stripe/subscription-status?businessId=test'));
    expect(res.status).toBe(401);
  });
});

describe('Stripe routes — session endpoint (no auth needed)', () => {
  it('GET /api/stripe/session/invalid returns 500 (invalid session)', async () => {
    const res = await fetch(api('/api/stripe/session/invalid_session_id'));
    expect(res.status).toBe(500);
  });
});

describe('Stripe routes — create-checkout works without auth', () => {
  it('POST /api/stripe/create-checkout with valid plan returns 200', async () => {
    const res = await fetch(api('/api/stripe/create-checkout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'monthly', email: 'test@test.com' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('url');
    expect(data.url).toContain('stripe.com');
  });
});

describe('Stripe routes — webhook rejects unsigned requests', () => {
  it('POST /api/stripe/webhook without signature returns 400', async () => {
    const res = await fetch(api('/api/stripe/webhook'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test.event' }),
    });
    expect(res.status).toBe(400);
  });
});
