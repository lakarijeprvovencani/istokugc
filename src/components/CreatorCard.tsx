'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { Creator } from '@/lib/mockData';
import { useDemo } from '@/context/DemoContext';

interface CreatorCardProps {
  creator: Creator;
  priority?: boolean; // For above-the-fold images
}

export default function CreatorCard({ creator, priority = false }: CreatorCardProps) {
  const { currentUser } = useDemo();
  const [showCategoriesTooltip, setShowCategoriesTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [platformTooltipPosition, setPlatformTooltipPosition] = useState({ top: 0, left: 0 });
  const badgeRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const platformRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({});
  // Admin and paid business can see contact info
  // Admin and business users can see contact info (all business users have active subscription)
  const canSeeContact = currentUser.type === 'admin' || currentUser.type === 'business';
  const isAdmin = currentUser.type === 'admin';
  
  // Use rating directly from the creator object (from Supabase)
  const averageRating = (creator as any).rating || 0;
  const totalReviews = (creator as any).totalReviews || 0;
  
  // Determine status for display
  const status = creator.status || (creator.approved ? 'approved' : 'pending');

  // Update tooltip position when it's shown
  useEffect(() => {
    if (showCategoriesTooltip && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 10, // Position above the badge
        left: rect.left,
      });
    }
  }, [showCategoriesTooltip]);

  // Update platform tooltip position when it's shown
  useEffect(() => {
    if (hoveredPlatform && platformRefs.current[hoveredPlatform]) {
      const rect = platformRefs.current[hoveredPlatform]!.getBoundingClientRect();
      setPlatformTooltipPosition({
        top: rect.top - 35, // Position above the icon
        left: rect.left + rect.width / 2, // Center horizontally
      });
    }
  }, [hoveredPlatform]);

  return (
    <div className="relative">
      <Link href={`/kreator/${creator.id}`}>
        <div className="group bg-white rounded-2xl overflow-hidden border border-border hover:border-muted/50 transition-all hover:shadow-lg">
        {/* Image */}
        <div className="aspect-[3/4] sm:aspect-[4/5] relative overflow-hidden bg-secondary">
          {creator.photo ? (
            <Image
              src={creator.photo}
              alt={creator.name || 'Kreator'}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-6xl font-light text-primary/40">
                {creator.name?.charAt(0) || '?'}
              </span>
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Status badge - only visible to admin */}
          {isAdmin && (
            <div className={`absolute top-2 sm:top-4 left-2 sm:left-4 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5 ${
              status === 'approved' 
                ? 'bg-black text-white' 
                : status === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${
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
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
            <span className="text-xs sm:text-sm font-medium">od €{creator.priceFrom}</span>
          </div>
          
          {/* Mobile platform icons - bottom right of image */}
          <div className="absolute bottom-2 right-2 sm:hidden flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-1 rounded-full">
            {creator.platforms.slice(0, 3).map((platform) => {
              const getMobilePlatformIcon = (platform: string) => {
                switch (platform) {
                  case 'Instagram':
                    return (
                      <svg key={platform} className="w-3.5 h-3.5 text-muted" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    );
                  case 'TikTok':
                    return (
                      <svg key={platform} className="w-3.5 h-3.5 text-muted" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
                    );
                  case 'YouTube':
                    return (
                      <svg key={platform} className="w-3.5 h-3.5 text-muted" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    );
                  default:
                    return null;
                }
              };
              return getMobilePlatformIcon(platform);
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-5">
          <h3 className="font-medium text-sm sm:text-lg mb-0.5 sm:mb-1 truncate">{creator.name}</h3>
          <p className="text-xs sm:text-sm text-muted mb-1.5 sm:mb-2 truncate">{creator.location}</p>
          
          {/* Rating */}
          {totalReviews > 0 && (
            <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    viewBox="0 0 24 24"
                    fill={star <= Math.round(averageRating) ? '#f59e0b' : 'none'}
                    stroke={star <= Math.round(averageRating) ? '#f59e0b' : '#e5e5e5'}
                    strokeWidth={2}
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                ))}
              </div>
              <span className="text-xs sm:text-sm font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-[10px] sm:text-xs text-muted">({totalReviews})</span>
            </div>
          )}
          
          {/* Categories */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-4 relative">
            {creator.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 bg-secondary rounded-full text-muted"
              >
                {category}
              </span>
            ))}
            {creator.categories.length > 2 && (
              <span 
                ref={badgeRef}
                className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 bg-secondary rounded-full text-muted cursor-pointer hover:bg-secondary/80 transition-colors relative z-[100]"
                onMouseEnter={() => setShowCategoriesTooltip(true)}
                onMouseLeave={() => setShowCategoriesTooltip(false)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCategoriesTooltip(!showCategoriesTooltip);
                }}
              >
                +{creator.categories.length - 2}
              </span>
            )}
          </div>

          {/* Platforms - hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-2 relative">
            {creator.platforms.map((platform) => {
              const getPlatformIcon = (platform: string) => {
                switch (platform) {
                  case 'Instagram':
                    return (
                      <svg className="w-5 h-5 text-muted hover:text-foreground transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    );
                  case 'TikTok':
                    return (
                      <svg className="w-5 h-5 text-muted hover:text-foreground transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
                    );
                  case 'YouTube':
                    return (
                      <svg className="w-5 h-5 text-muted hover:text-foreground transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    );
                  default:
                    return null;
                }
              };

              const icon = getPlatformIcon(platform);
              return icon ? (
                <span 
                  key={platform}
                  ref={(el) => { platformRefs.current[platform] = el; }}
                  className="relative cursor-pointer"
                  onMouseEnter={() => setHoveredPlatform(platform)}
                  onMouseLeave={() => setHoveredPlatform(null)}
                >
                  {icon}
                </span>
              ) : null;
            })}
          </div>

          {/* Contact info (only for admin and paid businesses) */}
          {canSeeContact && (
            <div className="hidden sm:block mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted truncate">
                📧 {creator.email}
              </p>
            </div>
          )}
        </div>
      </div>
      </Link>
      
      {/* Tooltip/Popup - Outside Link to avoid z-index issues */}
      {showCategoriesTooltip && creator.categories.length > 2 && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-[9998] sm:hidden"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCategoriesTooltip(false);
            }}
          />
          <div 
            ref={tooltipRef}
            className="fixed z-[9999] bg-foreground text-white rounded-lg p-3 shadow-2xl min-w-[200px] max-w-[280px] sm:max-w-none pointer-events-auto"
            style={{
              top: `${tooltipPosition.top - (tooltipRef.current?.offsetHeight || 0) - 8}px`,
              left: `${tooltipPosition.left}px`,
            }}
            onMouseEnter={() => setShowCategoriesTooltip(true)}
            onMouseLeave={() => setShowCategoriesTooltip(false)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-medium mb-2 text-white/90">Sve kategorije:</div>
            <div className="flex flex-wrap gap-1.5">
              {creator.categories.map((category) => (
                <span
                  key={category}
                  className="text-xs px-2 py-1 bg-white/20 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground"></div>
          </div>
        </>
      )}

      {/* Platform Tooltip */}
      {hoveredPlatform && (
        <div 
          className="fixed z-[9999] bg-foreground text-white rounded-lg px-3 py-1.5 shadow-xl pointer-events-none whitespace-nowrap"
          style={{
            top: `${platformTooltipPosition.top}px`,
            left: `${platformTooltipPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-xs font-medium">{hoveredPlatform}</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground"></div>
        </div>
      )}
    </div>
  );
}
