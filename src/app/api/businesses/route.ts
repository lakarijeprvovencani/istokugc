/**
 * API Route: /api/businesses
 * 
 * TRENUTNO: Vraća mock podatke
 * BUDUĆE: Povezuje se sa bazom podataka
 * 
 * Endpoints:
 * - GET /api/businesses - Lista svih biznisa (admin only)
 * - POST /api/businesses - Registracija novog biznisa
 */

import { NextRequest, NextResponse } from 'next/server';
import { mockBusinesses, Business } from '@/lib/mockData';
import type { ApiResponse, PaginatedResponse } from '@/types';

// ============================================
// GET - Lista biznisa (admin only)
// ============================================

export async function GET(request: NextRequest) {
  try {
    // U produkciji bi se proverila admin sesija
    // const session = await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const status = searchParams.get('status'); // 'active' | 'expired' | 'none'
    
    // ============================================
    // TRENUTNO: Mock implementacija
    // ============================================
    
    let businesses = [...mockBusinesses];
    
    // Filtriranje po statusu pretplate
    if (status) {
      businesses = businesses.filter(b => b.subscriptionStatus === status);
    }
    
    const total = businesses.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedBusinesses = businesses.slice(startIndex, startIndex + pageSize);
    
    const response: ApiResponse<PaginatedResponse<Business>> = {
      success: true,
      data: {
        data: paginatedBusinesses,
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
    const where: Prisma.BusinessWhereInput = {
      ...(status && { subscriptionStatus: status.toUpperCase() }),
    };
    
    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.business.count({ where }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        data: businesses,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
    */
    
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Registracija biznisa
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validacija
    if (!body.companyName || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Company name and email are required' },
        { status: 400 }
      );
    }
    
    // ============================================
    // TRENUTNO: Mock implementacija
    // ============================================
    
    const newBusiness: Business = {
      id: `business_${Date.now()}`,
      companyName: body.companyName,
      email: body.email,
      description: body.description,
      website: body.website,
      industry: body.industry,
      subscriptionType: null,
      subscriptionStatus: 'none',
    };
    
    const response: ApiResponse<Business> = {
      success: true,
      data: newBusiness,
      message: 'Business registered successfully',
    };
    
    return NextResponse.json(response, { status: 201 });
    
    // ============================================
    // BUDUĆE: Prisma implementacija
    // ============================================
    
    /*
    // Provera da li već postoji biznis sa tim emailom
    const existing = await prisma.business.findFirst({
      where: { email: body.email },
    });
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Business with this email already exists' },
        { status: 409 }
      );
    }
    
    // Kreiranje korisnika i biznisa u transakciji
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email,
          password: await bcrypt.hash(body.password, 10),
          name: body.companyName,
          role: 'BUSINESS',
        },
      });
      
      const business = await tx.business.create({
        data: {
          userId: user.id,
          companyName: body.companyName,
          email: body.email,
          description: body.description,
          website: body.website,
          industry: body.industry,
          subscriptionStatus: 'NONE',
        },
      });
      
      return business;
    });
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Business registered successfully',
    }, { status: 201 });
    */
    
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create business' },
      { status: 500 }
    );
  }
}

