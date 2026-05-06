/**
 * Sentry konfiguracija za Node.js runtime (API rute, server komponente).
 *
 * Ovaj fajl se izvršava na serveru. NE SME da sadrži browser-only kod.
 *
 * Bezbednost: filtriramo osetljive podatke (password, token, stripe key)
 * pre slanja Sentry-u.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Sampling: u produkciji uzimamo 10% performance traceova da ne pojedemo quota.
  // Greške se uvek šalju (errors nisu sample-ovane).
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Ne saljemo PII (Personally Identifiable Information) automatski.
  // User context dodajemo eksplicitno preko Sentry.setUser() i to samo user.id.
  sendDefaultPii: false,

  // Debug logging samo u dev modu
  debug: false,

  // Filtriraj osetljive podatke pre slanja Sentry-u
  beforeSend(event, hint) {
    // Ne saljemo greske u dev modu (samo u produkciji)
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }

    return scrubSensitiveData(event);
  },

  // Ignorisi neke nebitne greske
  ignoreErrors: [
    // Network errors koji su normalni (user offline, slow connection)
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    // Greske kada user zatvori tab usred zahteva
    'AbortError',
    'The operation was aborted',
  ],
});

/**
 * Uklanja osetljive podatke iz Sentry event-a pre slanja.
 *
 * Filtrira:
 * - password / pass / token / secret / authorization u request body i headers
 * - stripe / supabase keys
 * - JWT tokeni
 * - credit card brojevi
 */
function scrubSensitiveData(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  const SENSITIVE_KEYS = [
    'password',
    'passwd',
    'pass',
    'token',
    'secret',
    'apikey',
    'api_key',
    'authorization',
    'auth',
    'cookie',
    'session',
    'jwt',
    'stripe_key',
    'stripe_secret',
    'service_role',
    'service_role_key',
    'credit_card',
    'card_number',
    'cvv',
    'ssn',
  ];

  const scrubObject = (obj: Record<string, unknown> | undefined): void => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
        obj[key] = '[FILTERED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        scrubObject(obj[key] as Record<string, unknown>);
      } else if (typeof obj[key] === 'string') {
        // Filter JWT-like stringove (eyJ... pattern)
        if ((obj[key] as string).startsWith('eyJ') && (obj[key] as string).length > 100) {
          obj[key] = '[FILTERED_JWT]';
        }
      }
    }
  };

  // Scrub request data
  if (event.request) {
    scrubObject(event.request.headers as Record<string, unknown>);
    scrubObject(event.request.cookies as Record<string, unknown>);
    if (event.request.data && typeof event.request.data === 'object') {
      scrubObject(event.request.data as Record<string, unknown>);
    }
    // Ukloni query string parametre koji mogu sadržati token
    if (event.request.query_string && typeof event.request.query_string === 'string') {
      event.request.query_string = event.request.query_string.replace(
        /([?&])(token|secret|key|auth|session)=[^&]*/gi,
        '$1$2=[FILTERED]'
      );
    }
  }

  // Scrub extra context
  if (event.extra) {
    scrubObject(event.extra as Record<string, unknown>);
  }

  // Scrub breadcrumbs (svi koraci pre greske)
  if (event.breadcrumbs) {
    for (const breadcrumb of event.breadcrumbs) {
      if (breadcrumb.data) {
        scrubObject(breadcrumb.data as Record<string, unknown>);
      }
    }
  }

  return event;
}
