import { NextResponse } from 'next/server';

// ============================================
// RECENTLY VIEWED API ROUTES
// These are placeholder implementations for demo mode.
// In production, replace with actual database operations.
// ============================================

// GET /api/recently-viewed - Get recently viewed creators for current user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '5';

  // In production:
  // const session = await getServerSession(authOptions);
  // if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // 
  // const recentlyViewed = await prisma.recentlyViewed.findMany({
  //   where: { userId: session.user.id },
  //   orderBy: { viewedAt: 'desc' },
  //   take: parseInt(limit),
  //   include: { creator: true },
  // });

  // Demo response
  return NextResponse.json({
    success: true,
    data: {
      recentlyViewed: [],
      limit: parseInt(limit),
      message: 'Demo mode - recently viewed are stored in localStorage',
    },
  });
}

// POST /api/recently-viewed - Add creator to recently viewed
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId } = body;

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    // In production:
    // const session = await getServerSession(authOptions);
    // if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // 
    // // Upsert - update viewedAt if exists, create if not
    // const view = await prisma.recentlyViewed.upsert({
    //   where: {
    //     userId_creatorId: {
    //       userId: session.user.id,
    //       creatorId,
    //     },
    //   },
    //   create: {
    //     userId: session.user.id,
    //     creatorId,
    //     viewedAt: new Date(),
    //   },
    //   update: {
    //     viewedAt: new Date(),
    //   },
    //   include: { creator: true },
    // });
    // 
    // // Optional: Clean up old entries (keep only last 50)
    // const allViews = await prisma.recentlyViewed.findMany({
    //   where: { userId: session.user.id },
    //   orderBy: { viewedAt: 'desc' },
    // });
    // if (allViews.length > 50) {
    //   const toDelete = allViews.slice(50).map(v => v.id);
    //   await prisma.recentlyViewed.deleteMany({
    //     where: { id: { in: toDelete } },
    //   });
    // }

    // Demo response
    return NextResponse.json({
      success: true,
      data: {
        creatorId,
        viewedAt: new Date().toISOString(),
        message: 'Demo mode - view added to localStorage',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to add to recently viewed' },
      { status: 500 }
    );
  }
}

// DELETE /api/recently-viewed - Clear all recently viewed
export async function DELETE() {
  // In production:
  // const session = await getServerSession(authOptions);
  // if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // 
  // await prisma.recentlyViewed.deleteMany({
  //   where: { userId: session.user.id },
  // });

  // Demo response
  return NextResponse.json({
    success: true,
    message: 'Demo mode - recently viewed cleared from localStorage',
  });
}


