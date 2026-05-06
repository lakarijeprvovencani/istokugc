/**
 * Sentry User Context helper
 *
 * BEZBEDNOST: Saljemo Sentry-u SAMO user ID i role.
 * NIKAD ne saljemo email, password, ili druge PII podatke.
 *
 * User ID je dovoljan da znamo na koga utice greska,
 * a mozemo da spojimo sa Supabase logovima ako treba.
 */

import * as Sentry from '@sentry/nextjs';

export interface SentryUserContext {
  id: string;
  role?: 'creator' | 'business' | 'admin';
}

/**
 * Postavlja korisnika u Sentry kontekst.
 * Pozovi nakon uspesnog logina ili kada otkrijes postojecu sesiju.
 */
export function setSentryUser(user: SentryUserContext | null): void {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    // role kao tag da mozemo filtrirati greske po tipu korisnika
    ...(user.role ? { segment: user.role } : {}),
  });

  // Tag za laksu pretragu u Sentry dashboard-u
  if (user.role) {
    Sentry.setTag('user_role', user.role);
  }
}

/**
 * Brise korisnika iz Sentry konteksta.
 * Pozovi pri logout-u.
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
  Sentry.setTag('user_role', null);
}
