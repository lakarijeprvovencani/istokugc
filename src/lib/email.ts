/**
 * Email Service
 * 
 * Centralizovani servis za slanje email notifikacija.
 * 
 * SETUP:
 * 1. Instaliraj Resend: npm install resend
 * 2. Kreiraj nalog na resend.com
 * 3. Dodaj RESEND_API_KEY u .env
 * 4. Verifikuj domen (ili koristi onboarding@resend.dev za testiranje)
 * 
 * NAPOMENA: U demo modu, emailovi se samo loguju u konzoli.
 * U produkciji, zapravo se šalju preko Resend API-ja.
 */

// import { Resend } from 'resend';
import { emailTemplates } from './emailTemplates';

// const resend = new Resend(process.env.RESEND_API_KEY);

// Admin email - gde se šalju admin notifikacije
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ugcselect.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'UGC Executive <noreply@ugcselect.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================
// ADMIN NOTIFIKACIJE
// ============================================

/**
 * Obavesti admina kada novi kreator aplicira
 */
export async function notifyAdminNewCreator(data: {
  creatorName: string;
  creatorEmail: string;
  categories: string[];
  location: string;
}) {
  const { creatorName, creatorEmail, categories, location } = data;
  
  console.log('[DEMO] Email: notifyAdminNewCreator');
  
  return { success: true, demo: true };

  // PRODUKCIJA - odkomentariši kad povežeš Resend
  /*
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🆕 Nova prijava kreatora: ${creatorName}`,
      html: emailTemplates.adminNewCreator({
        creatorName,
        creatorEmail,
        categories,
        location,
        adminUrl: `${APP_URL}/admin`,
      }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
  */
}

/**
 * Obavesti admina kada nova recenzija čeka odobrenje
 */
export async function notifyAdminNewReview(data: {
  businessName: string;
  creatorName: string;
  rating: number;
  comment: string;
}) {
  const { businessName, creatorName, rating, comment } = data;
  
  console.log('[DEMO] Email: notifyAdminNewReview');
  
  return { success: true, demo: true };

  // PRODUKCIJA
  /*
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `⭐ Nova recenzija za pregled - ${creatorName}`,
      html: emailTemplates.adminNewReview({
        businessName,
        creatorName,
        rating,
        comment,
        adminUrl: `${APP_URL}/admin`,
      }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
  */
}

// ============================================
// KREATOR NOTIFIKACIJE
// ============================================

/**
 * Obavesti kreatora da je njegova prijava odobrena
 */
export async function notifyCreatorApproved(data: {
  creatorName: string;
  creatorEmail: string;
}) {
  const { creatorName, creatorEmail } = data;
  
  console.log('[DEMO] Email: notifyCreatorApproved');
  
  return { success: true, demo: true };

  // PRODUKCIJA
  /*
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: '✅ Tvoj profil je odobren na UGC Executive!',
      html: emailTemplates.creatorApproved({
        creatorName,
        profileUrl: `${APP_URL}/kreatori`,
        dashboardUrl: `${APP_URL}/dashboard`,
      }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
  */
}

/**
 * Obavesti kreatora da je njegova prijava odbijena
 */
export async function notifyCreatorRejected(data: {
  creatorName: string;
  creatorEmail: string;
  reason?: string;
}) {
  const { creatorName, creatorEmail, reason } = data;
  
  console.log('[DEMO] Email: notifyCreatorRejected');
  
  return { success: true, demo: true };

  // PRODUKCIJA
  /*
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: 'Tvoja prijava na UGC Executive',
      html: emailTemplates.creatorRejected({
        creatorName,
        reason: reason || 'Tvoj profil trenutno ne ispunjava naše kriterijume.',
        contactEmail: 'support@ugcselect.com',
      }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
  */
}

/**
 * Obavesti kreatora kada dobije novu recenziju
 */
export async function notifyCreatorNewReview(data: {
  creatorName: string;
  creatorEmail: string;
  businessName: string;
  rating: number;
}) {
  const { creatorName, creatorEmail, businessName, rating } = data;
  
  console.log('[DEMO] Email: notifyCreatorNewReview');
  
  return { success: true, demo: true };

  // PRODUKCIJA
  /*
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: `⭐ Nova recenzija od ${businessName}`,
      html: emailTemplates.creatorNewReview({
        creatorName,
        businessName,
        rating,
        dashboardUrl: `${APP_URL}/dashboard`,
      }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
  */
}

// ============================================
// BIZNIS NOTIFIKACIJE
// ============================================

/**
 * Dobrodošlica novom biznis korisniku nakon plaćanja
 */
export async function notifyBusinessWelcome(data: {
  companyName: string;
  email: string;
  plan: 'monthly' | 'yearly';
}) {
  const { companyName, email, plan } = data;
  
  console.log('[DEMO] Email: notifyBusinessWelcome');
  
  return { success: true, demo: true };

  // PRODUKCIJA
  /*
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '🎉 Dobrodošli na UGC Executive!',
      html: emailTemplates.businessWelcome({
        companyName,
        plan,
        searchUrl: `${APP_URL}/kreatori`,
        dashboardUrl: `${APP_URL}/dashboard`,
      }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
  */
}

/**
 * Obavesti biznis da je njihova recenzija odobrena
 */
export async function notifyBusinessReviewApproved(data: {
  companyName: string;
  email: string;
  creatorName: string;
}) {
  const { companyName, email, creatorName } = data;
  
  console.log('[DEMO] Email: notifyBusinessReviewApproved');
  
  return { success: true, demo: true };

  // PRODUKCIJA
  /*
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `✅ Tvoja recenzija za ${creatorName} je objavljena`,
      html: emailTemplates.businessReviewApproved({
        companyName,
        creatorName,
        creatorUrl: `${APP_URL}/kreatori`, // Would include actual creator URL
      }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
  */
}

/**
 * Obavesti biznis da pretplata uskoro ističe
 */
export async function notifyBusinessSubscriptionExpiring(data: {
  companyName: string;
  email: string;
  expiresAt: Date;
  daysLeft: number;
}) {
  const { companyName, email, expiresAt, daysLeft } = data;
  
  console.log('[DEMO] Email: notifyBusinessSubscriptionExpiring');
  
  return { success: true, demo: true };

  // PRODUKCIJA
  /*
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `⚠️ Tvoja pretplata ističe za ${daysLeft} dana`,
      html: emailTemplates.businessSubscriptionExpiring({
        companyName,
        expiresAt,
        daysLeft,
        renewUrl: `${APP_URL}/dashboard/settings`,
      }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
  */
}

// ============================================
// EXPORT SVE
// ============================================

export default {
  // Admin
  notifyAdminNewCreator,
  notifyAdminNewReview,
  // Creator
  notifyCreatorApproved,
  notifyCreatorRejected,
  notifyCreatorNewReview,
  // Business
  notifyBusinessWelcome,
  notifyBusinessReviewApproved,
  notifyBusinessSubscriptionExpiring,
};





