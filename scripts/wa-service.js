require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const AUTH_DIR = path.join(__dirname, '../wa_auth');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

let sock = null;

async function startWhatsAppBot() {
  console.log('[WA-Service] Memulai service Baileys WhatsApp Gateway...');

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Bizkit UMKM Platform', 'Chrome', '1.0.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('[WA-Service] QR Code baru diterima dari server WhatsApp Web!');
      try {
        await pool.query(
          `UPDATE "WhatsAppBotSession" 
           SET "status" = 'waiting_scan', "qrCode" = $1, "qrExpiresAt" = NOW() + INTERVAL '1 minute', "updatedAt" = NOW()
           WHERE id = 'primary'`,
          [qr]
        );
      } catch (err) {
        console.error('[WA-Service] Gagal update QR ke database:', err.message);
      }
    }

    if (connection === 'open') {
      const rawId = sock.user?.id || '';
      let botPhone = rawId.split(':')[0].replace(/[^0-9]/g, '');
      if (botPhone.startsWith('0')) botPhone = '62' + botPhone.slice(1);

      console.log(`[WA-Service] SUKSES! WhatsApp Bot Terhubung dengan nomor: +${botPhone}`);

      try {
        await pool.query(
          `UPDATE "WhatsAppBotSession" 
           SET "status" = 'connected', "phoneNumber" = $1, "connectedAt" = NOW(), "lastActiveAt" = NOW(), "updatedAt" = NOW()
           WHERE id = 'primary'`,
          [botPhone]
        );
      } catch (err) {
        console.error('[WA-Service] Gagal simpan status connected ke DB:', err.message);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[WA-Service] Koneksi terputus. Status code: ${statusCode}. Reconnect: ${shouldReconnect}`);

      if (statusCode === DisconnectReason.loggedOut) {
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          await pool.query(
            `UPDATE "WhatsAppBotSession" SET "status" = 'disconnected', "phoneNumber" = NULL, "updatedAt" = NOW() WHERE id = 'primary'`
          );
        } catch (e) {}
      }

      if (shouldReconnect) {
        setTimeout(startWhatsAppBot, 3000);
      }
    }
  });

  // Listener Pesan Masuk
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid || '';
      if (remoteJid.includes('@g.us')) continue; // abaikan grup

      const text = msg.message.conversation || 
                   msg.message.extendedTextMessage?.text || 
                   msg.message.imageMessage?.caption || '';

      if (!text.trim()) continue;

      const senderPhone = remoteJid.split('@')[0];
      console.log(`[WA-Service] Pesan masuk dari ${senderPhone}: "${text}"`);

      const webhookUrl = process.env.WA_WEBHOOK_URL || 
        (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook` : 'http://localhost:3000/api/whatsapp/webhook');

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: senderPhone, message: text })
        });

        const data = await response.json();
        if (data.reply) {
          console.log(`[WA-Service] Mengirim balasan ke ${senderPhone}...`);
          await sock.sendMessage(remoteJid, { text: data.reply });
        }
      } catch (err) {
        console.error('[WA-Service] Gagal meneruskan pesan ke webhook:', err.message);
      }
    }
  });
}

startWhatsAppBot().catch(err => {
  console.error('[WA-Service] Fatal error:', err);
});

