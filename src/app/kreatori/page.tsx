'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { categories, platforms, languages } from '@/lib/mockData';
import CreatorCard from '@/components/CreatorCard';
import { useDemo } from '@/context/DemoContext';

export default function KreatoriPage() {
  const { currentUser, isLoggedIn, getCreators } = useDemo();
  
  // Get creators from context (filtered by status for non-admins)
  const allCreators = getCreators(currentUser.type === 'admin');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Check if user needs to pay (business without subscription)
  const needsToPay = currentUser.type === 'business' && !currentUser.isPaid;

  const filteredCreators = useMemo(() => {
    return allCreators.filter((creator) => {
      // For admins, show all (already filtered in getCreators)
      // For others, only show approved (already handled in getCreators)
      if (currentUser.type !== 'admin' && !creator.approved) return false;
      
      if (selectedCategory && !creator.categories.includes(selectedCategory)) return false;
      if (selectedPlatform && !creator.platforms.includes(selectedPlatform)) return false;
      if (selectedLanguage && !creator.languages.includes(selectedLanguage)) return false;
      
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        if (max) {
          if (creator.priceFrom < min || creator.priceFrom > max) return false;
        } else {
          if (creator.priceFrom < min) return false;
        }
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !creator.name.toLowerCase().includes(query) &&
          !creator.bio.toLowerCase().includes(query) &&
          !creator.location.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allCreators, currentUser.type, selectedCategory, selectedPlatform, selectedLanguage, priceRange, searchQuery]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedPlatform('');
    setSelectedLanguage('');
    setPriceRange('');
    setSearchQuery('');
  };

  // If not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
            <div className="text-5xl mb-6">🔒</div>
            <h1 className="text-2xl font-light mb-3">Pristup ograničen</h1>
            <p className="text-muted mb-8">
              Da bi pregledao kreatore, potrebno je da imaš nalog na platformi.
            </p>
            <div className="space-y-3">
              <Link 
                href="/login"
                className="block w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Prijavi se
              </Link>
              <Link 
                href="/register/biznis"
                className="block w-full py-4 border border-border rounded-xl font-medium hover:bg-secondary transition-colors"
              >
                Registruj se kao brend
              </Link>
              <Link 
                href="/register/kreator"
                className="block w-full py-3 text-sm text-muted hover:text-foreground transition-colors"
              >
                Ili postani kreator →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-secondary py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h1 className="text-4xl lg:text-5xl font-light mb-4">Pretraži kreatore</h1>
          <p className="text-muted max-w-xl">
            Pronađi savršenog UGC kreatora za tvoj brend među stotinama talenata
          </p>
        </div>
      </section>

      {/* Paywall notice for unpaid businesses */}
      {needsToPay && (
        <div className="bg-warning/10 border-b border-warning/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                ⚠️ Možeš pregledati kreatore, ali za kontakt informacije je potrebna pretplata.
              </p>
              <Link 
                href="/dashboard"
                className="text-sm font-medium text-warning hover:underline"
              >
                Aktiviraj pretplatu →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="lg:flex gap-12">
          {/* Sidebar filters */}
          <aside className="lg:w-64 flex-shrink-0 mb-8 lg:mb-0">
            <div className="sticky top-28">
              {/* Search */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-2 block">Pretraga</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ime, lokacija..."
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted"
                />
              </div>

              {/* Category */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-2 block">Kategorija</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted bg-white"
                >
                  <option value="">Sve kategorije</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Platform */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-2 block">Platforma</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted bg-white"
                >
                  <option value="">Sve platforme</option>
                  {platforms.map((plat) => (
                    <option key={plat} value={plat}>{plat}</option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-2 block">Jezik</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted bg-white"
                >
                  <option value="">Svi jezici</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-2 block">Cenovni rang</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted bg-white"
                >
                  <option value="">Svi cenovni rangovi</option>
                  <option value="0-100">Do €100</option>
                  <option value="100-200">€100 - €200</option>
                  <option value="200-300">€200 - €300</option>
                  <option value="300-">€300+</option>
                </select>
              </div>

              {/* Clear filters */}
              <button
                onClick={clearFilters}
                className="w-full py-3 text-sm text-muted hover:text-foreground border border-border rounded-xl hover:bg-secondary transition-colors"
              >
                Očisti filtere
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {/* Results count */}
            <div className="mb-8 flex items-center justify-between">
              <p className="text-muted">
                Prikazano <span className="font-medium text-foreground">{filteredCreators.length}</span> kreatora
              </p>
            </div>

            {/* Grid */}
            {filteredCreators.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCreators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-medium mb-2">Nema rezultata</h3>
                <p className="text-muted mb-6">Pokušaj sa drugim filterima</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-primary text-white rounded-full text-sm hover:bg-primary/90 transition-colors"
                >
                  Očisti filtere
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
