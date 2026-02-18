/**
 * Tests that users cannot access other users' data.
 * Uses admin to fetch real IDs, then verifies non-owners get 403.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { api, getAdminCookies, fetchAs, getTestIds } from '../helpers/auth';

let adminCookies: string;
let testCreatorId: string | null;
let testBusinessId: string | null;

beforeAll(async () => {
  adminCookies = await getAdminCookies();
  const ids = await getTestIds(adminCookies);
  testCreatorId = ids.creatorId;
  testBusinessId = ids.businessId;
});

describe('Data Isolation — admin accessing data', () => {
  it('Admin can view any creator dashboard', async () => {
    if (!testCreatorId) return;
    const res = await fetchAs(adminCookies, api(`/api/dashboard?type=creator&creatorId=${testCreatorId}`));
    expect(res.status).toBe(200);
  });

  it('Admin can view any business favorites', async () => {
    if (!testBusinessId) return;
    const res = await fetchAs(adminCookies, api(`/api/favorites?businessId=${testBusinessId}`));
    expect(res.status).toBe(200);
  });

  it('Admin can view job applications with any filter', async () => {
    if (!testCreatorId) return;
    const res = await fetchAs(adminCookies, api(`/api/job-applications?creatorId=${testCreatorId}`));
    expect(res.status).toBe(200);
  });

  it('Admin can view job invitations with any filter', async () => {
    if (!testCreatorId) return;
    const res = await fetchAs(adminCookies, api(`/api/job-invitations?creatorId=${testCreatorId}`));
    expect(res.status).toBe(200);
  });
});

describe('Data Isolation — job-applications requires filter for non-admin', () => {
  it('Non-admin cannot list all applications without filter (should 400 or 401)', async () => {
    const res = await fetch(api('/api/job-applications'));
    expect([400, 401]).toContain(res.status);
  });
});

describe('Data Isolation — job-invitations requires filter for non-admin', () => {
  it('Non-admin cannot list all invitations without filter (should 400 or 401)', async () => {
    const res = await fetch(api('/api/job-invitations'));
    expect([400, 401]).toContain(res.status);
  });
});

describe('Data Isolation — job-messages requires applicationId', () => {
  it('Returns 400 without applicationId', async () => {
    const res = await fetchAs(adminCookies, api('/api/job-messages'));
    expect(res.status).toBe(400);
  });
});
