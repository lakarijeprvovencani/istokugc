'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  const errorMessages: Record<string, string> = {
    email_verification_failed: 'Verifikacija emaila nije uspela. Molimo pokušajte ponovo.',
    verification_failed: 'Verifikacija nije uspela. Link je možda istekao.',
    invalid_token: 'Link za verifikaciju je istekao ili je nevažeći.',
    account_deactivated: 'Vaš nalog je deaktiviran. Kontaktirajte podršku za više informacija.',
    default: 'Došlo je do greške. Molimo pokušajte ponovo.',
  };

  const displayMessage = message ? errorMessages[message] || errorMessages.default : errorMessages.default;

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12">
      <div className="max-w-md mx-auto px-6 text-center">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-light mb-4">Greška</h1>
        <p className="text-muted mb-8">{displayMessage}</p>
        
        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-block w-full px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            Prijavi se
          </Link>
          <Link
            href="/"
            className="inline-block w-full px-6 py-3 border border-border rounded-xl hover:bg-secondary transition-colors"
          >
            Nazad na početnu
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
