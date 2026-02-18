import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PROJECT_REF = SUPABASE_URL.split('//')[1].split('.')[0];

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const ADMIN_EMAIL = process.env.ADMIN_SETUP_EMAIL || 'admin@ugcadmin.com';
export const ADMIN_PASSWORD = process.env.ADMIN_SETUP_PASSWORD || 'SifraAdmin123321!';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getAuthCookies(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    throw new Error(`Login failed for ${email}: ${error?.message || 'No session'}`);
  }

  const tokenData = JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + data.session.expires_in,
    expires_in: data.session.expires_in,
    token_type: 'bearer',
  });

  const cookieName = `sb-${PROJECT_REF}-auth-token`;

  // Supabase SSR splits cookies into chunks of ~3180 chars
  const chunks: string[] = [];
  for (let i = 0; i < tokenData.length; i += 3180) {
    chunks.push(tokenData.substring(i, i + 3180));
  }

  if (chunks.length === 1) {
    return `${cookieName}=${encodeURIComponent(chunks[0])}`;
  }

  return chunks
    .map((chunk, i) => `${cookieName}.${i}=${encodeURIComponent(chunk)}`)
    .join('; ');
}

export async function getAdminCookies(): Promise<string> {
  return getAuthCookies(ADMIN_EMAIL, ADMIN_PASSWORD);
}

export function api(path: string) {
  return `${BASE_URL}${path}`;
}

export async function fetchAs(
  cookieString: string,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers as Record<string, string>,
      Cookie: cookieString,
    },
  });
}

export async function fetchAsAdmin(url: string, options: RequestInit = {}): Promise<Response> {
  const cookies = await getAdminCookies();
  return fetchAs(cookies, url, options);
}

// Fetch test data: find a real creator and business from the DB
export async function getTestIds(adminCookies: string) {
  const creatorsRes = await fetchAs(adminCookies, api('/api/admin/creators'));
  const creatorsData = await creatorsRes.json();
  const creator = creatorsData.creators?.[0];

  const businessesRes = await fetchAs(adminCookies, api('/api/admin/businesses'));
  const businessesData = await businessesRes.json();
  const business = businessesData.businesses?.[0];

  return {
    creatorId: creator?.id || null,
    businessId: business?.id || null,
  };
}
