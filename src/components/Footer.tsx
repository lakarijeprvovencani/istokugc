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

        <div className="border-t border-border mt-12 pt-8">
          <p className="text-sm text-muted text-center">
            © {new Date().getFullYear()} UGC Select. Sva prava zadržana.
          </p>
        </div>
      </div>
    </footer>
  );
}
