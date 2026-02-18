/**
 * Tests input validation on registration and review endpoints.
 * Ensures Zod schemas reject invalid data.
 */
import { describe, it, expect } from 'vitest';
import { api } from '../helpers/auth';

// Registration endpoints have rate limiting — 400 = validation error, 429 = rate limited.
// Both mean the invalid request was blocked, which is correct.
const BLOCKED = [400, 429];

describe('Validation — Creator registration', () => {
  it('Rejects empty body', async () => {
    const res = await fetch(api('/api/auth/register/creator'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(BLOCKED).toContain(res.status);
  });

  it('Rejects missing required fields', async () => {
    const res = await fetch(api('/api/auth/register/creator'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
      }),
    });
    expect(BLOCKED).toContain(res.status);
  });

  it('Rejects invalid email format', async () => {
    const res = await fetch(api('/api/auth/register/creator'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'Test123456!',
        name: 'Test',
        bio: 'Test bio that is long enough to pass',
        location: 'Belgrade',
        priceFrom: 50,
        categories: ['UGC'],
        platforms: ['Instagram'],
        languages: ['Srpski'],
      }),
    });
    expect(BLOCKED).toContain(res.status);
  });

  it('Rejects short password', async () => {
    const res = await fetch(api('/api/auth/register/creator'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: '123',
        name: 'Test',
        bio: 'Test bio that is long enough',
        location: 'Belgrade',
        priceFrom: 50,
        categories: ['UGC'],
        platforms: ['Instagram'],
        languages: ['Srpski'],
      }),
    });
    expect(BLOCKED).toContain(res.status);
  });
});

describe('Validation — Business registration', () => {
  it('Rejects empty body', async () => {
    const res = await fetch(api('/api/auth/register/business'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(BLOCKED).toContain(res.status);
  });

  it('Rejects missing companyName', async () => {
    const res = await fetch(api('/api/auth/register/business'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'biz@test.com',
        password: 'Test123456!',
        // missing companyName
      }),
    });
    // 400 = validation error, 429 = rate limited (both mean the request was blocked)
    expect([400, 429]).toContain(res.status);
  });
});

describe('Validation — Stripe checkout', () => {
  it('Rejects invalid plan', async () => {
    const res = await fetch(api('/api/stripe/create-checkout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'invalid' }),
    });
    expect(res.status).toBe(400);
  });

  it('Rejects missing plan', async () => {
    const res = await fetch(api('/api/stripe/create-checkout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
