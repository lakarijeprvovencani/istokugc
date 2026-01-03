'use client';

import { useState, useEffect } from 'react';
import { useDemo } from '@/context/DemoContext';
import Link from 'next/link';
import Image from 'next/image';
import { AverageRating } from '@/components/StarRating';

interface SavedCreator {
  id: string;
  name: string;
  photo: string;
  location: string;
  categories: string[];
  priceFrom: number;
  rating: number;
  totalReviews: number;
  savedAt: string;
}

export default function FavoritesPage() {
  const { currentUser, isHydrated } = useDemo();
  const [favorites, setFavorites] = useState<SavedCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch favorites from Supabase
  useEffect(() => {
    const fetchFavorites = async () => {
      if (currentUser.type !== 'business' || !currentUser.businessId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/favorites?businessId=${currentUser.businessId}`);
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favorites || []);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isHydrated) {
      fetchFavorites();
    }
  }, [currentUser.type, currentUser.businessId, isHydrated]);

  // Remove from favorites
  const handleRemoveFavorite = async (creatorId: string) => {
    try {
      const res = await fetch(
        `/api/favorites?businessId=${currentUser.businessId}&creatorId=${creatorId}`,
        { method: 'DELETE' }
      );
      
      if (res.ok) {
        setFavorites(prev => prev.filter(c => c.id !== creatorId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Loading state
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Učitavanje...</p>
        </div>
      </div>
    );
  }

  // Only business users can have favorites
  if (currentUser.type !== 'business') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
            <div className="text-5xl mb-6">🔒</div>
            <h1 className="text-2xl font-light mb-3">Pristup ograničen</h1>
            <p className="text-muted mb-8">
              Samo biznis korisnici mogu pristupiti sačuvanim kreatorima.
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

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-sm text-muted hover:text-foreground mb-2 block">
              ← Nazad na dashboard
            </Link>
            <h1 className="text-3xl font-light">Sačuvani kreatori</h1>
            <p className="text-muted mt-1">
              {favorites.length} {favorites.length === 1 ? 'kreator' : 'kreatora'} u tvojoj listi
            </p>
          </div>
          <Link
            href="/kreatori"
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Pretraži kreatore
          </Link>
        </div>

        {/* Favorites grid */}
        {favorites.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((creator) => (
              <div 
                key={creator.id}
                className="bg-white rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <Link href={`/kreator/${creator.id}`}>
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                      src={creator.photo || '/placeholder-avatar.jpg'}
                      alt={creator.name}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                      unoptimized={creator.photo?.startsWith('data:')}
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <span className="text-sm font-medium">od €{creator.priceFrom}</span>
                    </div>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-5">
                  <Link href={`/kreator/${creator.id}`}>
                    <h3 className="font-medium text-lg mb-1 hover:text-primary transition-colors">
                      {creator.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted mb-3">{creator.location}</p>
                  
                  {/* Rating */}
                  {creator.totalReviews > 0 && (
                    <div className="mb-3">
                      <AverageRating 
                        rating={creator.rating} 
                        totalReviews={creator.totalReviews}
                        size="sm"
                      />
                    </div>
                  )}
                  
                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {creator.categories.slice(0, 2).map((category) => (
                      <span
                        key={category}
                        className="text-xs px-3 py-1 bg-secondary rounded-full text-muted"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  {/* Remove button */}
                  <div className="pt-4 border-t border-border flex items-center justify-end">
                    <button
                      onClick={() => handleRemoveFavorite(creator.id)}
                      className="text-sm text-muted hover:text-error transition-colors flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-error">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                      Ukloni
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-border">
            <div className="text-6xl mb-6">💔</div>
            <h2 className="text-2xl font-light mb-3">Nemaš sačuvane kreatore</h2>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Kada pronađeš kreatore koji ti se dopadaju, klikni na srce da ih sačuvaš ovde.
            </p>
            <Link
              href="/kreatori"
              className="inline-block px-8 py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Pretraži kreatore
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
