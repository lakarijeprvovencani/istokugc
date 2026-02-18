import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser, isAdmin } from '@/lib/auth-helper';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

async function requireAdmin() {
  const { user, error } = await getAuthUser();
  if (error) return { user: null, error };
  if (!user || !isAdmin(user)) {
    return { user: null, error: NextResponse.json({ error: 'Samo admin ima pristup' }, { status: 403 }) };
  }
  return { user, error: null };
}

// GET /api/admin/businesses - Dohvati sve biznise
export async function GET() {
  try {
    const { user, error: authError } = await requireAdmin();
    if (authError) return authError;
    const supabase = createAdminClient();

    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching businesses:', error);
      return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
    }

    // Transformiši podatke u format koji frontend očekuje
    const formattedBusinesses = businesses.map(b => ({
      id: b.id,
      companyName: b.company_name,
      email: b.email,
      phone: b.phone,
      website: b.website,
      industry: b.industry,
      description: b.description,
      subscriptionStatus: b.subscription_status || 'none',
      subscriptionType: b.subscription_type,
      // Konvertuj timestamp u YYYY-MM-DD format za HTML date input
      subscribedAt: b.subscribed_at ? new Date(b.subscribed_at).toISOString().split('T')[0] : null,
      expiresAt: b.expires_at ? new Date(b.expires_at).toISOString().split('T')[0] : null,
      stripeCustomerId: b.stripe_customer_id,
      stripeSubscriptionId: b.stripe_subscription_id,
      createdAt: b.created_at,
      userId: b.user_id,
    }));

    return NextResponse.json({ businesses: formattedBusinesses });

  } catch (error: any) {
    console.error('Businesses fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/businesses - Ažuriraj biznis
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { businessId, action, ...updateData } = body;

    const supabase = createAdminClient();

    // Ako je akcija otkazivanje pretplate
    if (action === 'cancel_subscription') {
      // Prvo dohvati biznis da bismo dobili Stripe subscription ID
      const { data: business, error: fetchError } = await supabase
        .from('businesses')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('id', businessId)
        .single();

      if (fetchError || !business) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }

      // Otkaži pretplatu u Stripe-u ako postoji
      if (business.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(business.stripe_subscription_id);
        } catch (stripeError: any) {
          console.error('Stripe cancel error:', stripeError);
          // Nastavi čak i ako Stripe fail-uje (možda je već otkazana)
        }
      }

      // Ažuriraj status u bazi
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          subscription_status: 'expired',
          stripe_subscription_id: null,
        })
        .eq('id', businessId);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update subscription status' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Subscription cancelled' });
    }

    // Standardni update biznisa
    const dbUpdateData: any = {};
    
    if (updateData.companyName !== undefined) dbUpdateData.company_name = updateData.companyName;
    if (updateData.email !== undefined) dbUpdateData.email = updateData.email;
    if (updateData.phone !== undefined) dbUpdateData.phone = updateData.phone;
    if (updateData.website !== undefined) dbUpdateData.website = updateData.website;
    if (updateData.industry !== undefined) dbUpdateData.industry = updateData.industry;
    if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
    if (updateData.subscriptionStatus !== undefined) dbUpdateData.subscription_status = updateData.subscriptionStatus;
    if (updateData.subscriptionType !== undefined) dbUpdateData.subscription_type = updateData.subscriptionType;
    if (updateData.subscribedAt !== undefined) dbUpdateData.subscribed_at = updateData.subscribedAt || null;
    if (updateData.expiresAt !== undefined) dbUpdateData.expires_at = updateData.expiresAt || null;

    const { data: business, error } = await supabase
      .from('businesses')
      .update(dbUpdateData)
      .eq('id', businessId)
      .select()
      .single();

    if (error) {
      console.error('Error updating business:', error);
      return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
    }

    return NextResponse.json({ success: true, business });

  } catch (error: any) {
    console.error('Business update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/businesses - Obriši biznis
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Dohvati biznis da bismo dobili user_id i Stripe podatke
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('user_id, stripe_customer_id, stripe_subscription_id')
      .eq('id', businessId)
      .single();

    if (fetchError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Otkaži Stripe pretplatu ako postoji
    if (business.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(business.stripe_subscription_id);
      } catch (e) {
        console.error('Error cancelling subscription:', e);
      }
    }

    // Obriši Stripe customera ako postoji
    if (business.stripe_customer_id) {
      try {
        await stripe.customers.del(business.stripe_customer_id);
      } catch (e) {
        console.error('Error deleting Stripe customer:', e);
      }
    }

    // Obriši creator_views koje je ovaj biznis napravio
    await supabase
      .from('creator_views')
      .delete()
      .eq('business_id', businessId);

    // Obriši biznis iz baze
    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', businessId);

    if (deleteError) {
      console.error('Error deleting business:', deleteError);
      return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
    }

    // Obriši korisnika iz Auth
    if (business.user_id) {
      const { error: authError } = await supabase.auth.admin.deleteUser(business.user_id);
      if (authError) {
        console.error('Error deleting auth user:', authError);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Business delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

