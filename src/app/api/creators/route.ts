/**
 * API Route: /api/creators
 * 
 * TRENUTNO: Vraća mock podatke iz DemoContext/localStorage
 * BUDUĆE: Povezuje se sa bazom podataka
 * 
 * Endpoints:
 * - GET /api/creators - Lista svih kreatora (sa filtriranjem)
 * - POST /api/creators - Kreiranje novog kreatora
 */

import { NextRequest, NextResponse } from 'next/server';
import { mockCreators, Creator, CreatorStatus } from '@/lib/mockData';
import type { ApiResponse, PaginatedResponse, CreatorFilters } from '@/types';

// ============================================
// GET - Lista kreatora
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parsiranje filtera iz query parametara
    const filters: CreatorFilters = {
      category: searchParams.get('category') || undefined,
      platform: searchParams.get('platform') || undefined,
      language: searchParams.get('language') || undefined,
      priceMin: searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined,
      priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as CreatorStatus) || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 20,
    };
    
    // Provera da li je admin (u produkciji bi se dobilo iz sesije)
    const includeHidden = searchParams.get('includeHidden') === 'true';
    
    // ============================================
    // TRENUTNO: Mock implementacija
    // ============================================
    
    let creators = [...mockCreators];
    
    // Filtriranje po statusu (ako nije admin)
    if (!includeHidden) {
      creators = creators.filter(c => c.approved && (!c.status || c.status === 'approved'));
    }
    
    // Filtriranje po kategoriji
    if (filters.category) {
      creators = creators.filter(c => c.categories.includes(filters.category!));
    }
    
    // Filtriranje po platformi
    if (filters.platform) {
      creators = creators.filter(c => c.platforms.includes(filters.platform!));
    }
    
    // Filtriranje po jeziku
    if (filters.language) {
      creators = creators.filter(c => c.languages.includes(filters.language!));
    }
    
    // Filtriranje po ceni
    if (filters.priceMin !== undefined) {
      creators = creators.filter(c => c.priceFrom >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      creators = creators.filter(c => c.priceFrom <= filters.priceMax!);
    }
    
    // Pretraga po imenu ili lokaciji
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      creators = creators.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.location.toLowerCase().includes(searchLower)
      );
    }
    
    // Paginacija
    const total = creators.length;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const paginatedCreators = creators.slice(startIndex, startIndex + pageSize);
    
    const response: ApiResponse<PaginatedResponse<Creator>> = {
      success: true,
      data: {
        data: paginatedCreators,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
    
    return NextResponse.json(response);
    
    // ============================================
    // BUDUĆE: Prisma implementacija
    // ============================================
    
    /*
    const where: Prisma.CreatorWhereInput = {
      ...(includeHidden ? {} : { 
        status: 'APPROVED',
        approved: true 
      }),
      ...(filters.category && { 
        categories: { has: filters.category } 
      }),
      ...(filters.platform && { 
        platforms: { has: filters.platform } 
      }),
      ...(filters.language && { 
        languages: { has: filters.language } 
      }),
      ...(filters.priceMin && { 
        priceFrom: { gte: filters.priceMin } 
      }),
      ...(filters.priceMax && { 
        priceFrom: { lte: filters.priceMax } 
      }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { location: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };
    
    const [creators, total] = await Promise.all([
      prisma.creator.findMany({
        where,
        include: { portfolio: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.creator.count({ where }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        data: creators,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
    */
    
  } catch (error) {
    console.error('Error fetching creators:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Kreiranje novog kreatora
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validacija (u produkciji koristiti Zod)
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // ============================================
    // TRENUTNO: Mock implementacija
    // ============================================
    
    const newCreator: Creator = {
      id: `creator_${Date.now()}`,
      name: body.name,
      email: body.email,
      bio: body.bio || '',
      photo: body.photo || '',
      categories: body.categories || [],
      platforms: body.platforms || [],
      languages: body.languages || [],
      location: body.location || '',
      priceFrom: body.priceFrom || 0,
      phone: body.phone,
      instagram: body.instagram,
      tiktok: body.tiktok,
      youtube: body.youtube,
      portfolio: [],
      approved: false, // Novi kreatori čekaju odobrenje
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    // U mock implementaciji samo vraćamo novog kreatora
    // U produkciji bi se sačuvao u bazu
    
    const response: ApiResponse<Creator> = {
      success: true,
      data: newCreator,
      message: 'Creator created successfully. Awaiting approval.',
    };
    
    return NextResponse.json(response, { status: 201 });
    
    // ============================================
    // BUDUĆE: Prisma implementacija
    // ============================================
    
    /*
    // Provera da li korisnik ima pravo da kreira kreatora
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Provera da li već postoji kreator sa tim emailom
    const existing = await prisma.creator.findUnique({
      where: { email: body.email },
    });
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Creator with this email already exists' },
        { status: 409 }
      );
    }
    
    const creator = await prisma.creator.create({
      data: {
        userId: session.user.id,
        name: body.name,
        email: body.email,
        bio: body.bio || '',
        photo: body.photo,
        categories: body.categories || [],
        platforms: body.platforms || [],
        languages: body.languages || [],
        location: body.location || '',
        priceFrom: body.priceFrom || 0,
        phone: body.phone,
        instagram: body.instagram,
        tiktok: body.tiktok,
        youtube: body.youtube,
        status: 'PENDING',
        approved: false,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: creator,
      message: 'Creator created successfully. Awaiting approval.',
    }, { status: 201 });
    */
    
  } catch (error) {
    console.error('Error creating creator:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create creator' },
      { status: 500 }
    );
  }
}

