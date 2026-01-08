'use client';

import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-secondary/30 to-white py-12 lg:py-16">
      <div className="max-w-xl mx-auto px-6 text-center">
        {/* Cancel Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-muted">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-light mb-4">Plaćanje nije završeno</h1>
          <p className="text-muted text-lg">
            Proces registracije nije dovršen. Vaša kartica nije terećena.
          </p>
        </div>

        {/* Important notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-amber-800 mb-1">Nalog nije kreiran</p>
              <p className="text-sm text-amber-700">
                Poslovni nalog se kreira tek nakon uspešne uplate. Ako želite da pokušate ponovo, potrebno je da prođete kroz proces registracije ispočetka.
              </p>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-medium mb-4">Šta dobijate sa pretplatom?</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs mt-0.5">✓</span>
              <span>Pristup bazi UGC kreatora iz regiona</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs mt-0.5">✓</span>
              <span>Postavljanje poslova i projekata</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs mt-0.5">✓</span>
              <span>Direktna komunikacija sa kreatorima</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs mt-0.5">✓</span>
              <span>Slanje ponuda i pozivnica kreatorima</span>
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
            Registruj se ponovo
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
