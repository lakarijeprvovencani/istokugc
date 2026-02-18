/**
 * API Route: /api/business/[id]/logo
 * 
 * Upload loga biznisa na Supabase Storage
 * 
 * POST /api/business/[id]/logo - Upload loga
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser, isAdmin } from '@/lib/auth-helper';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const { id } = await params;

    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    if (!isAdmin(user!) && user?.businessId !== id) {
      return NextResponse.json({ success: false, error: 'Nemate dozvolu' }, { status: 403 });
    }

    const supabase = createAdminClient();
    
    const contentType = request.headers.get('content-type') || '';
    
    let logoData: string;
    
    if (contentType.includes('application/json')) {
      // Base64 slika (od croppera)
      const body = await request.json();
      logoData = body.logo;
      
      if (!logoData || !logoData.startsWith('data:image')) {
        return NextResponse.json(
          { success: false, error: 'Invalid image data' },
          { status: 400 }
        );
      }

      const base64Size = (logoData.length * 3) / 4;
      if (base64Size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Logo mora biti manji od 2MB' },
          { status: 400 }
        );
      }
    } else {
      // FormData
      const formData = await request.formData();
      const file = formData.get('logo') as File;
      
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
      
      // Validacija veličine (max 2MB za logo)
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Logo mora biti manji od 2MB' },
          { status: 400 }
        );
      }
      
      // Convert to base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      logoData = `data:${file.type};base64,${buffer.toString('base64')}`;
    }
    
    // Ekstraktuj base64 podatke
    const base64Data = logoData.split(',')[1];
    const mimeType = logoData.split(';')[0].split(':')[1];
    const extension = mimeType.split('/')[1] || 'png';
    
    // Kreiraj buffer od base64
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generiši unikatno ime fajla
    const fileName = `logos/${id}/${Date.now()}.${extension}`;
    
    // Upload na Supabase Storage (koristimo portfolio bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload logo' },
        { status: 500 }
      );
    }
    
    // Dobij javni URL
    const { data: { publicUrl } } = supabase.storage
      .from('portfolio')
      .getPublicUrl(fileName);
    
    // Ažuriraj biznis profil u bazi
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ logo: publicUrl })
      .eq('id', id);
    
    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update business profile' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { logoUrl: publicUrl },
      message: 'Logo uspešno uploadovan',
    });
    
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
}



