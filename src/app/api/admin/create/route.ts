import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/admin/create - Kreiraj admin nalog (samo za development)
export async function POST(request: NextRequest) {
  try {
    const { email, password, secretKey } = await request.json();

    // Proveri secret key za sigurnost
    if (secretKey !== 'CREATE_ADMIN_2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // 1. Kreiraj korisnika u Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatski potvrdi email
      user_metadata: {
        role: 'admin',
        name: 'Admin',
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // 2. Dodaj u users tabelu sa role='admin'
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role: 'admin',
      });

    if (userError) {
      console.error('User table error:', userError);
      // Rollback - obriši auth korisnika
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin nalog uspešno kreiran!',
      userId: authData.user.id,
      email: authData.user.email,
    });

  } catch (error: any) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}





