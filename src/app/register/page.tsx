'use client';

import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] py-12 lg:py-16 bg-gradient-to-b from-secondary/30 to-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light mb-4">Pridruži se UGC Executive</h1>
          <p className="text-muted text-lg">
            Izaberi tip naloga koji želiš da kreiraš
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Kreator Card */}
          <Link 
            href="/register/kreator"
            className="group bg-white rounded-3xl p-8 border-2 border-border hover:border-primary hover:shadow-xl transition-all duration-300"
          >
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-medium mb-3">UGC Kreator</h2>
            <p className="text-muted mb-6">
              Kreiraj sadržaj za brendove, izgradi portfolio i zaradi novac radeći ono što voliš.
            </p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                Besplatna registracija
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                Prikaži svoj portfolio
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                Povežite se sa brendovima
              </li>
            </ul>

            <div className="flex items-center justify-between">
              <span className="text-primary font-medium">Besplatno</span>
              <span className="text-primary group-hover:translate-x-2 transition-transform">
                →
              </span>
            </div>
          </Link>

          {/* Biznis Card */}
          <Link 
            href="/register/biznis"
            className="group bg-white rounded-3xl p-8 border-2 border-primary hover:shadow-xl transition-all duration-300 relative"
          >
            <div className="absolute -top-3 right-6 bg-primary text-white text-xs px-3 py-1 rounded-full font-medium">
              Za firme
            </div>
            
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-medium mb-3">Brend / Firma</h2>
            <p className="text-muted mb-6">
              Pronađi savršene UGC kreatore za tvoj brend i dobij pristup njihovim kontaktima.
            </p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                Pristup svim kreatorima
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                Kontakt informacije
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                Neograničena pretraga
              </li>
            </ul>

            <div className="flex items-center justify-between">
              <span className="text-primary font-medium">od €49/mesec</span>
              <span className="text-primary group-hover:translate-x-2 transition-transform">
                →
              </span>
            </div>
          </Link>
        </div>

        <p className="text-center text-sm text-muted mt-12">
          Već imaš nalog?{' '}
          <Link href="/login" className="text-foreground hover:underline font-medium">
            Prijavi se
          </Link>
        </p>
      </div>
    </div>
  );
}
