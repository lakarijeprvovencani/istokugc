import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/auth/register/creator
// Registracija novog kreatora
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      email,
      password,
      name,
      bio,
      location,
      priceFrom,
      categories,
      platforms,
      languages,
      instagram,
      tiktok,
      youtube,
      phone,
      photo,
      portfolio,
    } = body;

    // Validacija
    if (!email || !password || !name || !bio || !location || !priceFrom) {
      return NextResponse.json(
        { error: 'Nedostaju obavezna polja' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Lozinka mora imati najmanje 6 karaktera' },
        { status: 400 }
      );
    }

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
    // email_confirm: true - NE zahteva email potvrdu (admin će odobriti profil)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Email je automatski potvrđen - admin odobrava profil
      user_metadata: {
        role: 'creator',
        name,
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
        role: 'creator',
      });

    if (userError) {
      console.error('User insert error:', userError);
      // Rollback - obriši auth korisnika
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Greška pri kreiranju korisnika u bazi' },
        { status: 500 }
      );
    }

    // 4. Kreiraj creator profil sa status='pending' (čeka admin odobrenje)
    const { data: creatorData, error: creatorError } = await supabaseAdmin
      .from('creators')
      .insert({
        user_id: authData.user.id,
        name,
        email,
        bio,
        location,
        price_from: parseInt(priceFrom) || 100,
        categories: categories || [],
        platforms: platforms || [],
        languages: languages || [],
        instagram: instagram || null,
        tiktok: tiktok || null,
        youtube: youtube || null,
        phone: phone || null,
        photo: photo || null,
        portfolio: portfolio || [],
        status: 'pending', // Čeka odobrenje admina
      })
      .select()
      .single();

    if (creatorError) {
      console.error('Creator insert error:', creatorError);
      // Rollback - obriši user i auth
      await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Greška pri kreiranju profila kreatora' },
        { status: 500 }
      );
    }

    console.log(`✅ Creator registered: ${email} - waiting for admin approval`);

    return NextResponse.json({
      success: true,
      message: 'Registracija uspešna! Tvoj profil čeka odobrenje.',
      userId: authData.user.id,
      creatorId: creatorData.id,
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Greška na serveru' },
      { status: 500 }
    );
  }
}
