'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Creator } from '@/lib/mockData';
import { useDemo } from '@/context/DemoContext';
import { generateReviewStats } from '@/types/review';

interface CreatorCardProps {
  creator: Creator;
}

export default function CreatorCard({ creator }: CreatorCardProps) {
  const { currentUser, getReviewsForCreator } = useDemo();
  // Admin and paid business can see contact info
  // Admin and business users can see contact info (all business users have active subscription)
  const canSeeContact = currentUser.type === 'admin' || currentUser.type === 'business';
  const isAdmin = currentUser.type === 'admin';
  
  // Get reviews and stats for this creator
  const reviews = getReviewsForCreator(creator.id, true);
  const stats = generateReviewStats(reviews);
  
  // Determine status for display
  const status = creator.status || (creator.approved ? 'approved' : 'pending');

  return (
    <Link href={`/kreator/${creator.id}`}>
      <div className="group bg-white rounded-2xl overflow-hidden border border-border hover:border-muted/50 transition-all hover:shadow-lg">
        {/* Image */}
        <div className="aspect-[4/5] relative overflow-hidden">
          <Image
            src={creator.photo}
            alt={creator.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Status badge - only visible to admin */}
          {isAdmin && (
            <div className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
              status === 'approved' 
                ? 'bg-black text-white' 
                : status === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                status === 'approved' ? 'bg-green-400' :
                status === 'pending' ? 'bg-amber-500' :
                'bg-red-500'
              }`}></span>
              {status === 'approved' && 'Aktivan'}
              {status === 'pending' && 'Na čekanju'}
              {status === 'deactivated' && 'Neaktivan'}
            </div>
          )}
          
          {/* Price badge */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-sm font-medium">od €{creator.priceFrom}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-medium text-lg mb-1">{creator.name}</h3>
          <p className="text-sm text-muted mb-2">{creator.location}</p>
          
          {/* Rating */}
          {stats.totalReviews > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    viewBox="0 0 24 24"
                    fill={star <= Math.round(stats.averageRating) ? '#f59e0b' : 'none'}
                    stroke={star <= Math.round(stats.averageRating) ? '#f59e0b' : '#e5e5e5'}
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
              </div>
              <span className="text-sm font-medium">{stats.averageRating.toFixed(1)}</span>
              <span className="text-xs text-muted">({stats.totalReviews})</span>
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
            {creator.categories.length > 2 && (
              <span className="text-xs px-3 py-1 bg-secondary rounded-full text-muted">
                +{creator.categories.length - 2}
              </span>
            )}
          </div>

          {/* Platforms */}
          <div className="flex items-center gap-2 text-xs text-muted">
            {creator.platforms.map((platform) => (
              <span key={platform}>
                {platform}
              </span>
            ))}
          </div>

          {/* Contact info (only for admin and paid businesses) */}
          {canSeeContact && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted">
                📧 {creator.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
