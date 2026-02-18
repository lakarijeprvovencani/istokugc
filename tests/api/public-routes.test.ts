/**
 * Tests that public routes work without authentication.
 * These routes should be accessible by everyone.
 */
import { describe, it, expect } from 'vitest';
import { api } from '../helpers/auth';

describe('Public routes — accessible without auth', () => {
  it('GET /api/jobs returns 200 (public job listing)', async () => {
    const res = await fetch(api('/api/jobs'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('jobs');
  });

  it('GET /api/reviews returns 200 (public reviews)', async () => {
    const res = await fetch(api('/api/reviews'));
    expect(res.status).toBe(200);
  });

  it('GET /api/jobs?includeAll=true requires admin (should 401 or 403)', async () => {
    const res = await fetch(api('/api/jobs?includeAll=true'));
    expect([401, 403]).toContain(res.status);
  });
});
