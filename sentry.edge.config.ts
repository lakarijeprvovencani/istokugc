/**
 * Sentry konfiguracija za Edge runtime (middleware, edge API rute).
 *
 * Edge runtime nema pristup svim Node.js API-jima, pa je config minimalan.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Edge ima manju quota, manji sample rate
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  sendDefaultPii: false,
  debug: false,

  beforeSend(event) {
    // Ne saljemo greske u dev modu
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }
    return event;
  },

  ignoreErrors: [
    'NetworkError',
    'AbortError',
  ],
});
