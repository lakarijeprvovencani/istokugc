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
      const formData = await request.formData();
      const file = formData.get('logo') as File;
      
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
      
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Logo mora biti manji od 2MB' },
          { status: 400 }
        );
      }
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      logoData = `data:${file.type};base64,${buffer.toString('base64')}`;
    }
    
    const base64Data = logoData.split(',')[1];
    const mimeType = logoData.split(';')[0].split(':')[1];
    const extension = mimeType.split('/')[1] || 'png';
    
    const buffer = Buffer.from(base64Data, 'base64');
    
    const filePath = `logos/${id}/${Date.now()}.${extension}`;
    
    const publicUrl = await uploadToR2(buffer, filePath, mimeType);
    
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
