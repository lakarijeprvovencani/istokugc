import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-secondary mt-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-medium mb-4">UGC Select</h3>
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
                <Link href="/register?tab=kreator" className="text-sm text-muted hover:text-foreground transition-colors">
                  Postani kreator
                </Link>
              </li>
              <li>
                <Link href="/register?tab=biznis" className="text-sm text-muted hover:text-foreground transition-colors">
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
              © {new Date().getFullYear()} UGC Select. Sva prava zadržana.
            </p>
            
            {/* Payment Icons */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted mr-2">Prihvatamo:</span>
              
              {/* Visa */}
              <div className="w-10 h-6 bg-white rounded border border-border flex items-center justify-center" title="Visa">
                <svg viewBox="0 0 48 32" className="w-8 h-5">
                  <path fill="#1434CB" d="M19.5 24.5h-3.8l2.4-14.8h3.8l-2.4 14.8zm15.9-14.4c-.8-.3-1.9-.6-3.4-.6-3.8 0-6.4 2-6.4 4.8 0 2.1 1.9 3.3 3.4 4 1.5.7 2 1.2 2 1.9 0 1-.8 1.5-2.4 1.5-1.6 0-2.5-.2-3.8-.8l-.5-.2-.6 3.5c.9.4 2.7.8 4.5.8 4 0 6.6-2 6.6-5 0-1.7-1-2.9-3.2-4-1.3-.7-2.1-1.1-2.1-1.8 0-.6.7-1.2 2.1-1.2 1.2 0 2.1.3 2.8.5l.3.2.6-3.6zm9.8-.4h-3c-.9 0-1.6.3-2 1.2l-5.7 13.6h4l.8-2.2h4.9l.5 2.2h3.5l-3-14.8zm-4.7 9.6l1.5-4.1.4-1.1.2 1 .9 4.2h-3zm-22-9.6l-3.5 10.1-.4-2c-.7-2.3-2.8-4.8-5.1-6l3.4 12.7h4l6-14.8h-4.4z"/>
                  <path fill="#F9A533" d="M8.5 9.7H2.1l-.1.4c4.8 1.2 7.9 4.1 9.2 7.6l-1.3-6.8c-.2-.9-.9-1.2-1.4-1.2z"/>
                </svg>
              </div>
              
              {/* Mastercard */}
              <div className="w-10 h-6 bg-white rounded border border-border flex items-center justify-center" title="Mastercard">
                <svg viewBox="0 0 48 32" className="w-8 h-5">
                  <circle fill="#EB001B" cx="16" cy="16" r="10"/>
                  <circle fill="#F79E1B" cx="32" cy="16" r="10"/>
                  <path fill="#FF5F00" d="M24 8.5c2.5 2 4 5 4 8.5s-1.5 6.5-4 8.5c-2.5-2-4-5-4-8.5s1.5-6.5 4-8.5z"/>
                </svg>
              </div>
              
              {/* American Express */}
              <div className="w-10 h-6 bg-[#006FCF] rounded border border-border flex items-center justify-center" title="American Express">
                <svg viewBox="0 0 48 32" className="w-8 h-5">
                  <text x="24" y="20" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="Arial">AMEX</text>
                </svg>
              </div>
              
              {/* Apple Pay */}
              <div className="w-10 h-6 bg-black rounded border border-border flex items-center justify-center" title="Apple Pay">
                <svg viewBox="0 0 48 32" className="w-7 h-4" fill="white">
                  <path d="M14.5 10.5c-.8 1-2 1.7-3.2 1.6-.2-1.2.4-2.5 1.1-3.3.8-.9 2.1-1.6 3.1-1.6.1 1.3-.4 2.5-1 3.3zm1 1.7c-1.8-.1-3.3 1-4.1 1s-2.2-1-3.6-1c-1.8 0-3.5 1.1-4.5 2.7-1.9 3.3-.5 8.2 1.4 10.9.9 1.3 2 2.8 3.5 2.8 1.4 0 1.9-.9 3.6-.9s2.2.9 3.6.9 2.4-1.4 3.3-2.7c1-1.5 1.4-3 1.5-3.1-1.4-.5-2.4-2-2.4-3.8 0-1.5.8-2.8 2-3.5-.8-1.1-2-1.8-3.3-2.3zm14.5-3v18.6h3v-6.4h4c3.7 0 6.2-2.5 6.2-6.1s-2.5-6.1-6.1-6.1h-7.1zm3 2.6h3.3c2.5 0 3.9 1.3 3.9 3.6s-1.4 3.6-4 3.6H33v-7.2z"/>
                </svg>
              </div>
              
              {/* Google Pay */}
              <div className="w-10 h-6 bg-white rounded border border-border flex items-center justify-center" title="Google Pay">
                <svg viewBox="0 0 48 32" className="w-7 h-4">
                  <path fill="#4285F4" d="M24.5 16.5v4h6.4c-.3 1.5-1.1 2.8-2.3 3.6l3.8 2.9c2.2-2 3.5-5 3.5-8.6 0-.8-.1-1.6-.2-2.4h-11.2v.5z"/>
                  <path fill="#34A853" d="M16.5 20.9l-.9.6-3 2.3c1.9 3.8 5.8 6.4 10.4 6.4 3.1 0 5.8-1 7.7-2.8l-3.8-2.9c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.5-4.7z"/>
                  <path fill="#FBBC05" d="M9.6 16.5c0-1 .2-2 .5-2.9l-3.9-3c-.8 1.6-1.2 3.4-1.2 5.4s.4 3.8 1.2 5.4l3.9-3c-.3-.9-.5-1.9-.5-2.9z"/>
                  <path fill="#EA4335" d="M23 10.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3c-2-1.9-4.6-3-7.7-3-4.6 0-8.5 2.6-10.4 6.4l3.9 3c1-2.7 3.5-4.8 6.5-4.8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
