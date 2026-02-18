/**
 * Email Templates
 * 
 * HTML template-i za sve email notifikacije.
 * Dizajnirani su da budu čisti i responsive.
 * 
 * Koriste se inline stilove jer mnogi email klijenti
 * ne podržavaju eksterne CSS fajlove.
 * 
 * ============================================
 * GDE SE ŠALJU EMAIL NOTIFIKACIJE
 * ============================================
 * 
 * KREATOR FLOW:
 * 1. Registracija kreatora (/register/kreator završen)
 *    → Kreator dobija: creatorPendingConfirmation
 *    → Admin dobija: adminNewCreator
 *    → Lokacija u kodu: src/app/register/kreator/page.tsx (handleSubmit)
 * 
 * 2. Admin odobri kreatora (/admin - handleApprove)
 *    → Kreator dobija: creatorApproved
 *    → Lokacija u kodu: src/app/admin/page.tsx (handleApprove)
 * 
 * 3. Admin odbije kreatora (/admin - handleReject)
 *    → Kreator dobija: creatorRejected (sa razlogom)
 *    → Lokacija u kodu: src/app/admin/page.tsx (handleReject)
 * 
 * 4. Recenzija odobrena
 *    → Kreator dobija: creatorNewReview
 *    → Biznis dobija: businessReviewApproved
 *    → Lokacija u kodu: src/app/admin/page.tsx (approveReview)
 * 
 * BUSINESS FLOW:
 * 1. Uspešno plaćanje (/checkout/success)
 *    → Biznis dobija: businessWelcome
 *    → Lokacija u kodu: src/app/checkout/success/page.tsx ili Stripe webhook
 * 
 * 2. Pretplata ističe za 7 dana
 *    → Biznis dobija: businessSubscriptionExpiring
 *    → Lokacija u kodu: Cron job ili Stripe webhook (invoice.upcoming)
 * 
 * 3. Pretplata istekla
 *    → Biznis dobija: email obaveštenje
 *    → Lokacija u kodu: Stripe webhook (customer.subscription.deleted)
 * 
 * ADMIN NOTIFIKACIJE:
 * 1. Novi kreator aplicira → adminNewCreator
 * 2. Nova recenzija čeka → adminNewReview
 * 
 * ============================================
 * INTEGRACIJA SA BAZOM (TODO za produkciju):
 * ============================================
 * - Koristiti SendGrid, Resend ili AWS SES za slanje
 * - Čuvati log svih poslatih emailova u bazi
 * - Omogućiti korisnicima da se odjave od nekih notifikacija
 * - Rate limiting za sprečavanje spam-a
 */

// Brand colors
const COLORS = {
  primary: '#000000',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  muted: '#737373',
  background: '#f5f5f5',
  white: '#ffffff',
  border: '#e5e5e5',
};

// Base layout wrapper
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UGC Executive</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${COLORS.background};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid ${COLORS.border};">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: ${COLORS.primary};">UGC Executive</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${COLORS.background}; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: ${COLORS.muted};">
                © ${new Date().getFullYear()} UGC Executive. Sva prava zadržana.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: ${COLORS.muted};">
                Ovaj email je poslat sa UGC Executive platforme.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Button component
const button = (text: string, url: string, color: string = COLORS.primary) => `
<a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: ${color}; color: ${COLORS.white}; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
  ${text}
</a>
`;

// Star rating display
const starRating = (rating: number) => {
  const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  return `<span style="font-size: 18px;">${stars}</span>`;
};

// ============================================
// ADMIN TEMPLATES
// ============================================

export const emailTemplates = {
  /**
   * Admin: Novi kreator je aplicirao
   */
  adminNewCreator: (data: {
    creatorName: string;
    creatorEmail: string;
    categories: string[];
    location: string;
    adminUrl: string;
  }) => baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: ${COLORS.primary};">
      🆕 Novi kreator je aplicirao
    </h2>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Novi kreator je podneo prijavu za kreiranje profila na UGC Executive platformi.
    </p>
    
    <table role="presentation" style="width: 100%; background-color: ${COLORS.background}; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: ${COLORS.primary};">${data.creatorName}</p>
          <p style="margin: 0 0 4px 0; font-size: 14px; color: ${COLORS.muted};">📧 ${data.creatorEmail}</p>
          <p style="margin: 0 0 4px 0; font-size: 14px; color: ${COLORS.muted};">📍 ${data.location}</p>
          <p style="margin: 0; font-size: 14px; color: ${COLORS.muted};">🏷️ ${data.categories.join(', ')}</p>
        </td>
      </tr>
    </table>
    
    <div style="text-align: center;">
      ${button('Pregledaj u admin panelu →', data.adminUrl)}
    </div>
  `),

  /**
   * Admin: Nova recenzija čeka odobrenje
   */
  adminNewReview: (data: {
    businessName: string;
    creatorName: string;
    rating: number;
    comment: string;
    adminUrl: string;
  }) => baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: ${COLORS.primary};">
      ⭐ Nova recenzija čeka odobrenje
    </h2>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      <strong>${data.businessName}</strong> je ostavio recenziju za <strong>${data.creatorName}</strong>.
    </p>
    
    <table role="presentation" style="width: 100%; background-color: ${COLORS.background}; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <div style="margin-bottom: 12px;">${starRating(data.rating)}</div>
          <p style="margin: 0; color: ${COLORS.primary}; line-height: 1.6; font-style: italic;">
            "${data.comment.length > 200 ? data.comment.substring(0, 200) + '...' : data.comment}"
          </p>
        </td>
      </tr>
    </table>
    
    <div style="text-align: center;">
      ${button('Pregledaj recenziju →', data.adminUrl)}
    </div>
  `),

  // ============================================
  // CREATOR TEMPLATES
  // ============================================

  /**
   * Kreator: Potvrda registracije (profil na čekanju)
   * Šalje se: Odmah nakon uspešne registracije
   */
  creatorPendingConfirmation: (data: {
    creatorName: string;
    email: string;
  }) => baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: ${COLORS.primary};">
      🎉 Hvala na prijavi!
    </h2>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Zdravo ${data.creatorName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Hvala ti što si se prijavila/o na UGC Executive platformu! Tvoja prijava je uspešno primljena i nalazi se na čekanju za pregled.
    </p>
    
    <table role="presentation" style="width: 100%; background-color: #fffbeb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; color: ${COLORS.warning}; font-weight: 500;">⏳ Šta se dalje dešava?</p>
          <ul style="margin: 0; padding-left: 20px; color: ${COLORS.muted};">
            <li>Naš tim će pregledati tvoj profil u najkraćem roku</li>
            <li>Obično to traje do 24 sata</li>
            <li>Dobićeš email obaveštenje o statusu</li>
          </ul>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      U međuvremenu, možeš se prijaviti na svoj nalog i videti status svoje prijave.
    </p>
    
    <p style="margin: 0; font-size: 14px; color: ${COLORS.muted};">
      Registrovani email: <strong>${data.email}</strong>
    </p>
  `),

  /**
   * Kreator: Profil odobren
   * Šalje se: Kada admin odobri profil
   */
  creatorApproved: (data: {
    creatorName: string;
    profileUrl: string;
    dashboardUrl: string;
  }) => baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: ${COLORS.success};">
      ✅ Čestitamo! Tvoj profil je odobren!
    </h2>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Zdravo ${data.creatorName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Drago nam je da te obavestimo da je tvoj kreatorski profil na UGC Executive platformi odobren! 
      Tvoj profil je sada vidljiv brendovima koji traže UGC kreatore.
    </p>
    
    <table role="presentation" style="width: 100%; background-color: #f0fdf4; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0; color: ${COLORS.success}; font-weight: 500;">Šta dalje?</p>
          <ul style="margin: 12px 0 0 0; padding-left: 20px; color: ${COLORS.muted};">
            <li>Brendovi će moći da te kontaktiraju direktno</li>
            <li>Prati svoj dashboard za nove upite</li>
            <li>Redovno ažuriraj svoj portfolio</li>
          </ul>
        </td>
      </tr>
    </table>
    
    <div style="text-align: center;">
      ${button('Pogledaj svoj dashboard →', data.dashboardUrl)}
    </div>
  `),

  /**
   * Kreator: Profil odbijen
   */
  creatorRejected: (data: {
    creatorName: string;
    reason: string;
    contactEmail: string;
  }) => baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: ${COLORS.primary};">
      Tvoja prijava na UGC Executive
    </h2>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Zdravo ${data.creatorName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Nažalost, nismo u mogućnosti da odobrimo tvoj kreatorski profil u ovom trenutku.
    </p>
    
    <table role="presentation" style="width: 100%; background-color: #fef2f2; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; color: ${COLORS.error}; font-weight: 500;">Razlog:</p>
          <p style="margin: 0; color: ${COLORS.muted};">${data.reason}</p>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Možeš ponovo aplicirati nakon što unapređeneš svoj profil i portfolio. 
      Ako imaš bilo kakva pitanja, slobodno nam se obrati na 
      <a href="mailto:${data.contactEmail}" style="color: ${COLORS.primary};">${data.contactEmail}</a>.
    </p>
  `),

  /**
   * Kreator: Nova recenzija (nakon što admin odobri)
   */
  creatorNewReview: (data: {
    creatorName: string;
    businessName: string;
    rating: number;
    dashboardUrl: string;
  }) => baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: ${COLORS.primary};">
      ⭐ Nova recenzija na tvom profilu!
    </h2>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Zdravo ${data.creatorName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      <strong>${data.businessName}</strong> je ostavio recenziju na tvom profilu!
    </p>
    
    <table role="presentation" style="width: 100%; background-color: ${COLORS.background}; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 8px;">${starRating(data.rating)}</div>
          <p style="margin: 0; color: ${COLORS.muted};">Ocena: ${data.rating}/5</p>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Možeš odgovoriti na ovu recenziju sa svog dashboard-a.
    </p>
    
    <div style="text-align: center;">
      ${button('Pogledaj recenziju →', data.dashboardUrl)}
    </div>
  `),

  // ============================================
  // BUSINESS TEMPLATES
  // ============================================

  /**
   * Biznis: Dobrodošlica nakon plaćanja
   */
  businessWelcome: (data: {
    companyName: string;
    plan: 'monthly' | 'yearly';
    searchUrl: string;
    dashboardUrl: string;
  }) => baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: ${COLORS.success};">
      🎉 Dobrodošli na UGC Executive!
    </h2>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Zdravo ${data.companyName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Hvala ti što si se pridružio UGC Executive platformi! Tvoj ${data.plan === 'yearly' ? 'godišnji' : 'mesečni'} plan je aktiviran.
    </p>
    
    <table role="presentation" style="width: 100%; background-color: #f0fdf4; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 12px 0; color: ${COLORS.success}; font-weight: 500;">Tvoj plan uključuje:</p>
          <ul style="margin: 0; padding-left: 20px; color: ${COLORS.muted};">
            <li>Pristup svim kreatorima</li>
            <li>Kontakt informacije kreatora</li>
            <li>Neograničena pretraga</li>
            <li>Email podrška</li>
            ${data.plan === 'yearly' ? '<li>Prioritetna podrška</li>' : ''}
          </ul>
        </td>
      </tr>
    </table>
    
    <div style="text-align: center;">
      ${button('Pretraži kreatore →', data.searchUrl)}
    </div>
  `),

  /**
   * Biznis: Recenzija odobrena
   */
  businessReviewApproved: (data: {
    companyName: string;
    creatorName: string;
    creatorUrl: string;
  }) => baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: ${COLORS.success};">
      ✅ Tvoja recenzija je objavljena!
    </h2>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Zdravo ${data.companyName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Tvoja recenzija za <strong>${data.creatorName}</strong> je pregledana i objavljena na platformi. 
      Hvala ti što pomažeš drugima da pronađu kvalitetne kreatore!
    </p>
    
    <div style="text-align: center;">
      ${button('Pogledaj recenziju →', data.creatorUrl)}
    </div>
  `),

  /**
   * Biznis: Pretplata ističe (7 dana pre)
   * Šalje se: Stripe webhook (invoice.upcoming) ili cron job
   */
  businessSubscriptionExpiring: (data: {
    companyName: string;
    expiresAt: Date;
    daysLeft: number;
    renewUrl: string;
  }) => baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: ${COLORS.warning};">
      ⚠️ Tvoja pretplata ističe za ${data.daysLeft} ${data.daysLeft === 1 ? 'dan' : 'dana'}
    </h2>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Zdravo ${data.companyName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Tvoja pretplata na UGC Executive ističe 
      <strong>${data.expiresAt.toLocaleDateString('sr-RS', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
    </p>
    
    <table role="presentation" style="width: 100%; background-color: #fffbeb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0; color: ${COLORS.warning};">
            Nakon isteka, nećeš imati pristup kontakt informacijama kreatora. 
            Obnovi pretplatu da nastaviš korišćenje platforme.
          </p>
        </td>
      </tr>
    </table>
    
    <div style="text-align: center;">
      ${button('Obnovi pretplatu →', data.renewUrl)}
    </div>
  `),

  /**
   * Biznis: Pretplata istekla
   * Šalje se: Stripe webhook (customer.subscription.deleted)
   */
  businessSubscriptionExpired: (data: {
    companyName: string;
    renewUrl: string;
  }) => baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: ${COLORS.error};">
      ❌ Tvoja pretplata je istekla
    </h2>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Zdravo ${data.companyName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Tvoja pretplata na UGC Executive je istekla. Više nemaš pristup kontakt informacijama kreatora.
    </p>
    
    <table role="presentation" style="width: 100%; background-color: #fef2f2; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 12px 0; color: ${COLORS.error}; font-weight: 500;">Šta gubim bez pretplate?</p>
          <ul style="margin: 0; padding-left: 20px; color: ${COLORS.muted};">
            <li>Pristup kontakt informacijama kreatora</li>
            <li>Mogućnost ostavljanja recenzija</li>
            <li>Sačuvane favorite</li>
          </ul>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Obnovi pretplatu da ponovo dobiješ pristup svim funkcijama.
    </p>
    
    <div style="text-align: center;">
      ${button('Obnovi pretplatu →', data.renewUrl, COLORS.primary)}
    </div>
  `),

  /**
   * Biznis: Pretplata uspešno obnovljena
   * Šalje se: Stripe webhook (invoice.paid)
   */
  businessSubscriptionRenewed: (data: {
    companyName: string;
    plan: 'monthly' | 'yearly';
    nextBillingDate: Date;
    dashboardUrl: string;
  }) => baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: ${COLORS.success};">
      ✅ Pretplata uspešno obnovljena!
    </h2>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Zdravo ${data.companyName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${COLORS.muted}; line-height: 1.6;">
      Tvoja ${data.plan === 'yearly' ? 'godišnja' : 'mesečna'} pretplata je uspešno obnovljena. 
      Hvala ti što nastavljaš da koristiš UGC Executive!
    </p>
    
    <table role="presentation" style="width: 100%; background-color: #f0fdf4; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; font-weight: 500; color: ${COLORS.success};">Detalji pretplate:</p>
          <p style="margin: 0 0 4px 0; color: ${COLORS.muted};">Plan: ${data.plan === 'yearly' ? 'Godišnji' : 'Mesečni'}</p>
          <p style="margin: 0; color: ${COLORS.muted};">Sledeće plaćanje: ${data.nextBillingDate.toLocaleDateString('sr-RS', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </td>
      </tr>
    </table>
    
    <div style="text-align: center;">
      ${button('Nastavi sa korišćenjem →', data.dashboardUrl)}
    </div>
  `),
};

export default emailTemplates;





