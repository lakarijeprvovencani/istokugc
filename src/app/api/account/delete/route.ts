import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// DELETE /api/account/delete
// Briše nalog korisnika (business ili creator)
export async function DELETE(request: NextRequest) {
  try {
    const { userType, id, userId } = await request.json();

    if (!userType || !id) {
      return NextResponse.json(
        { error: 'User type and ID are required' },
        { status: 400 }
      );
    }

    // Brisanje zavisi od tipa korisnika
    if (userType === 'business') {
      // 0. Prvo dohvati business podatke za Stripe
      const { data: business } = await supabase
        .from('businesses')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('id', id)
        .single();
      
      // 1. Otkaži Stripe pretplatu ako postoji
      if (business?.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(business.stripe_subscription_id);
          console.log('Stripe subscription cancelled:', business.stripe_subscription_id);
        } catch (stripeError: any) {
          // Log ali nastavi - možda je već otkazana
          console.error('Error cancelling Stripe subscription:', stripeError.message);
        }
      }
      
      // 2. Obriši Stripe customer ako postoji (opcionalno)
      if (business?.stripe_customer_id) {
        try {
          await stripe.customers.del(business.stripe_customer_id);
          console.log('Stripe customer deleted:', business.stripe_customer_id);
        } catch (stripeError: any) {
          console.error('Error deleting Stripe customer:', stripeError.message);
        }
      }
      
      // 3. Obriši sve recenzije ovog biznisa
      await supabase.from('reviews').delete().eq('business_id', id);
      
      // 4. Obriši sve preglede kreatora
      await supabase.from('creator_views').delete().eq('business_id', id);
      
      // 5. Obriši business profil
      const { error: businessError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);
      
      if (businessError) {
        console.error('Error deleting business:', businessError);
        throw businessError;
      }
    } else if (userType === 'creator') {
      // 1. Obriši sve recenzije za ovog kreatora
      await supabase.from('reviews').delete().eq('creator_id', id);
      
      // 2. Obriši sve preglede ovog kreatora
      await supabase.from('creator_views').delete().eq('creator_id', id);
      
      // 3. Obriši creator profil
      const { error: creatorError } = await supabase
        .from('creators')
        .delete()
        .eq('id', id);
      
      if (creatorError) {
        console.error('Error deleting creator:', creatorError);
        throw creatorError;
      }
    }

    // 4. Obriši user record
    if (userId) {
      await supabase.from('users').delete().eq('id', userId);
      
      // 5. Obriši iz Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('Error deleting auth user:', authError);
        // Ne prekidamo - možda već ne postoji
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Nalog je uspešno obrisan',
    });

  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Greška pri brisanju naloga' },
      { status: 500 }
    );
  }
}

