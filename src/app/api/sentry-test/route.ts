/**
 * PRIVREMENI test endpoint za Sentry verifikaciju.
 * OBRISATI POSLE PRVOG TEST EVENT-a U SENTRY DASHBOARD-U.
 *
 * Poziv: GET /api/sentry-test
 */

import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export async function GET() {
  // Saljemo eksplicitan event Sentry-u (ne oslanjamo se na neuhvacenu gresku)
  Sentry.captureMessage('Sentry test message - server side', {
    level: 'info',
    tags: { test: 'verification' },
  });

  // Bacamo pravu gresku da i error tracking testiramo
  try {
    throw new Error('Sentry server-side test error - ' + new Date().toISOString());
  } catch (error) {
    Sentry.captureException(error);
  }

  // Flushujemo eventove pre nego sto vratimo response (server function bi inace mogla da se zatvori)
  await Sentry.flush(2000);

  return NextResponse.json({
    success: true,
    message: 'Sentry test events sent. Check dashboard in 30s.',
  });
}
