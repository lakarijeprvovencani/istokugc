import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isAdmin } from '@/lib/auth-helper';
import { createAdminClient } from '@/lib/supabase/server';
import {
  MAX_IMAGE_BYTES,
  IMAGE_TYPES,
  IMAGE_TOO_LARGE_MSG,
  VIDEO_USE_LINK_MSG,
} from '@/lib/upload-limits';

// POST /api/upload/portfolio/presign
// Vraca Supabase Storage signed upload URL za direktan upload iz browsera.
// Fajl NE prolazi kroz nas server (zaobilazi Vercel 4.5MB limit) - ide
// direktno browser -> Supabase Storage. Supabase ima CORS prepodesen.
//
// SAMO SLIKE. Video se dodaje preko linka (nema upload fajlom).
//
// Body: { creatorId, contentType, fileName, fileSize }
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
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

    // Samo slike. Video se dodaje preko linka.
    if (typeof contentType === 'string' && contentType.startsWith('video/')) {
      return NextResponse.json({ error: VIDEO_USE_LINK_MSG }, { status: 400 });
    }
    if (!contentType || !IMAGE_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Nepodržan tip fajla' }, { status: 400 });
    }

    if (typeof fileSize === 'number' && fileSize > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: IMAGE_TOO_LARGE_MSG }, { status: 400 });
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
      isVideo: false,
    });

  } catch (error: unknown) {
    console.error('Presign error:', error);
    const msg = error instanceof Error ? error.message : 'Greška pri pripremi uploada';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
