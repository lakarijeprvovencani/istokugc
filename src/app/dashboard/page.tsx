'use client';

import { useDemo } from '@/context/DemoContext';
import Link from 'next/link';
import Image from 'next/image';
import { mockCreators } from '@/lib/mockData';

export default function DashboardPage() {
  const { currentUser } = useDemo();

  // Redirect logic would go here in real app
  if (currentUser.type === 'guest') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-4">Nisi prijavljen</h1>
          <Link href="/login" className="text-primary hover:underline">
            Prijavi se
          </Link>
        </div>
      </div>
    );
  }

  if (currentUser.type === 'creator') {
    return <CreatorDashboard />;
  }

  // All business users have active subscription (payment required to access)
  return <BusinessDashboard />;
}

function CreatorDashboard() {
  const creator = mockCreators[0]; // Demo: use first creator

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <h1 className="text-3xl font-light mb-2">Dashboard</h1>
        <p className="text-muted mb-10">Dobrodošla nazad, {creator.name}</p>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile status */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Status profila</h2>
                <span className="px-4 py-1.5 bg-success/10 text-success rounded-full text-sm">
                  Odobren
                </span>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full overflow-hidden relative">
                  <Image src={creator.photo} alt={creator.name} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">{creator.name}</h3>
                  <p className="text-sm text-muted">{creator.location}</p>
                  <p className="text-sm text-muted mt-1">Od €{creator.priceFrom} po projektu</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Link 
                  href="#"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  Uredi profil →
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-6 border border-border text-center">
                <div className="text-3xl font-light mb-1">247</div>
                <div className="text-sm text-muted">Pregleda profila</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-border text-center">
                <div className="text-3xl font-light mb-1">12</div>
                <div className="text-sm text-muted">Kontaktiranja</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-border text-center">
                <div className="text-3xl font-light mb-1">4.9</div>
                <div className="text-sm text-muted">Prosečna ocena</div>
              </div>
            </div>

            {/* Portfolio */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Portfolio</h2>
                <button className="text-sm text-primary hover:underline">
                  + Dodaj video
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {creator.portfolio.map((item, index) => (
                  <div key={index} className="aspect-[3/4] relative rounded-xl overflow-hidden">
                    <Image src={item.thumbnail} alt="" fill className="object-cover" />
                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full text-xs">
                      {item.type}
                    </div>
                  </div>
                ))}
                <button className="aspect-[3/4] rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted hover:border-muted transition-colors">
                  <span className="text-3xl">+</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick info */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h3 className="font-medium mb-4">Tvoje informacije</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Email</span>
                  <span>{creator.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Telefon</span>
                  <span>{creator.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Instagram</span>
                  <span>{creator.instagram || '—'}</span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h3 className="font-medium mb-4">Kategorije</h3>
              <div className="flex flex-wrap gap-2">
                {creator.categories.map((cat) => (
                  <span key={cat} className="px-3 py-1.5 bg-secondary rounded-full text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h3 className="font-medium mb-4">Platforme</h3>
              <div className="flex flex-wrap gap-2">
                {creator.platforms.map((plat) => (
                  <span key={plat} className="px-3 py-1.5 bg-secondary rounded-full text-sm">
                    {plat}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h3 className="font-medium mb-4">Jezici</h3>
              <div className="flex flex-wrap gap-2">
                {creator.languages.map((lang) => (
                  <span key={lang} className="px-3 py-1.5 bg-secondary rounded-full text-sm">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Note: All business users must have active subscription to access the app
// Pricing/payment page will be shown during registration (via Stripe integration)
function BusinessDashboard() {
  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <h1 className="text-3xl font-light mb-2">Dashboard</h1>
        <p className="text-muted mb-10">Dobrodošao nazad</p>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subscription status */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium mb-1">Tvoja pretplata</h2>
                  <p className="text-sm text-muted">Godišnji plan</p>
                </div>
                <span className="px-4 py-1.5 bg-success/10 text-success rounded-full text-sm">
                  Aktivna
                </span>
              </div>
              
              <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Sledeće plaćanje</p>
                  <p className="font-medium">15. januar 2025.</p>
                </div>
                <button className="text-sm text-muted hover:text-foreground">
                  Upravljaj pretplatom
                </button>
              </div>
            </div>

            {/* Quick search */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-medium mb-6">Pretraži kreatore</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Kategorija, ime, lokacija..."
                  className="flex-1 px-5 py-3 border border-border rounded-xl focus:outline-none focus:border-muted"
                />
                <Link
                  href="/kreatori"
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  Pretraži
                </Link>
              </div>
            </div>

            {/* Recent creators */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Nedavno pregledani</h2>
                <Link href="/kreatori" className="text-sm text-muted hover:text-foreground">
                  Vidi sve →
                </Link>
              </div>
              
              <div className="space-y-4">
                {mockCreators.slice(0, 3).map((creator) => (
                  <Link 
                    key={creator.id} 
                    href={`/kreator/${creator.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden relative flex-shrink-0">
                      <Image src={creator.photo} alt={creator.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{creator.name}</h3>
                      <p className="text-sm text-muted">{creator.categories.join(', ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€{creator.priceFrom}</p>
                      <p className="text-sm text-muted">{creator.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h3 className="font-medium mb-4">Tvoja aktivnost</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted">Pregledanih profila</span>
                  <span className="font-medium">34</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Kontaktiranih kreatora</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Sačuvanih kreatora</span>
                  <span className="font-medium">12</span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h3 className="font-medium mb-4">Brze akcije</h3>
              <div className="space-y-3">
                <Link 
                  href="/kreatori"
                  className="block w-full text-left px-4 py-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-sm"
                >
                  🔍 Pretraži kreatore
                </Link>
                <button className="block w-full text-left px-4 py-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-sm">
                  ❤️ Sačuvani kreatori
                </button>
                <button className="block w-full text-left px-4 py-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-sm">
                  ⚙️ Podešavanja naloga
                </button>
              </div>
            </div>

            {/* Support */}
            <div className="bg-primary text-white rounded-2xl p-6">
              <h3 className="font-medium mb-2">Treba ti pomoć?</h3>
              <p className="text-sm text-white/70 mb-4">
                Naš tim je tu da ti pomogne da pronađeš savršene kreatore.
              </p>
              <button className="w-full py-3 bg-white text-primary rounded-xl text-sm font-medium hover:bg-white/90 transition-colors">
                Kontaktiraj podršku
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

