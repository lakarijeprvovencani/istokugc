'use client';

import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-white py-20">
      <div className="max-w-xl mx-auto px-6 text-center">
        {/* Cancel Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-muted">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-light mb-4">Plaćanje otkazano</h1>
          <p className="text-muted text-lg">
            Niste dovršili proces plaćanja. Vaša kartica nije terećena.
          </p>
        </div>

        {/* Info box */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-medium mb-4">Zašto da se pretplatite?</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs mt-0.5">✓</span>
              <span>Pristup preko 100 UGC kreatora iz regiona</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs mt-0.5">✓</span>
              <span>Direktan kontakt sa kreatorima (email, telefon)</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs mt-0.5">✓</span>
              <span>Neograničena pretraga i filtriranje</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs mt-0.5">✓</span>
              <span>Otkaži pretplatu kad god želiš</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register/biznis"
            className="px-8 py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Pokušaj ponovo
          </Link>
          <Link
            href="/"
            className="px-8 py-4 border border-border rounded-xl font-medium hover:bg-secondary transition-colors"
          >
            Vrati se na početnu
          </Link>
        </div>

        {/* Help text */}
        <p className="text-sm text-muted mt-12">
          Imate problema sa plaćanjem?{' '}
          <a href="mailto:support@ugcselect.com" className="text-primary hover:underline">
            Kontaktirajte podršku
          </a>
        </p>
      </div>
    </div>
  );
}

