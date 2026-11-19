import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getWhatsAppKeyPoolStatus, resetWhatsAppKeyPool } from '@/lib/groqWhatsAppClient';
import { handleIncomingWhatsAppMessage, cleanWhatsAppNumber } from '@/lib/whatsappMessageHandler';
import QRCode from 'qrcode';

// GET: Ambil status bot WA dari database & pool load balancer 5 key Groq
export async function GET() {
  try {
    const client = await pool.connect();
    let sessionData = null;
    let registeredUsersCount = 0;

    try {
      const res = await client.query(`SELECT * FROM "WhatsAppBotSession" WHERE id = 'primary' LIMIT 1`);
      if (res.rows.length > 0) {
        sessionData = res.rows[0];
      }

      const countRes = await client.query(`SELECT COUNT(*) as count FROM "User" WHERE "isWaConnected" = TRUE`);
      registeredUsersCount = Number(countRes.rows[0]?.count || 0);
    } finally {
      client.release();
    }

    const keyPool = getWhatsAppKeyPoolStatus();
    const qrString = sessionData?.qrCode || `2@BIZKIT-WA-AUTH-${Date.now()}-SESSION,${Math.random().toString(36).substring(2, 10)}`;
    
    // Generate QR Code standar normal berkualitas tinggi
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        width: 320,
        margin: 1,
        color: {
          dark: '#18181b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (e) {
      console.error('Failed to generate QR data URL:', e);
    }

    const session = sessionData ? {
      status: sessionData.status,
      phoneNumber: sessionData.phoneNumber || '+62 821-4567-8900',
      botName: 'Bizkit AI Assistant',
      deviceInfo: 'WhatsApp Web (Chrome / Windows)',
      connectedAt: sessionData.connectedAt,
      lastPingAt: sessionData.lastActiveAt,
      qrCodeString: qrString,
      qrCodeDataUrl,
      qrExpiresAt: sessionData.qrExpiresAt ? new Date(sessionData.qrExpiresAt).getTime() : Date.now() + 60000,
      totalMessagesReceived: sessionData.totalMessages || 0,
      totalTransactionsProcessed: sessionData.totalTransactions || 0,
      registeredUsersCount,
    } : {
      status: 'waiting_scan',
      phoneNumber: null,
      botName: 'Bizkit AI Assistant',
      deviceInfo: 'WhatsApp Web (Chrome / Windows)',
      connectedAt: null,
      lastPingAt: new Date().toISOString(),
      qrCodeString: qrString,
      qrCodeDataUrl,
      qrExpiresAt: Date.now() + 60000,
      totalMessagesReceived: 0,
      totalTransactionsProcessed: 0,
      registeredUsersCount,
    };

    return NextResponse.json({
      success: true,
      session,
      keyPool,
      model: process.env.GROQ_WA_MODEL || 'qwen/qwen3.8-27b',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Aksi barcode scan, refresh, simulasi koneksi, & uji coba real WhatsApp Handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phoneNumber, messageText, prompt } = body;

    const client = await pool.connect();

    try {
      if (action === 'refresh_qr') {
        const newQr = `2@BIZKIT-WA-AUTH-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const newExpiry = new Date(Date.now() + 60000);

        await client.query(
          `UPDATE "WhatsAppBotSession" 
           SET "status" = 'waiting_scan', "qrCode" = $1, "qrExpiresAt" = $2, "updatedAt" = NOW()
           WHERE id = 'primary'`,
          [newQr, newExpiry]
        );

        let qrCodeDataUrl = '';
        try {
          qrCodeDataUrl = await QRCode.toDataURL(newQr, {
            width: 320,
            margin: 1,
            color: { dark: '#18181b', light: '#ffffff' },
            errorCorrectionLevel: 'M'
          });
        } catch (e) {
          console.error(e);
        }

        return NextResponse.json({ 
          success: true, 
          message: 'QR Code berhasil diperbarui di database',
          qrCodeString: newQr,
          qrCodeDataUrl,
          qrExpiresAt: newExpiry.getTime()
        });
      }

      if (action === 'simulate_connect') {
        const phone = phoneNumber || '+62 821-4567-8900';
        await client.query(
          `UPDATE "WhatsAppBotSession" 
           SET "status" = 'connected', "phoneNumber" = $1, "connectedAt" = NOW(), "lastActiveAt" = NOW(), "updatedAt" = NOW()
           WHERE id = 'primary'`,
          [phone]
        );

        return NextResponse.json({ 
          success: true, 
          message: 'WhatsApp Bot berhasil terhubung ke server database!',
          status: 'connected',
          phoneNumber: phone,
        });
      }

      if (action === 'disconnect') {
        await client.query(
          `UPDATE "WhatsAppBotSession" 
           SET "status" = 'disconnected', "phoneNumber" = NULL, "connectedAt" = NULL, "updatedAt" = NOW()
           WHERE id = 'primary'`
        );

        return NextResponse.json({ 
          success: true, 
          message: 'Koneksi WhatsApp Bot telah diputus',
          status: 'disconnected'
        });
      }

      if (action === 'reset_keys') {
        const updatedPool = resetWhatsAppKeyPool();
        return NextResponse.json({
          success: true,
          message: 'Pool API Key Groq berhasil disegarkan dan status dipulihkan!',
          keyPool: updatedPool,
        });
      }

      // Live processing via Real WhatsApp Handler
      if (action === 'test_ai' || action === 'send_chat') {
        const text = messageText || prompt;
        if (!text) {
          return NextResponse.json({ success: false, message: 'Pesan tidak boleh kosong' }, { status: 400 });
        }

        const sender = cleanWhatsAppNumber(phoneNumber || '6281299887766');
        const processResult = await handleIncomingWhatsAppMessage(sender, text);

        return NextResponse.json({
          success: true,
          reply: processResult.reply,
          userId: processResult.userId,
          actionTaken: processResult.actionTaken,
          keyUsedId: processResult.keyUsedId,
          latencyMs: processResult.latencyMs,
          updatedKeyPool: getWhatsAppKeyPoolStatus(),
        });
      }

      return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' }, { status: 400 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error in WhatsApp admin route:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
