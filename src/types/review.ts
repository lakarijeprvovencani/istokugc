/**
 * Review Types
 * 
 * Tipovi za sistem recenzija.
 * Biznis korisnici mogu ostaviti recenziju kreatorima (1-5 zvezdica + komentar).
 * Recenzije čekaju odobrenje admina pre nego što postanu javne.
 * Kreatori mogu odgovoriti na recenzije.
 */

// Status recenzije
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

// Ocena (1-5 zvezdica)
export type Rating = 1 | 2 | 3 | 4 | 5;

// Osnovna recenzija
export interface Review {
  id: string;
  creatorId: string;           // ID kreatora koji prima recenziju
  businessId: string;          // ID biznisa koji je ostavio recenziju
  businessName: string;        // Ime biznisa (za prikaz)
  rating: Rating;              // Ocena 1-5
  comment: string;             // Komentar (min 50 karaktera)
  status: ReviewStatus;        // Status odobrenja
  creatorReply?: string;       // Odgovor kreatora
  creatorReplyAt?: string;     // Kada je kreator odgovorio
  rejectionReason?: string;    // Razlog odbijanja (admin)
  createdAt: string;
  updatedAt?: string;
}

// Input za kreiranje recenzije
export interface CreateReviewInput {
  creatorId: string;
  rating: Rating;
  comment: string;             // Min 50 karaktera
}

// Input za ažuriranje recenzije
export interface UpdateReviewInput {
  rating?: Rating;
  comment?: string;
}

// Input za odgovor kreatora
export interface ReplyToReviewInput {
  reply: string;
}

// Input za odbijanje recenzije (admin)
export interface RejectReviewInput {
  reason?: string;
}

// Statistika recenzija za kreatora
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// API Response types
export interface ReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
  totalCount: number;
  page?: number;
  pageSize?: number;
}

export interface SingleReviewResponse {
  review: Review;
}

// Filter za dohvatanje recenzija
export interface ReviewFilters {
  creatorId?: string;
  businessId?: string;
  status?: ReviewStatus;
  minRating?: Rating;
  maxRating?: Rating;
  page?: number;
  pageSize?: number;
}

// Helper functions
export const MIN_COMMENT_LENGTH = 50;
export const MAX_COMMENT_LENGTH = 1000;
export const MAX_REPLY_LENGTH = 500;

/**
 * Validira dužinu komentara
 */
export function isValidComment(comment: string): boolean {
  const trimmed = comment.trim();
  return trimmed.length >= MIN_COMMENT_LENGTH && trimmed.length <= MAX_COMMENT_LENGTH;
}

/**
 * Validira dužinu odgovora
 */
export function isValidReply(reply: string): boolean {
  const trimmed = reply.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_REPLY_LENGTH;
}

/**
 * Formatira status recenzije za prikaz
 */
export function formatReviewStatus(status: ReviewStatus): string {
  const statusMap: Record<ReviewStatus, string> = {
    pending: 'Na čekanju',
    approved: 'Odobrena',
    rejected: 'Odbijena',
  };
  return statusMap[status];
}

/**
 * Vraća CSS klasu za status badge
 */
export function getReviewStatusColor(status: ReviewStatus): string {
  const colorMap: Record<ReviewStatus, string> = {
    pending: 'bg-gray-100 text-gray-700',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-error/10 text-error',
  };
  return colorMap[status];
}

/**
 * Računa prosečnu ocenu
 */
export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10; // Zaokruži na 1 decimalu
}

/**
 * Računa distribuciju ocena
 */
export function calculateRatingDistribution(reviews: Review[]): ReviewStats['ratingDistribution'] {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    distribution[review.rating]++;
  });
  return distribution;
}

/**
 * Generiše statistiku recenzija
 */
export function generateReviewStats(reviews: Review[]): ReviewStats {
  const approvedReviews = reviews.filter(r => r.status === 'approved');
  return {
    totalReviews: approvedReviews.length,
    averageRating: calculateAverageRating(approvedReviews),
    ratingDistribution: calculateRatingDistribution(approvedReviews),
  };
}


