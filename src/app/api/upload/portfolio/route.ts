import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser, isAdmin } from '@/lib/auth-helper';

// POST /api/upload/portfolio - Upload portfolio file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const creatorId = formData.get('creatorId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID required' }, { status: 400 });
    }

    // Sanitize creatorId to prevent path traversal
    if (creatorId.includes('..') || creatorId.includes('/') || creatorId.includes('\\')) {
      return NextResponse.json({ error: 'Invalid creator ID' }, { status: 400 });
    }

    // Verify ownership
    if (!isAdmin(user!) && user?.creatorId !== creatorId) {
      return NextResponse.json({ error: 'Možete uploadovati samo na svoj portfolio' }, { status: 403 });
    }

    // Validate file type
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    const validTypes = [...imageTypes, ...videoTypes];
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Check file size
    const isVideo = videoTypes.includes(file.type);
    const maxSize = isVideo ? 30 * 1024 * 1024 : 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Max ${isVideo ? '30MB' : '10MB'} for ${isVideo ? 'videos' : 'images'}` 
      }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${creatorId}/${timestamp}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('portfolio')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('portfolio')
      .getPublicUrl(fileName);

    return NextResponse.json({ 
      success: true,
      url: urlData.publicUrl,
      path: data.path,
      isVideo,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}





