/**
 * API Route: /api/creators/[id]
 * 
 * TRENUTNO: Vraća mock podatke
 * BUDUĆE: Povezuje se sa bazom podataka
 * 
 * Endpoints:
 * - GET /api/creators/[id] - Pojedinačni kreator
 * - PUT /api/creators/[id] - Ažuriranje kreatora
 * - DELETE /api/creators/[id] - Brisanje kreatora
 */

import { NextRequest, NextResponse } from 'next/server';
import { mockCreators, Creator, CreatorStatus } from '@/lib/mockData';
import type { ApiResponse, UpdateCreatorInput } from '@/types';

// ============================================
// GET - Pojedinačni kreator
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ============================================
    // TRENUTNO: Mock implementacija
    // ============================================
    
    const creator = mockCreators.find(c => c.id === id);
    
    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }
    
    const response: ApiResponse<Creator> = {
      success: true,
      data: creator,
    };
    
    return NextResponse.json(response);
    
    // ============================================
    // BUDUĆE: Prisma implementacija
    // ============================================
    
    /*
    const creator = await prisma.creator.findUnique({
      where: { id },
      include: { portfolio: true },
    });
    
    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: creator,
    });
    */
    
  } catch (error) {
    console.error('Error fetching creator:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch creator' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Ažuriranje kreatora
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateCreatorInput = await request.json();
    
    // ============================================
    // TRENUTNO: Mock implementacija
    // ============================================
    
    const creatorIndex = mockCreators.findIndex(c => c.id === id);
    
    if (creatorIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }
    
    // Simulacija ažuriranja (u produkciji bi se sačuvalo u bazu)
    const updatedCreator: Creator = {
      ...mockCreators[creatorIndex],
      ...body,
      // Osiguraj da status bude ispravan tip
      status: body.status as CreatorStatus | undefined,
    };
    
    const response: ApiResponse<Creator> = {
      success: true,
      data: updatedCreator,
      message: 'Creator updated successfully',
    };
    
    return NextResponse.json(response);
    
    // ============================================
    // BUDUĆE: Prisma implementacija
    // ============================================
    
    /*
    // Provera autorizacije
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Provera da li korisnik ima pravo da uređuje
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
    
    const updatedCreator = await prisma.creator.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.bio && { bio: body.bio }),
        ...(body.photo && { photo: body.photo }),
        ...(body.categories && { categories: body.categories }),
        ...(body.platforms && { platforms: body.platforms }),
        ...(body.languages && { languages: body.languages }),
        ...(body.location && { location: body.location }),
        ...(body.priceFrom !== undefined && { priceFrom: body.priceFrom }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.instagram !== undefined && { instagram: body.instagram }),
        ...(body.tiktok !== undefined && { tiktok: body.tiktok }),
        ...(body.youtube !== undefined && { youtube: body.youtube }),
        ...(body.status && { status: body.status.toUpperCase() }),
        ...(body.approved !== undefined && { approved: body.approved }),
      },
      include: { portfolio: true },
    });
    
    return NextResponse.json({
      success: true,
      data: updatedCreator,
      message: 'Creator updated successfully',
    });
    */
    
  } catch (error) {
    console.error('Error updating creator:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update creator' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Brisanje kreatora
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ============================================
    // TRENUTNO: Mock implementacija
    // ============================================
    
    const creatorIndex = mockCreators.findIndex(c => c.id === id);
    
    if (creatorIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }
    
    // Simulacija brisanja
    const response: ApiResponse<null> = {
      success: true,
      message: 'Creator deleted successfully',
    };
    
    return NextResponse.json(response);
    
    // ============================================
    // BUDUĆE: Prisma implementacija
    // ============================================
    
    /*
    // Provera autorizacije - samo admin može da briše
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Provera da li kreator postoji
    const creator = await prisma.creator.findUnique({
      where: { id },
    });
    
    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }
    
    // Soft delete - samo promena statusa
    await prisma.creator.update({
      where: { id },
      data: { 
        status: 'DEACTIVATED',
        approved: false,
      },
    });
    
    // Ili hard delete ako je potrebno:
    // await prisma.creator.delete({ where: { id } });
    
    return NextResponse.json({
      success: true,
      message: 'Creator deleted successfully',
    });
    */
    
  } catch (error) {
    console.error('Error deleting creator:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete creator' },
      { status: 500 }
    );
  }
}

