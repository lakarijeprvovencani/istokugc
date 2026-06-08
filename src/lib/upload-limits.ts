/**
 * JEDNO MESTO za limite portfolio uploada.
 *
 * Da promeniš maksimalnu veličinu videa (npr. 50 -> 200MB):
 *   1. Promeni MAX_VIDEO_MB ovde dole.
 *   2. Pokreni: node scripts/set-storage-limit.mjs   (sinhronizuje Supabase bucket)
 *   3. Deploy (commit + push).
 *
 * To je sve - klijent, server i Storage bucket koriste iste vrednosti odavde.
 */
export const MAX_VIDEO_MB = 50;
export const MAX_IMAGE_MB = 10;

export const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

// Kratke UI poruke (bez suvišnog teksta)
export const VIDEO_TOO_LARGE_MSG = `Video je veći od ${MAX_VIDEO_MB}MB. Nalepi link umesto fajla.`;
export const IMAGE_TOO_LARGE_MSG = `Slika je veća od ${MAX_IMAGE_MB}MB.`;
export const UPLOAD_HINT = `Slika do ${MAX_IMAGE_MB}MB • Video do ${MAX_VIDEO_MB}MB`;
