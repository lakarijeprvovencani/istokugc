/**
 * Admin Setup API - Dijagnostika i kreiranje admin korisnika
 * 
 * GET /api/admin/setup - Proveri status admina
 * GET /api/admin/setup?action=create - Kreiraj admina ako ne postoji u Auth
 * GET /api/admin/setup?action=reset - Resetuj admin lozinku
 * 
 * VAŽNO: Obriši ovaj fajl nakon što završiš setup!
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Ovaj endpoint je onemogućen u produkciji' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    const ADMIN_EMAIL = process.env.ADMIN_SETUP_EMAIL || 'admin@ugcadmin.com';
    const ADMIN_PASSWORD = process.env.ADMIN_SETUP_PASSWORD;

    if (!ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'ADMIN_SETUP_PASSWORD env varijabla nije podešena' }, { status: 500 });
    }
    
    // 1. Proveri da li admin postoji u public.users
    const { data: existingAdmin, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'admin')
      .single();
    
    // 2. Proveri da li admin postoji u auth.users
    let authUserExists = false;
    let authUserEmail = null;
    
    if (existingAdmin) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(u => u.id === existingAdmin.id);
      authUserExists = !!authUser;
      authUserEmail = authUser?.email;
    }
    
    // Dijagnostika - samo proveri status
    if (!action) {
      return NextResponse.json({
        diagnosis: {
          adminInUsersTable: !!existingAdmin,
          adminInAuthTable: authUserExists,
          adminId: existingAdmin?.id || null,
          adminEmail: existingAdmin?.email || null,
          authEmail: authUserEmail,
          problem: !existingAdmin 
            ? 'Admin ne postoji uopšte' 
            : !authUserExists 
              ? 'Admin postoji u users tabeli, ali NE u auth.users - ne može se ulogovati!'
              : 'Admin postoji u oba mesta - trebalo bi da radi',
        },
        availableActions: {
          create: '/api/admin/setup?action=create - Kreiraj admina u Auth ako ne postoji',
          reset: '/api/admin/setup?action=reset - Resetuj lozinku postojećeg admina',
        }
      });
    }
    
    // ACTION: CREATE - Kreiraj admina u Auth ako ne postoji
    if (action === 'create') {
      if (authUserExists) {
        return NextResponse.json({ 
          message: 'Admin već postoji u Auth! Probaj action=reset ako treba nova lozinka.',
          adminId: existingAdmin?.id 
        });
      }
      
      // Ako postoji u users ali ne u auth, trebamo ga dodati u auth
      if (existingAdmin && !authUserExists) {
        // Kreiraj u auth sa istim ID-jem
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          id: existingAdmin.id, // Koristi isti ID
          email: existingAdmin.email || ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { role: 'admin' }
        });
        
        if (authError) {
          return NextResponse.json({ 
            error: 'Greška pri kreiranju auth korisnika',
            details: authError.message 
          }, { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          message: 'Admin dodat u Auth!',
          adminId: existingAdmin.id,
          email: existingAdmin.email || ADMIN_EMAIL,
          instructions: 'Sada se možeš ulogovati!'
        });
      }
      
      // Ako ne postoji nigde, kreiraj sve
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'admin' }
      });
      
      if (authError) {
        return NextResponse.json({ 
          error: 'Greška pri kreiranju auth korisnika',
          details: authError.message 
        }, { status: 500 });
      }
      
      // Dodaj u users tabelu
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user!.id,
          email: ADMIN_EMAIL,
          role: 'admin',
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        await supabase.auth.admin.deleteUser(authData.user!.id);
        return NextResponse.json({ 
          error: 'Greška pri dodavanju u users tabelu',
          details: insertError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Admin kreiran!',
        adminId: authData.user!.id,
        email: ADMIN_EMAIL,
      });
    }
    
    // ACTION: RESET - Resetuj lozinku
    if (action === 'reset') {
      if (!existingAdmin) {
        return NextResponse.json({ 
          error: 'Admin ne postoji! Koristi action=create prvo.' 
        }, { status: 400 });
      }
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingAdmin.id,
        { 
          password: ADMIN_PASSWORD,
          email_confirm: true 
        }
      );
      
      if (updateError) {
        return NextResponse.json({ 
          error: 'Greška pri resetovanju lozinke',
          details: updateError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Lozinka resetovana!',
        email: existingAdmin.email,
      });
    }
    
    return NextResponse.json({ error: 'Nepoznata akcija' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Greška pri setup-u',
      details: error.message 
    }, { status: 500 });
  }
}

