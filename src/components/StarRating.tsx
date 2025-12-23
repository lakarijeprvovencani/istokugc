'use client';

import { useState } from 'react';
import type { Rating } from '@/types/review';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: Rating) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const STAR_COLORS = {
  filled: '#f59e0b',    // Gold (warning color)
  empty: '#e5e5e5',     // Border color
  hover: '#fbbf24',     // Lighter gold for hover
};

const SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const TEXT_SIZES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export default function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 'md',
  showValue = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const handleClick = (value: number) => {
    if (!readonly && onChange) {
      onChange(value as Rating);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      <div 
        className={`flex ${readonly ? '' : 'cursor-pointer'}`}
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isHovered = !readonly && hoverRating > 0 && star <= hoverRating;
          
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              disabled={readonly}
              className={`${SIZES[size]} transition-transform ${
                readonly ? 'cursor-default' : 'hover:scale-110'
              } focus:outline-none disabled:cursor-default`}
              aria-label={`${star} zvezdica`}
            >
              <svg
                viewBox="0 0 24 24"
                fill={isFilled ? (isHovered ? STAR_COLORS.hover : STAR_COLORS.filled) : 'none'}
                stroke={isFilled ? (isHovered ? STAR_COLORS.hover : STAR_COLORS.filled) : STAR_COLORS.empty}
                strokeWidth={2}
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className={`${TEXT_SIZES[size]} font-medium text-foreground ml-2`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Komponenta za prikaz prosečne ocene sa brojem recenzija
interface AverageRatingProps {
  rating: number;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AverageRating({ rating, totalReviews, size = 'md' }: AverageRatingProps) {
  return (
    <div className="flex items-center gap-3">
      <StarRating rating={rating} readonly size={size} />
      <div className="flex items-center gap-2">
        <span className={`${TEXT_SIZES[size]} font-medium text-foreground`}>
          {rating > 0 ? rating.toFixed(1) : '0.0'}
        </span>
        <span className={`${TEXT_SIZES[size]} text-muted`}>
          ({totalReviews} {totalReviews === 1 ? 'recenzija' : totalReviews < 5 ? 'recenzije' : 'recenzija'})
        </span>
      </div>
    </div>
  );
}

// Komponenta za prikaz distribucije ocena
interface RatingDistributionProps {
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  totalReviews: number;
}

export function RatingDistribution({ distribution, totalReviews }: RatingDistributionProps) {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star as Rating];
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        
        return (
          <div key={star} className="flex items-center gap-3">
            <span className="text-sm text-muted w-3">{star}</span>
            <svg
              viewBox="0 0 24 24"
              fill={STAR_COLORS.filled}
              className="w-4 h-4"
            >
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: STAR_COLORS.filled,
                }}
              />
            </div>
            <span className="text-sm text-muted w-8 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

