/**
 * API Route: /api/businesses/me/delete
 * 
 * TRENUTNO: Mock implementacija
 * BUDUĆE: Soft delete ili hard delete biznisa iz baze
 * 
 * DELETE /api/businesses/me/delete - Biznis briše svoj profil
 */

import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    // ============================================
    // TRENUTNO: Mock implementacija
    // ============================================
    
    // Demo mode: just return success
    return NextResponse.json({
      success: true,
      message: 'Demo mode - profile would be deleted in production',
    });
    
    // ============================================
    // BUDUĆE: Prisma implementacija
    // ============================================
    
    /*
    // Provera autentifikacije
    const session = await getSession();
    if (!session || session.user.role !== 'BUSINESS') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Pronađi biznis
    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      include: { subscription: true },
    });
    
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }
    
    // Otkaži Stripe subscription ako postoji
    if (business.subscription?.stripeSubscriptionId) {
      // Stripe API call to cancel subscription
      // await stripe.subscriptions.cancel(business.subscription.stripeSubscriptionId);
    }
    
    // Soft delete: postavi status na DEACTIVATED
    await prisma.business.update({
      where: { id: business.id },
      data: {
        // Opciono: obriši i User nalog
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully',
    });
    */
    
  } catch (error) {
    console.error('Error deleting business profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
}

