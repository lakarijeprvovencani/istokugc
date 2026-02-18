/**
 * API Route: /api/notifications
 * 
 * Centralna tačka za slanje notifikacija.
 * U produkciji, ova ruta bi bila zaštićena i korišćena interno.
 * 
 * NAPOMENA: Ova ruta se koristi samo za testiranje u razvoju.
 * U produkciji, notifikacije se šalju direktno iz odgovarajućih API ruta
 * (npr. kada se kreira kreator, kada se šalje recenzija, itd.)
 */

import { NextRequest, NextResponse } from 'next/server';
import emailService from '@/lib/email';
import { getAuthUser, isAdmin } from '@/lib/auth-helper';

// Tipovi notifikacija
type NotificationType = 
  | 'admin_new_creator'
  | 'admin_new_review'
  | 'creator_approved'
  | 'creator_rejected'
  | 'creator_new_review'
  | 'business_welcome'
  | 'business_review_approved'
  | 'business_subscription_expiring';

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Samo admin može slati notifikacije' }, { status: 403 });
    }

    const body = await request.json();
    const { type, data } = body as { type: NotificationType; data: Record<string, unknown> };

    let result;

    switch (type) {
      case 'admin_new_creator':
        result = await emailService.notifyAdminNewCreator({
          creatorName: data.creatorName as string,
          creatorEmail: data.creatorEmail as string,
          categories: data.categories as string[],
          location: data.location as string,
        });
        break;

      case 'admin_new_review':
        result = await emailService.notifyAdminNewReview({
          businessName: data.businessName as string,
          creatorName: data.creatorName as string,
          rating: data.rating as number,
          comment: data.comment as string,
        });
        break;

      case 'creator_approved':
        result = await emailService.notifyCreatorApproved({
          creatorName: data.creatorName as string,
          creatorEmail: data.creatorEmail as string,
        });
        break;

      case 'creator_rejected':
        result = await emailService.notifyCreatorRejected({
          creatorName: data.creatorName as string,
          creatorEmail: data.creatorEmail as string,
          reason: data.reason as string | undefined,
        });
        break;

      case 'creator_new_review':
        result = await emailService.notifyCreatorNewReview({
          creatorName: data.creatorName as string,
          creatorEmail: data.creatorEmail as string,
          businessName: data.businessName as string,
          rating: data.rating as number,
        });
        break;

      case 'business_welcome':
        result = await emailService.notifyBusinessWelcome({
          companyName: data.companyName as string,
          email: data.email as string,
          plan: data.plan as 'monthly' | 'yearly',
        });
        break;

      case 'business_review_approved':
        result = await emailService.notifyBusinessReviewApproved({
          companyName: data.companyName as string,
          email: data.email as string,
          creatorName: data.creatorName as string,
        });
        break;

      case 'business_subscription_expiring':
        result = await emailService.notifyBusinessSubscriptionExpiring({
          companyName: data.companyName as string,
          email: data.email as string,
          expiresAt: new Date(data.expiresAt as string),
          daysLeft: data.daysLeft as number,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

/**
 * GET: Lista svih tipova notifikacija (za dokumentaciju)
 */
export async function GET() {
  return NextResponse.json({
    message: 'Notification API',
    availableTypes: [
      {
        type: 'admin_new_creator',
        description: 'Obavesti admina o novom kreatoru',
        requiredFields: ['creatorName', 'creatorEmail', 'categories', 'location'],
      },
      {
        type: 'admin_new_review',
        description: 'Obavesti admina o novoj recenziji za pregled',
        requiredFields: ['businessName', 'creatorName', 'rating', 'comment'],
      },
      {
        type: 'creator_approved',
        description: 'Obavesti kreatora da je odobren',
        requiredFields: ['creatorName', 'creatorEmail'],
      },
      {
        type: 'creator_rejected',
        description: 'Obavesti kreatora da je odbijen',
        requiredFields: ['creatorName', 'creatorEmail'],
        optionalFields: ['reason'],
      },
      {
        type: 'creator_new_review',
        description: 'Obavesti kreatora o novoj recenziji',
        requiredFields: ['creatorName', 'creatorEmail', 'businessName', 'rating'],
      },
      {
        type: 'business_welcome',
        description: 'Dobrodošlica biznis korisniku',
        requiredFields: ['companyName', 'email', 'plan'],
      },
      {
        type: 'business_review_approved',
        description: 'Obavesti biznis da je recenzija odobrena',
        requiredFields: ['companyName', 'email', 'creatorName'],
      },
      {
        type: 'business_subscription_expiring',
        description: 'Obavesti biznis da pretplata ističe',
        requiredFields: ['companyName', 'email', 'expiresAt', 'daysLeft'],
      },
    ],
    note: 'U demo modu, emailovi se samo loguju u konzoli.',
  });
}





