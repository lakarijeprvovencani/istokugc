'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Creator } from '@/lib/mockData';
import { useDemo } from '@/context/DemoContext';

interface CreatorCardProps {
  creator: Creator;
}

export default function CreatorCard({ creator }: CreatorCardProps) {
  const { currentUser } = useDemo();
  // Admin and paid business can see contact info
  const canSeeContact = currentUser.type === 'admin' || (currentUser.type === 'business' && currentUser.isPaid);
  const isAdmin = currentUser.type === 'admin';
  
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
          <p className="text-sm text-muted mb-3">{creator.location}</p>
          
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
              <span key={platform} className="flex items-center gap-1">
                {platform === 'TikTok' && '📱'}
                {platform === 'Instagram' && '📸'}
                {platform === 'YouTube' && '🎬'}
                {platform === 'Twitter/X' && '🐦'}
                {platform === 'LinkedIn' && '💼'}
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
