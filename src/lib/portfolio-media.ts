/**
 * Shared helpers for portfolio click / playback across admin, dashboard, public profile.
 */

export type PortfolioVideoType = 'youtube' | 'instagram' | 'tiktok' | 'upload';

export function getPortfolioVideoType(item: {
  type?: string | null;
  url?: string | null;
}): PortfolioVideoType {
  const type = (item.type || '').toLowerCase();
  if (type === 'youtube' || type === 'tiktok' || type === 'instagram' || type === 'upload') {
    return type;
  }
  const url = (item.url || '').toLowerCase();
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  return 'upload';
}

export function isPortfolioVideo(item: {
  type?: string | null;
  url?: string | null;
  thumbnail?: string | null;
}): boolean {
  const url = (item.url || '').toLowerCase();
  const type = (item.type || '').toLowerCase();

  if (type === 'youtube' || type === 'tiktok' || type === 'instagram') return true;
  if (/youtube\.com|youtu\.be|tiktok\.com|instagram\.com/.test(url)) return true;
  if (/\.(mp4|webm|mov|avi)(\?|$)/i.test(url)) return true;
  if (url.startsWith('data:video')) return true;
  if (type === 'upload' && (url.includes('video') || /\.(mp4|webm|mov|avi)(\?|$)/i.test(item.thumbnail || ''))) {
    return true;
  }
  return false;
}
