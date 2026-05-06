/**
 * Next.js Instrumentation hook.
 *
 * Ovaj fajl Next.js automatski poziva pri pokretanju servera (i edge i node runtime).
 * Koristi se za inicijalizaciju Sentry-a i drugih monitoring alata.
 *
 * Vise informacija: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Sentry hvata greske iz Next.js render funkcija (server komponente, layouts, pages)
export const onRequestError = Sentry.captureRequestError;
