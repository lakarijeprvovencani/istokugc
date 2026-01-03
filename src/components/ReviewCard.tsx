'use client';

import { useState } from 'react';
import StarRating from './StarRating';
import type { Review, ReviewStatus } from '@/types/review';
import { formatReviewStatus, getReviewStatusColor, MAX_REPLY_LENGTH } from '@/types/review';

interface ReviewCardProps {
  review: Review;
  showStatus?: boolean;          // Prikaži status badge (za admin)
  showActions?: boolean;         // Prikaži approve/reject dugmad (za admin)
  canReply?: boolean;            // Može li kreator odgovoriti
  canDelete?: boolean;           // Može li korisnik obrisati svoju recenziju (biznis)
  canEditReply?: boolean;        // Može li kreator urediti svoj odgovor
  canDeleteReply?: boolean;      // Može li kreator obrisati svoj odgovor
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReply?: (id: string, reply: string) => Promise<boolean> | void;
  onEditReply?: (id: string, reply: string) => Promise<boolean> | void;
  onDeleteReply?: (id: string) => Promise<boolean> | void;
  creatorName?: string;          // Za admin prikaz - ime kreatora
  creatorLink?: string;          // Link ka kreatoru (za biznis prikaz)
}

export default function ReviewCard({
  review,
  showStatus = false,
  showActions = false,
  canReply = false,
  canDelete = false,
  canEditReply = false,
  canDeleteReply = false,
  onApprove,
  onReject,
  onDelete,
  onReply,
  onEditReply,
  onDeleteReply,
  creatorName,
  creatorLink,
}: ReviewCardProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [editReplyText, setEditReplyText] = useState(review.creatorReply || '');
  const [showDeleteReplyConfirm, setShowDeleteReplyConfirm] = useState(false);

  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  const handleReplySubmit = async () => {
    if (replyText.trim() && onReply) {
      setIsSubmittingReply(true);
      try {
        await onReply(review.id, replyText.trim());
        setReplyText('');
        setIsReplying(false);
      } catch (error) {
        console.error('Error submitting reply:', error);
      } finally {
        setIsSubmittingReply(false);
      }
    }
  };

  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  
  const handleEditReplySubmit = async () => {
    if (editReplyText.trim() && onEditReply) {
      setIsSubmittingEdit(true);
      try {
        await onEditReply(review.id, editReplyText.trim());
        setIsEditingReply(false);
      } catch (error) {
        console.error('Error editing reply:', error);
      } finally {
        setIsSubmittingEdit(false);
      }
    }
  };

  const handleDeleteReply = () => {
    if (onDeleteReply) {
      onDeleteReply(review.id);
      setShowDeleteReplyConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Business avatar placeholder */}
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-primary">
              {review.businessName.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{review.businessName}</h4>
              {showStatus && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getReviewStatusColor(review.status)}`}>
                  {formatReviewStatus(review.status)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <StarRating rating={review.rating} readonly size="sm" />
              <span className="text-sm text-muted">{formatDate(review.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Admin actions */}
        {showActions && review.status === 'pending' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onApprove?.(review.id)}
              className="px-3 py-1.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
            >
              ✓ Odobri
            </button>
            <button
              onClick={() => onReject?.(review.id)}
              className="px-3 py-1.5 bg-error text-white rounded-lg text-sm font-medium hover:bg-error/90 transition-colors"
            >
              ✕ Odbij
            </button>
          </div>
        )}

        {/* Delete button for admin or business owner */}
        {(showActions || canDelete) && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-muted hover:text-error transition-colors p-1"
            title="Obriši recenziju"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        )}
      </div>

      {/* Creator name (for admin or business view) */}
      {creatorName && (
        <div className="text-sm text-muted mb-3">
          Za kreatora:{' '}
          {creatorLink ? (
            <a href={creatorLink} className="font-medium text-primary hover:underline">
              {creatorName}
            </a>
          ) : (
            <span className="font-medium text-foreground">{creatorName}</span>
          )}
        </div>
      )}

      {/* Comment */}
      <p className="text-foreground leading-relaxed mb-4 break-words">{review.comment}</p>

      {/* Creator Reply */}
      {review.creatorReply && (
        <div className="mt-4 pl-6 border-l-2 border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary">Odgovor kreatora</span>
              {review.creatorReplyAt && (
                <span className="text-xs text-muted">{formatDate(review.creatorReplyAt)}</span>
              )}
            </div>
            {/* Edit/Delete buttons for creator's own reply */}
            {(canEditReply || canDeleteReply) && !isEditingReply && (
              <div className="flex items-center gap-1">
                {canEditReply && (
                  <button
                    onClick={() => {
                      setEditReplyText(review.creatorReply || '');
                      setIsEditingReply(true);
                    }}
                    className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Uredi odgovor"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                )}
                {canDeleteReply && (
                  <button
                    onClick={() => setShowDeleteReplyConfirm(true)}
                    className="p-1.5 text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Obriši odgovor"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Edit reply form */}
          {isEditingReply ? (
            <div className="space-y-3">
              <textarea
                value={editReplyText}
                onChange={(e) => setEditReplyText(e.target.value)}
                placeholder="Izmenite odgovor..."
                maxLength={MAX_REPLY_LENGTH}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors text-sm resize-none"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">
                  {editReplyText.length}/{MAX_REPLY_LENGTH}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditingReply(false);
                      setEditReplyText(review.creatorReply || '');
                    }}
                    className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Otkaži
                  </button>
                  <button
                    onClick={handleEditReplySubmit}
                    disabled={!editReplyText.trim() || isSubmittingEdit}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmittingEdit ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Čuvam...
                      </>
                    ) : (
                      'Sačuvaj izmene'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted leading-relaxed">{review.creatorReply}</p>
          )}
        </div>
      )}

      {/* Reply form for creator */}
      {canReply && !review.creatorReply && (
        <div className="mt-4 pt-4 border-t border-border">
          {!isReplying ? (
            <button
              onClick={() => setIsReplying(true)}
              className="text-sm text-primary hover:underline"
            >
              Odgovori na recenziju
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Napišite odgovor na ovu recenziju..."
                maxLength={MAX_REPLY_LENGTH}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors text-sm resize-none"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">
                  {replyText.length}/{MAX_REPLY_LENGTH}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsReplying(false);
                      setReplyText('');
                    }}
                    className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Otkaži
                  </button>
                  <button
                    onClick={handleReplySubmit}
                    disabled={!replyText.trim() || isSubmittingReply}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmittingReply ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Šaljem...
                      </>
                    ) : (
                      'Pošalji odgovor'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-2">Obriši recenziju?</h3>
            <p className="text-muted mb-6">
              Da li ste sigurni da želite da obrišete ovu recenziju? Ova akcija se ne može poništiti.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 border border-border rounded-xl font-medium hover:bg-secondary transition-colors"
              >
                Otkaži
              </button>
              <button
                onClick={() => {
                  onDelete?.(review.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-3 bg-error text-white rounded-xl font-medium hover:bg-error/90 transition-colors"
              >
                Obriši
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete reply confirmation modal */}
      {showDeleteReplyConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-2">Obriši odgovor?</h3>
            <p className="text-muted mb-6">
              Da li ste sigurni da želite da obrišete svoj odgovor na ovu recenziju? Ova akcija se ne može poništiti.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteReplyConfirm(false)}
                className="flex-1 py-3 border border-border rounded-xl font-medium hover:bg-secondary transition-colors"
              >
                Otkaži
              </button>
              <button
                onClick={handleDeleteReply}
                className="flex-1 py-3 bg-error text-white rounded-xl font-medium hover:bg-error/90 transition-colors"
              >
                Obriši
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Kompaktna verzija za liste
interface ReviewCardCompactProps {
  review: Review;
  showStatus?: boolean;
  onClick?: () => void;
}

export function ReviewCardCompact({ review, showStatus = false, onClick }: ReviewCardCompactProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div 
      className={`p-4 border border-border rounded-xl ${onClick ? 'cursor-pointer hover:bg-secondary/50' : ''} transition-colors`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} readonly size="sm" />
          {showStatus && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getReviewStatusColor(review.status)}`}>
              {formatReviewStatus(review.status)}
            </span>
          )}
        </div>
        <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
      </div>
      <p className="text-sm text-muted line-clamp-2 break-words">{review.comment}</p>
      <p className="text-xs text-muted mt-2">— {review.businessName}</p>
    </div>
  );
}

