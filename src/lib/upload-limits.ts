/**
 * JEDNO MESTO za limite portfolio uploada.
 *
 * ODLUKA: video se NE uploaduje kao fajl - dodaje se preko linka
 * (YouTube / TikTok / Instagram). Tako nema storage/egress troška ni limita.
 * Upload fajlom je dozvoljen SAMO za slike (do MAX_IMAGE_MB).
 *
 * Da promeniš limit slike: promeni MAX_IMAGE_MB, pa pokreni
 *   node scripts/set-storage-limit.mjs
 * i deploy (commit + push).
 */
export const MAX_IMAGE_MB = 10;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Kratke UI poruke (bez suvišnog teksta)
export const IMAGE_TOO_LARGE_MSG = `Slika je veća od ${MAX_IMAGE_MB}MB.`;
export const VIDEO_USE_LINK_MSG = 'Video se dodaje preko linka (YouTube, TikTok, Instagram), ne kao fajl.';
export const UPLOAD_HINT = `Slika do ${MAX_IMAGE_MB}MB. Video dodaj preko linka.`;
