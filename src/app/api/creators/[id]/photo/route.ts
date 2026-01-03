/**
 * API Route: /api/creators/[id]/photo
 * 
 * Upload profilne slike kreatora na Supabase Storage
 * 
 * POST /api/creators/[id]/photo - Upload profilne slike
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    
    // Dohvati body - može biti FormData ili JSON sa base64
    const contentType = request.headers.get('content-type') || '';
    
    let photoData: string;
    
    if (contentType.includes('application/json')) {
      // Base64 slika (od croppera)
      const body = await request.json();
      photoData = body.photo;
      
      if (!photoData || !photoData.startsWith('data:image')) {
        return NextResponse.json(
          { success: false, error: 'Invalid image data' },
          { status: 400 }
        );
      }
    } else {
      // FormData
      const formData = await request.formData();
      const file = formData.get('photo') as File;
      
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }
      
      // Validacija tipa
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: 'File must be an image' },
          { status: 400 }
        );
      }
      
      // Validacija veličine (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'File size must be less than 5MB' },
          { status: 400 }
        );
      }
      
      // Convert to base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      photoData = `data:${file.type};base64,${buffer.toString('base64')}`;
    }
    
    // Ekstraktuj base64 podatke
    const base64Data = photoData.split(',')[1];
    const mimeType = photoData.split(';')[0].split(':')[1];
    const extension = mimeType.split('/')[1] || 'jpg';
    
    // Kreiraj buffer od base64
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generiši unikatno ime fajla (koristimo portfolio bucket sa profiles/ prefiksom)
    const fileName = `profiles/${id}/${Date.now()}.${extension}`;
    
    // Upload na Supabase Storage (koristimo postojeći portfolio bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload photo' },
        { status: 500 }
      );
    }
    
    // Dobij javni URL
    const { data: { publicUrl } } = supabase.storage
      .from('portfolio')
      .getPublicUrl(fileName);
    
    // Ažuriraj kreator profil u bazi
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
