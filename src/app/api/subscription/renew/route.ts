import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { businessId, plan, stripeCustomerId, stripeSubscriptionId } = await request.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Izračunaj datum isteka
    const now = new Date();
    let expiresAt = new Date(now);
    if (plan === 'yearly') {
      expiresAt.setFullYear(now.getFullYear() + 1);
    } else {
      expiresAt.setMonth(now.getMonth() + 1);
    }

    // Ažuriraj pretplatu u bazi - probaj prvo po id, pa po user_id
    let updateResult = await supabase
      .from('businesses')
      .update({
        subscription_status: 'active',
        subscription_type: plan || 'monthly',
        subscribed_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
      })
      .eq('id', businessId);

    // Ako nije pronađen po id, probaj po user_id
    if (updateResult.error || updateResult.count === 0) {
      updateResult = await supabase
        .from('businesses')
        .update({
          subscription_status: 'active',
          subscription_type: plan || 'monthly',
          subscribed_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
        })
        .eq('user_id', businessId);
    }

    if (updateResult.error) {
      console.error('Error updating subscription:', updateResult.error);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Pretplata uspešno obnovljena',
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error: any) {
    console.error('Subscription renewal error:', error);
    return NextResponse.json(
      { error: error.message || 'Greška pri obnovi pretplate' },
      { status: 500 }
    );
  }
}




