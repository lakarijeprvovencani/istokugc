/**
 * Sentry konfiguracija za browser (client-side).
 *
 * Ovaj fajl Next.js automatski ucitava u browseru pre ostatka aplikacije.
 * Hvata sve neuhvacene browser greske, network failures, React error boundary fail-ove.
 *
 * BEZBEDNOST: Filtriramo osetljive podatke pre slanja Sentry-u.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance monitoring: 10% u produkciji da ne pojedemo quota
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay: snima video reprodukciju zadnjih 30s pre greske
  // Free plan: 50 replays/mesec - dovoljno za rane stages
  replaysSessionSampleRate: 0, // Ne snimamo sve sesije, samo one sa greskom
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 0,

  // Ne saljemo PII automatski
  sendDefaultPii: false,

  debug: false,

  integrations: [
    Sentry.replayIntegration({
      // Maskiraj sve input polja (ne snimamo sta user kuca u password/email)
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: false,
    }),
  ],

  beforeSend(event) {
    // Ne saljemo greske u dev modu
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }

    return scrubBrowserData(event);
  },

  ignoreErrors: [
    // Browser extension greske
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network greske kada user offline ili spor net
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // Safari greske kada user navigira pre nego sto se zahtev zavrsi
    'AbortError',
    'The operation was aborted',
    // Greske iz browser ekstenzija (nisu nase)
    /chrome-extension:\/\//,
    /moz-extension:\/\//,
    // CSP greske su konfiguracione, ne aplikacijske
    'Refused to evaluate a string as JavaScript',
  ],

  // Ignorisi greske iz tudjih skripti (Stripe, browser ekstenzije, ads)
  denyUrls: [
    /chrome-extension:\/\//,
    /moz-extension:\/\//,
    /safari-extension:\/\//,
    /^https:\/\/m\.stripe\.com\//,
    /^https:\/\/js\.stripe\.com\//,
  ],
});

/**
 * Uklanja osetljive podatke iz browser event-a pre slanja Sentry-u.
 */
function scrubBrowserData(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  const SENSITIVE_KEYS = [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
    'session',
    'jwt',
    'card_number',
    'cvv',
  ];

  const scrubObject = (obj: Record<string, unknown> | undefined): void => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
        obj[key] = '[FILTERED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        scrubObject(obj[key] as Record<string, unknown>);
      }
    }
  };

  if (event.request) {
    scrubObject(event.request.headers as Record<string, unknown>);
    if (event.request.data && typeof event.request.data === 'object') {
      scrubObject(event.request.data as Record<string, unknown>);
    }
  }

  if (event.extra) {
    scrubObject(event.extra as Record<string, unknown>);
  }

  return event;
}

// Hvata navigacije za bolje performance metrike
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
