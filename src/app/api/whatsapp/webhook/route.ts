import { NextResponse } from 'next/server';
import { handleIncomingWhatsAppMessage, cleanWhatsAppNumber } from '@/lib/whatsappMessageHandler';

// GET: Verifikasi Webhook
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('hub.challenge') || searchParams.get('challenge');
  if (challenge) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ status: 'online', service: 'Bizkit WhatsApp Gateway Webhook' });
}

// POST: Menerima Pesan Masuk WhatsApp secara Live
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support berbagai format payload gateway WhatsApp:
    // Format 1: { sender: "628123456789", message: "Catat pengeluaran 50rb" }
    // Format 2: { from: "628123456789@s.whatsapp.net", body: "..." }
    // Format 3: { phone: "08123456789", text: "..." }
    const phoneNumber = body.sender || body.from || body.phone || body.fromNumber || body.waId;
    const messageText = body.message || body.body || body.text || body.content || body.caption;

    if (!phoneNumber || !messageText) {
      return NextResponse.json({ error: 'Payload tidak lengkap: sender dan message dibutuhkan.' }, { status: 400 });
    }

    const result = await handleIncomingWhatsAppMessage(phoneNumber, messageText);

    return NextResponse.json({
      success: true,
      sender: cleanWhatsAppNumber(phoneNumber),
      reply: result.reply,
      actionTaken: result.actionTaken,
      keyUsedId: result.keyUsedId,
      latencyMs: result.latencyMs,
    });
  } catch (error: any) {
    console.error('Error handling WhatsApp webhook message:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
