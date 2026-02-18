import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthLimiter, checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { businessRegistrationSchema, validate } from '@/lib/validations';

// POST /api/auth/register/business
// Registracija novog biznisa (poziva se nakon uspešnog Stripe plaćanja)
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkRateLimit(getAuthLimiter(), getClientIp(request));
    if (rateLimited) return rateLimited;

    const body = await request.json();
    
    const { data: validated, error: validationError } = validate(businessRegistrationSchema, body);
    if (validationError || !validated) {
      return NextResponse.json({ error: validationError || 'Nevažeći podaci' }, { status: 400 });
    }

    const {
      email,
      password,
      companyName,
      phone,
      website,
      industry,
      description,
      plan,
      stripeCustomerId,
      stripeSubscriptionId,
    } = validated;

    // Kreiraj Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 1. Proveri da li email već postoji
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    
    if (emailExists) {
      return NextResponse.json(
        { error: 'Email adresa je već registrovana' },
        { status: 400 }
      );
    }

    // 2. Kreiraj korisnika u Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Business ne treba email verifikaciju jer su platili
      user_metadata: {
        role: 'business',
        companyName,
      },
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Greška pri kreiranju korisnika' },
        { status: 500 }
      );
    }

    // 3. Kreiraj user record u našoj tabeli
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role: 'business',
      });

    if (userError) {
      console.error('User insert error:', userError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Greška pri kreiranju korisnika u bazi' },
        { status: 500 }
      );
    }

    // 4. Izračunaj datum isteka pretplate
    const subscribedAt = new Date();
    const expiresAt = new Date();
    if (plan === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // 5. Kreiraj business profil sa Stripe podacima
    const { data: businessData, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({
        user_id: authData.user.id,
        company_name: companyName,
        email,
        phone: phone || null,
        website: website || null,
        industry: industry || null,
        description: description || null,
        subscription_type: plan || 'monthly',
        subscription_status: 'active',
        subscribed_at: subscribedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        stripe_customer_id: stripeCustomerId || null,
        stripe_subscription_id: stripeSubscriptionId || null,
      })
      .select()
      .single();

    if (businessError) {
      console.error('Business insert error:', businessError);
      await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Greška pri kreiranju poslovnog profila' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registracija uspešna!',
      userId: authData.user.id,
      businessId: businessData.id,
      companyName: businessData.company_name,
    });

  } catch (error) {
    console.error('Business registration error:', error);
    return NextResponse.json(
      { error: 'Greška na serveru' },
      { status: 500 }
    );
  }
}
