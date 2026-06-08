import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isAdmin } from '@/lib/auth-helper';
import { createAdminClient } from '@/lib/supabase/server';

// POST /api/upload/portfolio/presign
// Vraca Supabase Storage signed upload URL za direktan upload iz browsera.
// Fajl NE prolazi kroz nas server (zaobilazi Vercel 4.5MB limit) - ide
// direktno browser -> Supabase Storage. Supabase ima CORS prepodesen.
//
// Body: { creatorId, contentType, fileName, fileSize }
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_IMAGE = 10 * 1024 * 1024;   // 10MB
const MAX_VIDEO = 50 * 1024 * 1024;   // 50MB

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

const BUCKET = 'portfolio';

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const body = await request.json();
    const { creatorId, contentType, fileSize } = body;

    if (!creatorId || typeof creatorId !== 'string') {
      return NextResponse.json({ error: 'Creator ID required' }, { status: 400 });
    }

    if (creatorId.includes('..') || creatorId.includes('/') || creatorId.includes('\\')) {
      return NextResponse.json({ error: 'Invalid creator ID' }, { status: 400 });
    }

    if (!isAdmin(user!) && user?.creatorId !== creatorId) {
      return NextResponse.json({ error: 'Možete uploadovati samo na svoj portfolio' }, { status: 403 });
    }

    const validTypes = [...IMAGE_TYPES, ...VIDEO_TYPES];
    if (!contentType || !validTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Nepodržan tip fajla' }, { status: 400 });
    }

    const isVideo = VIDEO_TYPES.includes(contentType);
    const maxSize = isVideo ? MAX_VIDEO : MAX_IMAGE;

    if (typeof fileSize === 'number' && fileSize > maxSize) {
      return NextResponse.json({
        error: isVideo
          ? 'Video je veći od 50MB. Nalepi link umesto fajla.'
          : 'Slika je veća od 10MB.',
      }, { status: 400 });
    }

    const ext = EXT_BY_TYPE[contentType] || 'bin';
    const filePath = `${creatorId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Service-role klijent kreira signed upload token. Token autorizuje
    // jedan upload na tacno ovaj path - ne treba poseban RLS INSERT policy.
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error('createSignedUploadUrl error:', error);
      return NextResponse.json({ error: 'Greška pri pripremi uploada' }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json({
      bucket: BUCKET,
      path: data.path,
      token: data.token,
      publicUrl: pub.publicUrl,
      isVideo,
    });

  } catch (error: unknown) {
    console.error('Presign error:', error);
    const msg = error instanceof Error ? error.message : 'Greška pri pripremi uploada';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
