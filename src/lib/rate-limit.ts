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

export function getAuthLimiter(): RateLimitConfig {
  return AUTH_LIMIT;
}

export function getApiLimiter(): RateLimitConfig {
  return API_LIMIT;
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
      return NextResponse.json(
        { error: 'Previše zahteva. Pokušajte ponovo za minut.' },
        {
          status: 429,
          headers: { 'Retry-After': config.windowSeconds.toString() },
        }
      );
    }

    // Dodaj novi zapis
    await supabaseAdmin
      .from('rate_limits')
      .insert({ key, created_at: new Date().toISOString() });
  } catch {
    // Ako tabela ne postoji ili ima gresku, propusti zahtev
  }

  return null;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
