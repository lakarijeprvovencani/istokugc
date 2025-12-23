'use client';

import { useState, useMemo } from 'react';
import ReviewCard from './ReviewCard';
import { AverageRating, RatingDistribution } from './StarRating';
import type { Review, ReviewStats } from '@/types/review';
import { generateReviewStats } from '@/types/review';

interface ReviewListProps {
  reviews: Review[];
  showStats?: boolean;               // Prikaži statistiku na vrhu
  showStatus?: boolean;              // Prikaži status badge (za admin)
  showActions?: boolean;             // Prikaži admin akcije
  canReply?: boolean;                // Da li kreator može odgovoriti
  canDeleteOwn?: boolean;            // Da li biznis može obrisati svoje recenzije
  currentBusinessId?: string;        // ID trenutnog biznis korisnika za proveru vlasništva
  emptyMessage?: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReply?: (id: string, reply: string) => void;
  getCreatorName?: (creatorId: string) => string; // Za admin prikaz
  getCreatorLink?: (creatorId: string) => string; // Link ka profilu kreatora
  pageSize?: number;
}

export default function ReviewList({
  reviews,
  showStats = true,
  showStatus = false,
  showActions = false,
  canReply = false,
  canDeleteOwn = false,
  currentBusinessId,
  emptyMessage = 'Još uvek nema recenzija.',
  onApprove,
  onReject,
  onDelete,
  onReply,
  getCreatorName,
  getCreatorLink,
  pageSize = 5,
}: ReviewListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Izračunaj statistiku samo za approved recenzije
  const stats: ReviewStats = useMemo(() => {
    return generateReviewStats(reviews);
  }, [reviews]);

  // Sortiraj recenzije
  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  }, [reviews, sortBy]);

  // Paginacija
  const totalPages = Math.ceil(sortedReviews.length / pageSize);
  const paginatedReviews = sortedReviews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📝</div>
        <p className="text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats section */}
      {showStats && stats.totalReviews > 0 && (
        <div className="bg-white border border-border rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Average rating */}
            <div>
              <h3 className="text-sm font-medium text-muted mb-4">Prosečna ocena</h3>
              <div className="flex items-center gap-6">
                <div className="text-5xl font-light">{stats.averageRating.toFixed(1)}</div>
                <div>
                  <AverageRating 
                    rating={stats.averageRating} 
                    totalReviews={stats.totalReviews}
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* Distribution */}
            <div>
              <h3 className="text-sm font-medium text-muted mb-4">Distribucija ocena</h3>
              <RatingDistribution 
                distribution={stats.ratingDistribution}
                totalReviews={stats.totalReviews}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sort controls */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          {reviews.length} {reviews.length === 1 ? 'recenzija' : reviews.length < 5 ? 'recenzije' : 'recenzija'}
        </span>
        
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as typeof sortBy);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
        >
          <option value="newest">Najnovije</option>
          <option value="oldest">Najstarije</option>
          <option value="highest">Najviša ocena</option>
          <option value="lowest">Najniža ocena</option>
        </select>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {paginatedReviews.map((review) => {
          // Check if current business owns this review
          const isOwnReview = canDeleteOwn && currentBusinessId && review.businessId === currentBusinessId;
          
          return (
            <ReviewCard
              key={review.id}
              review={review}
              showStatus={showStatus}
              showActions={showActions}
              canReply={canReply}
              canDelete={isOwnReview}
              onApprove={onApprove}
              onReject={onReject}
              onDelete={onDelete}
              onReply={onReply}
              creatorName={getCreatorName ? getCreatorName(review.creatorId) : undefined}
              creatorLink={getCreatorLink ? getCreatorLink(review.creatorId) : undefined}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Prethodna
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-primary text-white'
                    : 'hover:bg-secondary'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sledeća →
          </button>
        </div>
      )}
    </div>
  );
}

// Kompaktna verzija za sidebar ili manje prostore
interface ReviewListCompactProps {
  reviews: Review[];
  maxItems?: number;
  onViewAll?: () => void;
}

export function ReviewListCompact({ reviews, maxItems = 3, onViewAll }: ReviewListCompactProps) {
  const displayedReviews = reviews.slice(0, maxItems);
  const stats = generateReviewStats(reviews);

  if (reviews.length === 0) {
    return (
      <div className="text-center py-6 text-muted text-sm">
        Nema recenzija
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mini stats */}
      <div className="flex items-center justify-between">
        <AverageRating 
          rating={stats.averageRating} 
          totalReviews={stats.totalReviews}
          size="sm"
        />
      </div>

      {/* Recent reviews */}
      <div className="space-y-3">
        {displayedReviews.map((review) => (
          <div key={review.id} className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{review.businessName}</span>
              <span className="text-warning">{'★'.repeat(review.rating)}</span>
            </div>
            <p className="text-muted line-clamp-2">{review.comment}</p>
          </div>
        ))}
      </div>

      {/* View all link */}
      {reviews.length > maxItems && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full py-2 text-sm text-primary hover:underline"
        >
          Pogledaj sve recenzije ({reviews.length})
        </button>
      )}
    </div>
  );
}

