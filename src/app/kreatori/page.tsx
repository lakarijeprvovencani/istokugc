'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { categories, platforms, languages } from '@/lib/mockData';
import CreatorCard from '@/components/CreatorCard';
import { useDemo } from '@/context/DemoContext';
import { generateReviewStats } from '@/types/review';

export default function KreatoriPage() {
  const { currentUser, isLoggedIn, getCreators, getReviewsForCreator, getOwnCreatorStatus } = useDemo();
  
  // Get creator status for pending check
  const creatorStatus = getOwnCreatorStatus();
  
  // Get creators from context (filtered by status for non-admins)
  const allCreators = getCreators(currentUser.type === 'admin');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(true); // Visible by default on desktop
  
  // Hide filters on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setShowFilters(false);
      }
    };
    // Check on mount
    handleResize();
  }, []);
  
  // Helper to get creator rating
  const getCreatorRating = (creatorId: string): number => {
    const reviews = getReviewsForCreator(creatorId, true);
    const stats = generateReviewStats(reviews);
    return stats.averageRating;
  };
  
  const getCreatorReviewCount = (creatorId: string): number => {
    const reviews = getReviewsForCreator(creatorId, true);
    return reviews.length;
  };

  const filteredCreators = useMemo(() => {
    let results = allCreators.filter((creator) => {
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
      
      // Filter by minimum rating
      if (minRating) {
        const creatorRating = getCreatorRating(creator.id);
        const minRatingNum = parseFloat(minRating);
        if (creatorRating < minRatingNum) return false;
      }

      return true;
    });
    
    // Sort results
    if (sortBy === 'rating-desc') {
      results.sort((a, b) => getCreatorRating(b.id) - getCreatorRating(a.id));
    } else if (sortBy === 'rating-asc') {
      results.sort((a, b) => getCreatorRating(a.id) - getCreatorRating(b.id));
    } else if (sortBy === 'reviews') {
      results.sort((a, b) => getCreatorReviewCount(b.id) - getCreatorReviewCount(a.id));
    } else if (sortBy === 'price-asc') {
      results.sort((a, b) => a.priceFrom - b.priceFrom);
    } else if (sortBy === 'price-desc') {
      results.sort((a, b) => b.priceFrom - a.priceFrom);
    }
    
    return results;
  }, [allCreators, currentUser.type, selectedCategory, selectedPlatform, selectedLanguage, priceRange, searchQuery, minRating, sortBy, getCreatorRating, getCreatorReviewCount]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedPlatform('');
    setSelectedLanguage('');
    setPriceRange('');
    setSearchQuery('');
    setMinRating('');
    setSortBy('');
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

  // Check if this is demo creator (ID "1" - Marija Petrović)
  // Demo creators bypass pending/rejected checks for client presentations
  const isDemoCreator = currentUser.creatorId === '1';

  // If creator is pending or rejected, redirect to dashboard (they'll see proper screen there)
  // Skip this check for demo creators
  if (currentUser.type === 'creator' && creatorStatus && !isDemoCreator) {
    if (creatorStatus.status === 'pending' || creatorStatus.status === 'rejected') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary/30">
          <div className="max-w-md mx-auto px-6 text-center">
            <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
              <div className="text-5xl mb-6">⏳</div>
              <h1 className="text-2xl font-light mb-3">Profil na čekanju</h1>
              <p className="text-muted mb-8">
                Vaš profil još uvek nije odobren. Dok čekate odobrenje, ne možete pregledati druge kreatore.
              </p>
              <Link 
                href="/dashboard"
                className="block w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Nazad na dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-secondary py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-2 sm:mb-4">Pretraži kreatore</h1>
          <p className="text-muted text-sm sm:text-base max-w-xl">
            Pronađi savršenog UGC kreatora za tvoj brend
          </p>
        </div>
      </section>

      <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        <div className="lg:flex lg:gap-12">
          {/* Filter toggle - visible on all screens */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full lg:w-auto mb-6 py-3 px-5 bg-white border border-border rounded-xl flex items-center justify-center gap-2 text-sm font-medium hover:bg-secondary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? 'Sakrij filtere' : 'Prikaži filtere'}
          </button>
          
          {/* Sidebar filters */}
          <aside className={`
            ${showFilters ? 'block' : 'hidden'} 
            w-full lg:w-64 
            flex-shrink-0 
            mb-8 lg:mb-0
            transition-all duration-300
          `}>
            <div className="w-full lg:w-64 lg:sticky lg:top-28 bg-white lg:bg-transparent p-4 lg:p-0 rounded-2xl lg:rounded-none border lg:border-0 border-border">
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

              {/* Rating Filter */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-2 block">Minimalna ocena</label>
                <div className="relative">
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted bg-white appearance-none"
                  >
                    <option value="">Sve ocene</option>
                    <option value="5">5.0 ⭐</option>
                    <option value="4.5">4.5+ ⭐</option>
                    <option value="4">4.0+ ⭐</option>
                    <option value="3.5">3.5+ ⭐</option>
                    <option value="3">3.0+ ⭐</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {/* Rating preview with stars */}
                {minRating && (
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        viewBox="0 0 24 24"
                        fill={star <= parseFloat(minRating) ? '#f59e0b' : 'none'}
                        stroke={star <= parseFloat(minRating) ? '#f59e0b' : '#e5e5e5'}
                        strokeWidth={2}
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                    ))}
                    <span className="text-sm text-muted ml-1">{minRating}+</span>
                  </div>
                )}
              </div>

              {/* Clear filters */}
              <button
                onClick={clearFilters}
                className="w-full py-3 text-sm text-muted hover:text-foreground border border-border rounded-xl hover:bg-secondary transition-colors"
              >
                Očisti filtere
              </button>
              
              {/* Hide filters button - mobile only */}
              <button
                onClick={() => setShowFilters(false)}
                className="lg:hidden w-full mt-4 py-3 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
              >
                Primeni filtere
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Results count & sorting */}
            <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-muted text-sm sm:text-base">
                Prikazano <span className="font-medium text-foreground">{filteredCreators.length}</span> kreatora
              </p>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:border-muted bg-white text-sm"
              >
                <option value="">Sortiraj po</option>
                <option value="rating-desc">Najviša ocena</option>
                <option value="rating-asc">Najniža ocena</option>
                <option value="reviews">Najviše recenzija</option>
                <option value="price-asc">Cena: niska → visoka</option>
                <option value="price-desc">Cena: visoka → niska</option>
              </select>
            </div>

            {/* Grid */}
            {filteredCreators.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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
