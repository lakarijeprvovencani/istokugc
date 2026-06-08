import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser, isAdmin } from '@/lib/auth-helper';
import { uploadToR2 } from '@/lib/r2';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const { id } = await params;

    if (!isAdmin(user!) && user?.creatorId !== id) {
      return NextResponse.json(
        { success: false, error: 'Možete menjati samo svoju profilnu sliku' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    
    const contentType = request.headers.get('content-type') || '';
    
    let photoData: string;
    
    if (contentType.includes('application/json')) {
      const body = await request.json();
      photoData = body.photo;
      
      if (!photoData || !photoData.startsWith('data:image')) {
        return NextResponse.json(
          { success: false, error: 'Invalid image data' },
          { status: 400 }
        );
      }

      // Limit veličine i za JSON (base64) put — sprečava unbounded upload/DoS
      const base64Size = (photoData.length * 3) / 4;
      if (base64Size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Slika mora biti manja od 5MB' },
          { status: 400 }
        );
      }
    } else {
      const formData = await request.formData();
      const file = formData.get('photo') as File;
      
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }
      
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: 'File must be an image' },
          { status: 400 }
        );
      }
      
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'File size must be less than 5MB' },
          { status: 400 }
        );
      }
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      photoData = `data:${file.type};base64,${buffer.toString('base64')}`;
    }
    
    const base64Data = photoData.split(',')[1];
    const mimeType = photoData.split(';')[0].split(':')[1];
    const extension = mimeType.split('/')[1] || 'jpg';
    
    const buffer = Buffer.from(base64Data, 'base64');
    
    const filePath = `profiles/${id}/${Date.now()}.${extension}`;
    
    const publicUrl = await uploadToR2(buffer, filePath, mimeType);
    
    const { error: updateError } = await supabase
      .from('creators')
      .update({ photo: publicUrl })
      .eq('id', id);
    
    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { photoUrl: publicUrl },
      message: 'Slika uspešno uploadovana',
    });
    
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
