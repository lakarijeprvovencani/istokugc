/**
 * API Route: /api/creators/[id]/photo
 * 
 * TRENUTNO: Mock implementacija
 * BUDUĆE: Upload slike na cloud storage (Supabase Storage, AWS S3, itd.)
 * 
 * POST /api/creators/[id]/photo - Upload profilne slike kreatora
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ============================================
    // TRENUTNO: Mock implementacija
    // ============================================
    
    // U produkciji bi se ovde:
    // 1. Proverila autentifikacija (samo kreator ili admin)
    // 2. Validirala slika (tip, veličina)
    // 3. Upload-ovala na cloud storage (Supabase Storage)
    // 4. Ažurirala URL u bazi
    
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
    
    // Demo mode: return mock URL
    const mockPhotoUrl = `https://images.unsplash.com/photo-${Date.now()}?w=400&h=400&fit=crop`;
    
    return NextResponse.json({
      success: true,
      data: { photoUrl: mockPhotoUrl },
      message: 'Photo uploaded successfully (demo mode)',
    });
    
    // ============================================
    // BUDUĆE: Supabase Storage implementacija
    // ============================================
    
    /*
    // Provera autentifikacije
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Provera da li korisnik ima pravo
    const creator = await prisma.creator.findUnique({
      where: { id },
      include: { user: true },
    });
    
    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }
    
    const canEdit = 
      session.user.role === 'ADMIN' || 
      creator.userId === session.user.id;
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Upload na Supabase Storage
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;
    const filePath = `creators/${id}/${fileName}`;
    
    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('creator-photos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });
    
    if (uploadError) {
      return NextResponse.json(
        { success: false, error: 'Failed to upload photo' },
        { status: 500 }
      );
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('creator-photos')
      .getPublicUrl(filePath);
    
    // Update creator photo in database
    await prisma.creator.update({
      where: { id },
      data: { photo: publicUrl },
    });
    
    return NextResponse.json({
      success: true,
      data: { photoUrl: publicUrl },
      message: 'Photo uploaded successfully',
    });
    */
    
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}


