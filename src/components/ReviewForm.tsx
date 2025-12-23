'use client';

import { useState } from 'react';
import StarRating from './StarRating';
import type { Rating, CreateReviewInput } from '@/types/review';
import { MIN_COMMENT_LENGTH, MAX_COMMENT_LENGTH, isValidComment } from '@/types/review';

interface ReviewFormProps {
  creatorId: string;
  creatorName: string;
  onSubmit: (data: CreateReviewInput) => void;
  onCancel?: () => void;
  existingReview?: {
    rating: Rating;
    comment: string;
  };
  isSubmitting?: boolean;
}

export default function ReviewForm({
  creatorId,
  creatorName,
  onSubmit,
  onCancel,
  existingReview,
  isSubmitting = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState<Rating>(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!existingReview;
  const commentLength = comment.length;
  const isCommentValid = isValidComment(comment);
  const canSubmit = rating > 0 && isCommentValid && !isSubmitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      if (commentLength < MIN_COMMENT_LENGTH) {
        setError(`Komentar mora imati najmanje ${MIN_COMMENT_LENGTH} karaktera.`);
      }
      return;
    }

    setError(null);
    onSubmit({
      creatorId,
      rating,
      comment: comment.trim(),
    });
  };

  const getCharacterCountColor = () => {
    if (commentLength < MIN_COMMENT_LENGTH) {
      return 'text-error';
    }
    if (commentLength > MAX_COMMENT_LENGTH * 0.9) {
      return 'text-warning';
    }
    return 'text-muted';
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <h3 className="text-lg font-medium mb-1">
        {isEditing ? 'Izmeni recenziju' : 'Oceni kreatora'}
      </h3>
      <p className="text-sm text-muted mb-6">
        {isEditing 
          ? `Izmeni svoju recenziju za ${creatorName}`
          : `Podeli svoje iskustvo sa ${creatorName}`
        }
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-3">Ocena</label>
          <div className="flex items-center gap-4">
            <StarRating
              rating={rating}
              onChange={setRating}
              size="lg"
            />
            <span className="text-lg font-medium">{rating}/5</span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Komentar <span className="text-muted font-normal">(obavezno)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Opišite svoje iskustvo saradnje sa ovim kreatorom. Šta vam se dopalo? Da li biste preporučili drugima?"
            maxLength={MAX_COMMENT_LENGTH}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors resize-none ${
              error 
                ? 'border-error focus:border-error' 
                : 'border-border focus:border-primary'
            }`}
            rows={5}
          />
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-muted">
              Minimum {MIN_COMMENT_LENGTH} karaktera
            </div>
            <div className={`text-xs ${getCharacterCountColor()}`}>
              {commentLength}/{MAX_COMMENT_LENGTH}
              {commentLength < MIN_COMMENT_LENGTH && (
                <span className="ml-1">(još {MIN_COMMENT_LENGTH - commentLength})</span>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-error mt-2">{error}</p>
          )}
        </div>

        {/* Info notice */}
        <div className="bg-secondary/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-muted mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <p className="text-sm text-muted">
              Vaša recenzija će biti vidljiva nakon odobrenja od strane administratora. 
              Molimo vas da budete konstruktivni i poštujete pravila platforme.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border border-border rounded-xl font-medium hover:bg-secondary transition-colors"
            >
              Otkaži
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex-1 py-3 bg-primary text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              canSubmit 
                ? 'hover:bg-primary/90' 
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Slanje...
              </>
            ) : (
              isEditing ? 'Sačuvaj izmene' : 'Pošalji recenziju'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Jednostavnija inline forma za brži unos
interface InlineReviewFormProps {
  onSubmit: (rating: Rating, comment: string) => void;
  isSubmitting?: boolean;
}

export function InlineReviewForm({ onSubmit, isSubmitting = false }: InlineReviewFormProps) {
  const [rating, setRating] = useState<Rating>(5);
  const [comment, setComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const commentLength = comment.length;
  const isCommentValid = isValidComment(comment);
  const canSubmit = rating > 0 && isCommentValid && !isSubmitting;

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit(rating, comment.trim());
      setComment('');
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full py-4 border border-dashed border-border rounded-xl text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Ostavi recenziju
      </button>
    );
  }

  return (
    <div className="border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <StarRating rating={rating} onChange={setRating} size="md" />
        <button
          onClick={() => setIsExpanded(false)}
          className="text-muted hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Napišite vašu recenziju..."
        maxLength={MAX_COMMENT_LENGTH}
        className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors text-sm resize-none"
        rows={3}
      />

      <div className="flex items-center justify-between">
        <span className={`text-xs ${commentLength < MIN_COMMENT_LENGTH ? 'text-error' : 'text-muted'}`}>
          {commentLength}/{MIN_COMMENT_LENGTH} min
        </span>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium transition-colors ${
            canSubmit ? 'hover:bg-primary/90' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Slanje...' : 'Pošalji'}
        </button>
      </div>
    </div>
  );
}

