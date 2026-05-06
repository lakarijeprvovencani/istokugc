/**
 * PRIVREMENA test stranica - baca client-side gresku za Sentry verifikaciju.
 * OBRISATI POSLE PRVE GRESKE U SENTRY DASHBOARD-U.
 */

'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryTestPage() {
  useEffect(() => {
    Sentry.captureMessage('Sentry client-side test message', {
      level: 'info',
      tags: { test: 'client-verification' },
    });

    setTimeout(() => {
      try {
        throw new Error('Sentry client-side test error - ' + new Date().toISOString());
      } catch (error) {
        Sentry.captureException(error);
      }
    }, 500);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-sm border border-border text-center">
        <h1 className="text-xl font-medium mb-3">Sentry Test Page</h1>
        <p className="text-sm text-muted">
          Test eventovi su poslati Sentry-u. Proveri dashboard za 30 sekundi.
        </p>
      </div>
    </div>
  );
}
