'use client';

import Link from 'next/link';

export default function CreatorPendingPage() {
  return (
    <main className="pt-20 min-h-screen">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-3">Tvoj profil se pregleda</h1>
          <p className="text-muted mb-6">
            Tvoja prijava je uspešno primljena! Naš tim trenutno pregleda tvoj profil.
          </p>

          <div className="bg-secondary/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted">
              Ovo obično traje do <span className="font-medium text-foreground">24 sata</span>.
            </p>
          </div>

          <Link 
            href="/"
            className="block w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors text-center"
          >
            Nazad na početnu
          </Link>
        </div>
      </div>
    </main>
  );
}
