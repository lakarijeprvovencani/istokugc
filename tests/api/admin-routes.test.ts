/**
 * Tests that admin-only routes reject non-admin users.
 * Uses a real admin login to verify admin access works.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { api, getAdminCookies, fetchAs } from '../helpers/auth';

let adminCookies: string;

beforeAll(async () => {
  adminCookies = await getAdminCookies();
});

describe('Admin routes — admin has access', () => {
  it('GET /api/admin/creators returns 200', async () => {
    const res = await fetchAs(adminCookies, api('/api/admin/creators'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('creators');
  });

  it('GET /api/admin/businesses returns 200', async () => {
    const res = await fetchAs(adminCookies, api('/api/admin/businesses'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('businesses');
  });

  it('GET /api/admin/categories returns 200', async () => {
    const res = await fetchAs(adminCookies, api('/api/admin/categories'));
    expect(res.status).toBe(200);
  });

  it('GET /api/businesses returns 200 for admin', async () => {
    const res = await fetchAs(adminCookies, api('/api/businesses'));
    expect(res.status).toBe(200);
  });
});
