'use client';

import Link from 'next/link';

export default function CreatorPendingPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-b from-secondary/30 to-white px-6 py-12">
      <div className="max-w-lg w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl border border-border shadow-sm p-8 md:p-12 text-center">
          {/* Animated Icon */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-amber-100 rounded-full animate-pulse"></div>
            <div className="relative w-full h-full bg-amber-50 rounded-full flex items-center justify-center border-2 border-amber-200">
              <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-light mb-4">Tvoj profil se pregleda</h1>
          
          {/* Description */}
          <p className="text-muted mb-8 max-w-sm mx-auto">
            Tvoja prijava je uspešno primljena! Naš tim trenutno pregleda tvoj profil kako bi osigurali kvalitet platforme.
          </p>

          {/* Timeline */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-8 border border-amber-100">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-amber-700">Pregled u toku</span>
            </div>
            <p className="text-sm text-amber-600">
              Ovo obično traje do <span className="font-semibold">24 sata</span>
            </p>
          </div>

          {/* What happens next */}
          <div className="text-left bg-secondary/30 rounded-2xl p-6 mb-8">
            <h3 className="text-sm font-medium mb-4 text-center">Šta dalje?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <p className="text-sm text-muted">Naš tim pregleda tvoje podatke i portfolio</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <p className="text-sm text-muted">Dobićeš email obaveštenje o statusu</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <p className="text-sm text-muted">Nakon odobrenja, tvoj profil postaje vidljiv brendovima</p>
              </div>
            </div>
          </div>

          {/* Button */}
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Nazad na početnu
          </Link>
        </div>

        {/* Footer text */}
        <p className="text-center text-sm text-muted mt-6">
          Imaš pitanja? <a href="mailto:podrska@ugcselect.com" className="text-primary hover:underline">Kontaktiraj nas</a>
        </p>
      </div>
    </div>
  );
}
