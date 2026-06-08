/**
 * Regresioni testovi za 7 kritičnih bezbednosnih popravki (commit f6b3c6e).
 *
 * Ako neki od ovih padne — vratila se rupa koju smo zatvorili.
 *
 * NAPOMENA:
 * - DB lockdown testovi (Critical #1) idu DIREKTNO na Supabase preko anon
 *   ključa i ne zavise od pokrenutog Next servera.
 * - Ostali testovi gađaju BASE_URL (NEXT_PUBLIC_SITE_URL || localhost:3000),
 *   pa app mora biti pokrenut (npm run dev) ili NEXT_PUBLIC_SITE_URL=produkcija.
 * - Testovi koji zahtevaju biznis nalog se preskaču ako nisu zadati env-ovi
 *   BUSINESS_TEST_EMAIL / BUSINESS_TEST_PASSWORD.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { api, getAdminCookies, fetchAs, getTestIds, getAuthCookies } from '../helpers/auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ──────────────────────────────────────────────────────────────────────────
// Critical #1 — PII kreatora se ne sme čitati anon ključem (DB lockdown)
// ──────────────────────────────────────────────────────────────────────────
describe('Critical #1 — anon ne sme da čita PII kreatora ni RPC', () => {
  const anon = createClient(SUPABASE_URL, ANON_KEY);

  it('anon SELECT creators (email/phone) → permission denied', async () => {
    const { data, error } = await anon
      .from('creators')
      .select('email, phone')
      .eq('status', 'approved')
      .limit(5);

    // Mora postojati greška (permission denied) i NE sme vratiti redove
    expect(error).not.toBeNull();
    expect(data == null || data.length === 0).toBe(true);
  });

  it('anon SELECT creators (bilo koja kolona) → permission denied', async () => {
    const { data, error } = await anon.from('creators').select('id').limit(1);
    expect(error).not.toBeNull();
    expect(data == null || data.length === 0).toBe(true);
  });

  it('anon RPC creators_nearby → permission denied', async () => {
    const { error } = await anon.rpc('creators_nearby', {
      in_lat: 44.8, in_lng: 20.46, in_radius_km: 100,
    });
    expect(error).not.toBeNull();
  });

  it('anon RPC creators_by_city → permission denied', async () => {
    const { error } = await anon.rpc('creators_by_city');
    expect(error).not.toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Critical #5 — enumeracija: includeAll/reviews/jobs samo javni sadržaj
// ──────────────────────────────────────────────────────────────────────────
describe('Critical #5 — javni endpointi ne smeju da cure ne-javne statuse', () => {
  it('GET /api/creators?includeAll=true (bez auth) vraća SAMO approved', async () => {
    const res = await fetch(api('/api/creators?includeAll=true&limit=100'));
    expect(res.status).toBe(200);
    const data = await res.json();
    for (const c of data.creators || []) {
      expect(c.status).toBe('approved');
    }
  });

  it('GET /api/reviews (bez auth) vraća SAMO approved', async () => {
    const res = await fetch(api('/api/reviews'));
    expect(res.status).toBe(200);
    const data = await res.json();
    for (const r of data.reviews || []) {
      expect(r.status).toBe('approved');
    }
  });

  it('GET /api/reviews?status=pending (bez auth) ignoriše param → samo approved', async () => {
    const res = await fetch(api('/api/reviews?status=pending'));
    expect(res.status).toBe(200);
    const data = await res.json();
    for (const r of data.reviews || []) {
      expect(r.status).toBe('approved');
    }
  });

  it('GET /api/jobs?status=pending (bez auth) ne vraća pending poslove', async () => {
    const res = await fetch(api('/api/jobs?status=pending'));
    expect(res.status).toBe(200);
    const data = await res.json();
    for (const j of data.jobs || []) {
      expect(['open', 'in_progress']).toContain(j.status);
    }
  });
});

describe('Critical #5 — jobs?businessId za javnost samo objavljeni poslovi', () => {
  let businessId: string | null = null;

  beforeAll(async () => {
    const adminCookies = await getAdminCookies();
    const ids = await getTestIds(adminCookies);
    businessId = ids.businessId;
  });

  it('GET /api/jobs?businessId=<real> bez auth → samo open/in_progress', async () => {
    if (!businessId) return; // nema podataka → preskoči
    const res = await fetch(api(`/api/jobs?businessId=${businessId}`));
    expect(res.status).toBe(200);
    const data = await res.json();
    for (const j of data.jobs || []) {
      expect(['open', 'in_progress']).toContain(j.status);
    }
  });
});

describe('Critical #5 — reviews/[id] krije ne-odobrene recenzije', () => {
  it('Ne-odobrena recenzija je 404 za neulogovanog', async () => {
    const adminCookies = await getAdminCookies();
    // Admin vidi pending recenzije — nađi jednu da je testiramo kao anon
    const res = await fetchAs(adminCookies, api('/api/reviews?status=pending'));
    const data = await res.json();
    const pending = (data.reviews || [])[0];
    if (!pending) return; // nema pending recenzija → preskoči
    const anonRes = await fetch(api(`/api/reviews/${pending.id}`));
    expect(anonRes.status).toBe(404);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Critical #2 — renew se ne sme izvršiti sa nevažećim/tuđim session_id
// ──────────────────────────────────────────────────────────────────────────
describe('Critical #2 — renew odbija nevažeći session', () => {
  it('POST /api/subscription/renew bez auth → 401', async () => {
    const res = await fetch(api('/api/subscription/renew'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: 'x', sessionId: 'cs_fake' }),
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/subscription/renew sa lažnim sessionId (admin) ne uspeva (≠200)', async () => {
    const adminCookies = await getAdminCookies();
    const res = await fetchAs(adminCookies, api('/api/subscription/renew'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: '00000000-0000-0000-0000-000000000000', sessionId: 'cs_test_fake_invalid' }),
    });
    expect(res.status).not.toBe(200);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Critical #4 — registracija biznisa odbija nevažeći/lažni session
// ──────────────────────────────────────────────────────────────────────────
describe('Critical #4 — register/business odbija lažni session', () => {
  it('POST /api/auth/register/business sa lažnim session_id ne uspeva (≠200)', async () => {
    const res = await fetch(api('/api/auth/register/business'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'napadac@example.com',
        password: 'Sifra123456!',
        companyName: 'Test',
        sessionId: 'cs_test_fake_invalid',
      }),
    });
    expect(res.status).not.toBe(200);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Critical #6 + #3 — zahtevaju biznis nalog (preskaču se bez kredencijala)
// ──────────────────────────────────────────────────────────────────────────
const BIZ_EMAIL = process.env.BUSINESS_TEST_EMAIL;
const BIZ_PASS = process.env.BUSINESS_TEST_PASSWORD;

describe('Critical #6 — biznis ne sme sam da objavi posao (open)', () => {
  it('Biznis PUT status:open na svom poslu → 403', async () => {
    if (!BIZ_EMAIL || !BIZ_PASS) return; // nema biznis kredencijala → preskoči
    const cookies = await getAuthCookies(BIZ_EMAIL, BIZ_PASS);
    // Nađi bilo koji posao ovog biznisa
    const me = await fetchAs(cookies, api('/api/business/profile'));
    const meData = await me.json().catch(() => ({}));
    const bid = meData?.id || meData?.business?.id;
    if (!bid) return;
    const jobsRes = await fetchAs(cookies, api(`/api/jobs?businessId=${bid}`));
    const jobsData = await jobsRes.json();
    const job = (jobsData.jobs || [])[0];
    if (!job) return;
    const res = await fetchAs(cookies, api('/api/jobs'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id, status: 'open' }),
    });
    expect(res.status).toBe(403);
  });
});

describe('Critical #3 — email kreatora iza paywall-a u job-applications', () => {
  it('Biznis BEZ aktivne pretplate ne vidi email kreatora u prijavama', async () => {
    const noSubEmail = process.env.BUSINESS_NOSUB_TEST_EMAIL;
    const noSubPass = process.env.BUSINESS_NOSUB_TEST_PASSWORD;
    if (!noSubEmail || !noSubPass) return; // nema kredencijala → preskoči
    const cookies = await getAuthCookies(noSubEmail, noSubPass);
    const me = await fetchAs(cookies, api('/api/business/profile'));
    const meData = await me.json().catch(() => ({}));
    const bid = meData?.id || meData?.business?.id;
    if (!bid) return;
    const res = await fetchAs(cookies, api(`/api/job-applications?businessId=${bid}`));
    expect(res.status).toBe(200);
    const data = await res.json();
    for (const app of data.applications || []) {
      expect(app.creator?.email).toBeUndefined();
    }
  });
});
