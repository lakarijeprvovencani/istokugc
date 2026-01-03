import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/job-messages - Dohvati poruke za prijavu
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId je obavezan' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch messages for this application
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
export async function POST(request: NextRequest) {
  try {
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
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, recipientType, recipientId } = body;

    if (!applicationId || !recipientType || !recipientId) {
      return NextResponse.json(
        { error: 'applicationId, recipientType i recipientId su obavezni' },
        { status: 400 }
      );
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

