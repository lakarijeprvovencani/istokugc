import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  prefix: string;
}

const AUTH_LIMIT: RateLimitConfig = { maxRequests: 5, windowSeconds: 60, prefix: 'auth' };
const API_LIMIT: RateLimitConfig = { maxRequests: 30, windowSeconds: 60, prefix: 'api' };
// Limit za korisničke akcije: prijave, pozivi, slanje poruka.
// 20/min je dovoljno za normalan rad ali blokira spam botove.
const ACTION_LIMIT: RateLimitConfig = { maxRequests: 20, windowSeconds: 60, prefix: 'action' };
// Strogi limit za kreiranje aplikacija/poziva: 10/min spreči spam ka kreatorima
const APPLY_LIMIT: RateLimitConfig = { maxRequests: 10, windowSeconds: 60, prefix: 'apply' };

export function getAuthLimiter(): RateLimitConfig {
  return AUTH_LIMIT;
}

export function getApiLimiter(): RateLimitConfig {
  return API_LIMIT;
}

export function getActionLimiter(): RateLimitConfig {
  return ACTION_LIMIT;
}

export function getApplyLimiter(): RateLimitConfig {
  return APPLY_LIMIT;
}

// In-memory fallback (po instanci) kad DB rate-limit nije dostupan.
// Sprečava "fail-open" ponašanje gde greška u bazi ukida sve limite.
const memStore = new Map<string, number[]>();

function memoryLimited(config: RateLimitConfig, identifier: string): boolean {
  const key = `${config.prefix}:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const hits = (memStore.get(key) || []).filter((t) => t > now - windowMs);
  if (hits.length >= config.maxRequests) {
    memStore.set(key, hits);
    return true;
  }
  hits.push(now);
  memStore.set(key, hits);
  // Povremeno očisti mapu da ne raste beskonačno
  if (memStore.size > 5000) {
    for (const [k, v] of memStore) {
      if (v.every((t) => t <= now - windowMs)) memStore.delete(k);
    }
  }
  return false;
}

function tooMany(config: RateLimitConfig): NextResponse {
  return NextResponse.json(
    { error: 'Previše zahteva. Pokušajte ponovo za minut.' },
    { status: 429, headers: { 'Retry-After': config.windowSeconds.toString() } }
  );
}

/**
 * Proveri rate limit koristeci Supabase tabelu `rate_limits`.
 * Vraca NextResponse sa 429 ako je prekoracen, ili null ako je ok.
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  identifier: string
): Promise<NextResponse | null> {
  try {
    const key = `${config.prefix}:${identifier}`;
    const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();

    // Obrisi stare zapise i prebroj aktivne u jednom pozivu
    await supabaseAdmin
      .from('rate_limits')
      .delete()
      .lt('created_at', windowStart);

    const { count } = await supabaseAdmin
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', windowStart);

    if ((count ?? 0) >= config.maxRequests) {
      return tooMany(config);
    }

    // Dodaj novi zapis
    await supabaseAdmin
      .from('rate_limits')
      .insert({ key, created_at: new Date().toISOString() });
  } catch {
    // FAIL-CLOSED: ako DB rate-limit nije dostupan, padamo na in-memory
    // limiter umesto da propustimo sve zahteve (sprečava DoS/brute-force).
    if (memoryLimited(config, identifier)) {
      return tooMany(config);
    }
  }

  return null;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
