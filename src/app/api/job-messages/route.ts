import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-helper';

// GET /api/job-messages - Dohvati poruke za prijavu ili broj nepročitanih
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const countUnread = searchParams.get('countUnread');
    const recipientType = searchParams.get('recipientType');
    const recipientId = searchParams.get('recipientId');

    if (recipientId) {
      if (recipientType === 'creator' && user?.creatorId !== recipientId) {
        return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
      }
      if (recipientType === 'business' && user?.businessId !== recipientId) {
        return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
      }
    }

    const supabase = createAdminClient();

    // Count unread messages
    if (countUnread === 'true' && recipientType && recipientId) {
      
      // If applicationId is provided, count only for that specific chat
      if (applicationId) {
        const senderType = recipientType === 'business' ? 'creator' : 'business';
        
        const { count } = await supabase
          .from('job_messages')
          .select('id', { count: 'exact', head: true })
          .eq('application_id', applicationId)
          .eq('sender_type', senderType)
          .is('read_at', null);
        
        return NextResponse.json({ unreadCount: count || 0 });
      }
      
      // No applicationId - count across all conversations
      if (recipientType === 'business') {
        // Business: get jobs first, then applications, then count unread
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id')
          .eq('business_id', recipientId);
        
        const jobIds = jobs?.map(j => j.id) || [];
        
        if (jobIds.length === 0) {
          return NextResponse.json({ unreadCount: 0 });
        }
        
        const { data: applications } = await supabase
          .from('job_applications')
          .select('id')
          .in('job_id', jobIds)
          .in('status', ['accepted', 'engaged']);
        
        const appIds = applications?.map(a => a.id) || [];
        
        if (appIds.length === 0) {
          return NextResponse.json({ unreadCount: 0 });
        }
        
        const { count } = await supabase
          .from('job_messages')
          .select('id', { count: 'exact', head: true })
          .in('application_id', appIds)
          .eq('sender_type', 'creator')
          .is('read_at', null);
        
        return NextResponse.json({ unreadCount: count || 0 });
        
      } else {
        // Creator: get their applications, then count unread
        const { data: applications } = await supabase
          .from('job_applications')
          .select('id')
          .eq('creator_id', recipientId)
          .in('status', ['accepted', 'engaged']);
        
        const appIds = applications?.map(a => a.id) || [];
        
        if (appIds.length === 0) {
          return NextResponse.json({ unreadCount: 0 });
        }
        
        const { count } = await supabase
          .from('job_messages')
          .select('id', { count: 'exact', head: true })
          .in('application_id', appIds)
          .eq('sender_type', 'business')
          .is('read_at', null);
        
        return NextResponse.json({ unreadCount: count || 0 });
      }
    }

    // Regular message fetch for specific application
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId je obavezan' }, { status: 400 });
    }

    // Verify user is a participant in this application
    if (user?.role !== 'admin') {
      const { data: app } = await supabase
        .from('job_applications')
        .select('creator_id, job_id')
        .eq('id', applicationId)
        .single();

      if (app) {
        const { data: job } = await supabase
          .from('jobs')
          .select('business_id')
          .eq('id', app.job_id)
          .single();

        const isParticipant = 
          user?.creatorId === app.creator_id || 
          user?.businessId === job?.business_id;

        if (!isParticipant) {
          return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
        }
      }
    }

    const { data: messages, error } = await supabase
      .from('job_messages')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ messages: [] });
    }

    // Format messages
    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      applicationId: msg.application_id,
      senderType: msg.sender_type,
      senderId: msg.sender_id,
      message: msg.message,
      readAt: msg.read_at,
      createdAt: msg.created_at,
    }));

    return NextResponse.json({ messages: formattedMessages });

  } catch (error: any) {
    console.error('Messages fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/job-messages - Pošalji novu poruku
// ZAŠTIĆENO: Samo učesnici u konverzaciji mogu slati poruke
export async function POST(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const body = await request.json();
    const { applicationId, senderType, senderId, message } = body;

    if (!applicationId || !senderType || !senderId || !message) {
      return NextResponse.json(
        { error: 'applicationId, senderType, senderId i message su obavezni' },
        { status: 400 }
      );
    }

    if (!['business', 'creator'].includes(senderType)) {
      return NextResponse.json({ error: 'senderType mora biti business ili creator' }, { status: 400 });
    }
    
    // 🔒 BEZBEDNOSNA PROVERA: senderId mora odgovarati ulogovanom korisniku
    if (senderType === 'creator' && user?.creatorId !== senderId) {
      return NextResponse.json({ 
        error: 'Nemate dozvolu da šaljete poruke kao ovaj kreator'
      }, { status: 403 });
    }
    if (senderType === 'business' && user?.businessId !== senderId) {
      return NextResponse.json({ 
        error: 'Nemate dozvolu da šaljete poruke kao ovaj biznis'
      }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Verify that the application exists and sender has access
    const { data: application } = await supabase
      .from('job_applications')
      .select('id, job_id, creator_id, status')
      .eq('id', applicationId)
      .single();

    if (!application) {
      return NextResponse.json({ error: 'Prijava ne postoji' }, { status: 404 });
    }

    // Only allow messages if application is accepted or engaged
    if (application.status !== 'accepted' && application.status !== 'engaged') {
      return NextResponse.json(
        { error: 'Poruke su dostupne samo za prihvaćene prijave' },
        { status: 400 }
      );
    }

    // Insert message
    const { data: newMessage, error } = await supabase
      .from('job_messages')
      .insert({
        application_id: applicationId,
        sender_type: senderType,
        sender_id: senderId,
        message: message.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({
      message: {
        id: newMessage.id,
        applicationId: newMessage.application_id,
        senderType: newMessage.sender_type,
        senderId: newMessage.sender_id,
        message: newMessage.message,
        readAt: newMessage.read_at,
        createdAt: newMessage.created_at,
      }
    });

  } catch (error: any) {
    console.error('Message creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/job-messages - Označi poruke kao pročitane
// ZAŠTIĆENO: Samo učesnici u konverzaciji mogu označiti poruke kao pročitane
export async function PUT(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const body = await request.json();
    const { applicationId, recipientType, recipientId } = body;

    if (!applicationId || !recipientType || !recipientId) {
      return NextResponse.json(
        { error: 'applicationId, recipientType i recipientId su obavezni' },
        { status: 400 }
      );
    }
    
    // 🔒 BEZBEDNOSNA PROVERA: recipientId mora odgovarati ulogovanom korisniku
    if (recipientType === 'creator' && user?.creatorId !== recipientId) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }
    if (recipientType === 'business' && user?.businessId !== recipientId) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Mark all unread messages from the OTHER party as read
    const senderType = recipientType === 'business' ? 'creator' : 'business';
    
    const { error } = await supabase
      .from('job_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('application_id', applicationId)
      .eq('sender_type', senderType)
      .is('read_at', null);

    if (error) {
      console.error('Error marking messages as read:', error);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


