'use client';

import { useState, useEffect } from 'react';
import { useDemo } from '@/context/DemoContext';
import Link from 'next/link';
import ReviewCard from '@/components/ReviewCard';

interface Review {
  id: string;
  creatorId: string;
  businessId: string;
  businessName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  creatorReply?: string;
  creatorReplyAt?: string;
  createdAt: string;
}

interface Creator {
  id: string;
  name: string;
}

export default function BusinessReviewsPage() {
  const { currentUser, isHydrated } = useDemo();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [creators, setCreators] = useState<Record<string, Creator>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Fetch reviews from Supabase
  useEffect(() => {
    const fetchReviews = async () => {
      if (!isHydrated || currentUser.type !== 'business' || !currentUser.businessId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch reviews for this business
        const response = await fetch(`/api/reviews?businessId=${currentUser.businessId}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
          
          // Fetch creator names for each unique creatorId
          const creatorIds = [...new Set((data.reviews || []).map((r: Review) => r.creatorId))];
          const creatorsMap: Record<string, Creator> = {};
          
          for (const creatorId of creatorIds) {
            try {
              const creatorRes = await fetch(`/api/creators/${creatorId}`);
              if (creatorRes.ok) {
                const creatorData = await creatorRes.json();
                creatorsMap[creatorId as string] = {
                  id: creatorId as string,
                  name: creatorData.creator?.name || 'Nepoznat kreator',
                };
              }
            } catch (err) {
              console.error('Error fetching creator:', err);
            }
          }
          
          setCreators(creatorsMap);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [isHydrated, currentUser.type, currentUser.businessId]);

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  // Handle review delete
  const handleDeleteReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews?reviewId=${reviewId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        setShowDeleteSuccess(true);
        setTimeout(() => setShowDeleteSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  // Get creator name helper
  const getCreatorName = (creatorId: string): string => {
    return creators[creatorId]?.name || 'Nepoznat kreator';
  };
  
  // Get creator link helper
  const getCreatorLink = (creatorId: string): string => {
    return `/kreator/${creatorId}`;
  };

  // Loading state
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (currentUser.type !== 'business') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
            <div className="text-5xl mb-6">🔒</div>
            <h1 className="text-2xl font-light mb-3">Pristup ograničen</h1>
            <p className="text-muted mb-8">
              Ova stranica je dostupna samo za biznis korisnike.
            </p>
            <Link 
              href="/dashboard"
              className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
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
      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="text-sm text-muted hover:text-foreground mb-4 inline-flex items-center gap-1"
          >
            ← Nazad na dashboard
          </Link>
          <h1 className="text-3xl font-light mb-2">Moje recenzije</h1>
          <p className="text-muted">Pregledaj i upravljaj recenzijama koje si ostavio kreatorima</p>
        </div>

        {/* Delete success message */}
        {showDeleteSuccess && (
          <div className="mb-6 bg-success/10 text-success rounded-xl p-4 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <p className="text-sm font-medium">Recenzija je uspešno obrisana.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-border text-center">
            <div className="text-2xl font-light mb-1">{reviews.length}</div>
            <div className="text-sm text-muted">Ukupno recenzija</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-border text-center">
            <div className="text-2xl font-light mb-1">
              {reviews.filter(r => r.status === 'approved').length}
            </div>
            <div className="text-sm text-muted">Odobrenih</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-border text-center">
            <div className="text-2xl font-light mb-1">
              {reviews.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-sm text-muted">Na čekanju</div>
          </div>
        </div>

        {/* Sort controls */}
        {reviews.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted">
              {reviews.length} {reviews.length === 1 ? 'recenzija' : reviews.length < 5 ? 'recenzije' : 'recenzija'}
            </span>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
            >
              <option value="newest">Najnovije</option>
              <option value="oldest">Najstarije</option>
              <option value="highest">Najviša ocena</option>
              <option value="lowest">Najniža ocena</option>
            </select>
          </div>
        )}

        {/* Reviews list */}
        {sortedReviews.length > 0 ? (
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review as any}
                showStatus={true}
                canDelete={true}
                onDelete={handleDeleteReview}
                creatorName={getCreatorName(review.creatorId)}
                creatorLink={getCreatorLink(review.creatorId)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-border">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-lg font-medium mb-2">Još uvek nemaš recenzija</h3>
            <p className="text-muted mb-6">
              Kada ostaviš recenziju nekom kreatoru, ona će se pojaviti ovde.
            </p>
            <Link 
              href="/kreatori"
              className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Pretraži kreatore
            </Link>
          </div>
        )}

        {/* Info notice */}
        <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-primary text-lg">ℹ️</span>
            <div className="text-sm text-muted">
              <p className="font-medium text-foreground mb-1">O recenzijama</p>
              <ul className="space-y-1">
                <li>• Nove recenzije moraju biti odobrene od strane administratora pre nego što budu vidljive javno.</li>
                <li>• Možeš ostaviti samo jednu recenziju po kreatoru.</li>
                <li>• Brisanje recenzije je trajno i ne može se poništiti.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
