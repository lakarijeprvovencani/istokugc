import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-secondary mt-32">
      <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-medium mb-4">UGC Executive</h3>
            <p className="text-muted text-sm max-w-md leading-relaxed">
              Platforma koja povezuje talentovane UGC kreatore sa brendovima 
              koji traže autentičan sadržaj. Jednostavno, transparentno, efikasno.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-muted">Platforma</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/kreatori" className="text-sm text-muted hover:text-foreground transition-colors">
                  Pretraži kreatore
                </Link>
              </li>
              <li>
                <Link href="/register/kreator" className="text-sm text-muted hover:text-foreground transition-colors">
                  Postani kreator
                </Link>
              </li>
              <li>
                <Link href="/register/biznis" className="text-sm text-muted hover:text-foreground transition-colors">
                  Za brendove
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-muted">Pravno</h4>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm text-muted hover:text-foreground transition-colors">
                  Uslovi korišćenja
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted hover:text-foreground transition-colors">
                  Politika privatnosti
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted hover:text-foreground transition-colors">
                  GDPR
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-sm text-muted">
              © {new Date().getFullYear()} UGC Executive. Sva prava zadržana.
            </p>
            
            {/* Payment Icons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted mr-1">Prihvatamo:</span>
              
              {/* Visa */}
              <div className="h-7 px-2 bg-white rounded border border-border flex items-center justify-center" title="Visa">
                <span className="text-[#1A1F71] font-bold text-xs italic tracking-tight">VISA</span>
              </div>
              
              {/* Mastercard */}
              <div className="w-9 h-7 bg-white rounded border border-border flex items-center justify-center" title="Mastercard">
                <svg viewBox="0 0 32 20" className="w-6 h-4">
                  <circle fill="#EB001B" cx="10" cy="10" r="7"/>
                  <circle fill="#F79E1B" cx="22" cy="10" r="7"/>
                  <path fill="#FF5F00" d="M16 4.5c1.8 1.4 3 3.4 3 5.5s-1.2 4.1-3 5.5c-1.8-1.4-3-3.4-3-5.5s1.2-4.1 3-5.5z"/>
                </svg>
              </div>
              
              {/* American Express */}
              <div className="h-7 px-1.5 bg-[#006FCF] rounded border border-border flex items-center justify-center" title="American Express">
                <span className="text-white font-bold text-[10px] tracking-tight">AMEX</span>
              </div>
              
              {/* Apple Pay */}
              <div className="h-7 px-2 bg-black rounded border border-border flex items-center justify-center gap-0.5" title="Apple Pay">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83"/>
                  <path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-white font-medium text-[10px]">Pay</span>
              </div>
              
              {/* Google Pay */}
              <div className="h-7 px-1.5 bg-white rounded border border-border flex items-center justify-center" title="Google Pay">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.8 4.133-1.147 1.147-2.933 2.4-6.04 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
