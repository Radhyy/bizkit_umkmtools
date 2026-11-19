import pool from '@/lib/db';
import { chatWhatsAppGroq } from '@/lib/groqWhatsAppClient';
import crypto from 'crypto';

export interface WhatsAppProcessResult {
  reply: string;
  userId?: string;
  isTransactionExtracted?: boolean;
  keyUsedId?: number;
  latencyMs?: number;
  actionTaken?: 'token_bound' | 'token_invalid' | 'token_required' | 'confirmed_saved' | 'cancelled' | 'pending_confirmation' | 'report_generated' | 'chat_replied';
}

/**
 * Normalisasi format nomor WhatsApp (hanya angka, tanpa +, spasi, atau @s.whatsapp.net)
 */
export function cleanWhatsAppNumber(phone: string): string {
  let clean = phone.replace(/@.*$/, '').replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return clean;
}

/**
 * Format angka ke format mata uang Rupiah
 */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Smart Fallback Parser Bahasa Indonesia untuk Transaksi Keuangan UMKM
 * Berjalan otomatis jika API AI sedang cooldown, jaringan diblokir Cloudflare, atau offline.
 */
export function parseLocalIndonesianTransaction(text: string): {
  isTransaction: boolean;
  tipe?: 'masuk' | 'keluar';
  jumlah?: number;
  kategori?: string;
  deskripsi?: string;
} {
  const lower = text.toLowerCase().trim();

  // Abaikan jika pesan merupakan format token (misal BIZ-123456)
  if (/^BIZ-?\d+/i.test(lower)) {
    return { isTransaction: false };
  }

  // 1. Ekstrak Nominal Rupiah
  let jumlah = 0;
  // Format: 1.5jt / 1,5 juta / 2 jt
  const jutaMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/i);
  if (jutaMatch) {
    const rawVal = parseFloat(jutaMatch[1].replace(',', '.'));
    jumlah = Math.round(rawVal * 1000000);
  } else {
    // Format: 45rb / 45k / 45 ribu
    const ribuMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu)\b/i);
    if (ribuMatch) {
      const rawVal = parseFloat(ribuMatch[1].replace(',', '.'));
      jumlah = Math.round(rawVal * 1000);
    } else {
      // Format: Rp 45.000 / 45000 / Rp. 150,000
      const standardMatch = lower.match(/(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,10})/i);
      if (standardMatch) {
        const rawDigits = standardMatch[1].replace(/[.,]/g, '');
        jumlah = parseInt(rawDigits, 10);
      }
    }
  }

  if (!jumlah || isNaN(jumlah) || jumlah <= 0) {
    return { isTransaction: false };
  }

  // 2. Deteksi Tipe (Masuk / Keluar)
  const isMasuk = /\b(pemasukan|masuk|omset|pendapatan|terima|dapat|jual|penjualan|laku|transferan|diterima)\b/i.test(lower);
  const isKeluar = /\b(pengeluaran|keluar|beli|bayar|ongkir|belanja|biaya|tagihan|gaji|sewa|tarik|kulakan)\b/i.test(lower);

  let tipe: 'masuk' | 'keluar' = 'keluar';
  if (isMasuk && !isKeluar) {
    tipe = 'masuk';
  } else if (isKeluar) {
    tipe = 'keluar';
  } else {
    tipe = 'keluar';
  }

  // 3. Deteksi Kategori Cerdas
  let kategori = tipe === 'masuk' ? 'Penjualan Produk' : 'Operasional';

  if (tipe === 'keluar') {
    if (/\b(bumbu|dapur|beras|minyak|ayam|daging|telur|telor|tepung|sayur|sayuran|bawang|cabai|cabe|kopi|susu|buah|ikan|gula|bahan|stok|kulak)\b/i.test(lower)) {
      kategori = 'Bahan Baku';
    } else if (/\b(listrik|token|air|pdam|wifi|internet|pulsa|paket|bensin|bbm|parkir|galon)\b/i.test(lower)) {
      kategori = 'Operasional';
    } else if (/\b(gaji|upah|bonus|honor|karyawan|pegawai)\b/i.test(lower)) {
      kategori = 'Gaji Karyawan';
    } else if (/\b(sewa|ruko|kios|lapak|kontrakan|tempat|tenant)\b/i.test(lower)) {
      kategori = 'Sewa Tempat';
    } else if (/\b(iklan|ads|pemasaran|promo|promosi|banner|brosur|endorse)\b/i.test(lower)) {
      kategori = 'Pemasaran';
    } else if (/\b(plastik|kresek|cup|kemasan|kardus|dus|kotak|stiker|packing)\b/i.test(lower)) {
      kategori = 'Kemasan & Packing';
    } else {
      kategori = 'Operasional';
    }
  } else {
    if (/\b(jasa|servis|service|kursus|cuci|ongkir)\b/i.test(lower)) {
      kategori = 'Jasa & Layanan';
    } else {
      kategori = 'Penjualan Produk';
    }
  }

  // 4. Bersihkan Keterangan / Deskripsi
  let deskripsi = text
    .replace(/\b(catat|tulis|masukkan|simpan|tolong|tolong catat)\b/gi, '')
    .replace(/\b(pengeluaran|pemasukan)\b/gi, '')
    .trim();

  if (deskripsi.length === 0) {
    deskripsi = tipe === 'masuk' ? 'Penjualan Harian' : 'Pengeluaran Toko';
  }

  deskripsi = deskripsi.charAt(0).toUpperCase() + deskripsi.slice(1);

  return {
    isTransaction: true,
    tipe,
    jumlah,
    kategori,
    deskripsi,
  };
}

/**
 * Core Message Processor untuk WhatsApp Assistant UMKM
 */
export async function handleIncomingWhatsAppMessage(
  rawPhoneNumber: string,
  rawMessageText: string
): Promise<WhatsAppProcessResult> {
  const phoneNumber = cleanWhatsAppNumber(rawPhoneNumber);
  const text = (rawMessageText || '').trim();

  if (!phoneNumber || !text) {
    return {
      reply: 'Pesan atau nomor pengirim tidak valid.',
      actionTaken: 'chat_replied',
    };
  }

  const client = await pool.connect();

  try {
    // 1. Simpan pesan masuk ke log
    await client.query(
      `INSERT INTO "WhatsAppMessageLog" ("phoneNumber", "direction", "messageText") VALUES ($1, 'incoming', $2)`,
      [phoneNumber, text]
    );

    // 2. Cek apakah nomor WhatsApp ini sudah terikat ke akun Pengguna
    const userRes = await client.query(
      `SELECT u.id, u.name, u.email, u.role, u."trialEndsAt", u."isLocked", u."waToken", u."isWaConnected", bp."namaUsaha"
       FROM "User" u
       LEFT JOIN "BusinessProfile" bp ON bp."userId" = u.id
       WHERE u."waPhoneNumber" = $1 AND u."isWaConnected" = TRUE
       LIMIT 1`,
      [phoneNumber]
    );

    let currentUser = userRes.rows[0];

    // =========================================================================
    // SKENARIO 1: Nomor belum terikat (Perlu Verifikasi Token Akun)
    // =========================================================================
    if (!currentUser) {
      const tokenMatch = text.match(/\b(BIZ-?\d{5,8})\b/i);

      if (tokenMatch) {
        const inputToken = tokenMatch[1].toUpperCase().replace('-', '');

        const tokenQuery = await client.query(
          `SELECT u.id, u.name, u.email, u.role, u."trialEndsAt", u."isLocked", u."waToken", bp."namaUsaha"
           FROM "User" u
           LEFT JOIN "BusinessProfile" bp ON bp."userId" = u.id
           WHERE UPPER(REPLACE(u."waToken", '-', '')) = $1
           LIMIT 1`,
          [inputToken]
        );

        if (tokenQuery.rows.length === 0) {
          const reply = `❌ *Token Tidak Ditemukan*\n\nToken "${text}" tidak valid atau tidak terdaftar di sistem Bizkit.\n\n💡 *Cara Cek Token:*\n1. Buka dashboard web Bizkit Anda\n2. Masuk ke menu *Pengaturan Akun*\n3. Salin kode *Token WhatsApp* (format: BIZ-XXXXXX) lalu kirimkan kembali ke chat ini.`;
          await logOutgoing(client, phoneNumber, null, reply);
          return { reply, actionTaken: 'token_invalid' };
        }

        const targetUser = tokenQuery.rows[0];

        // Validasi hak akses (Premium / Trial Aktif / Admin)
        const isTrialActive = targetUser.role === 'trial' && targetUser.trialEndsAt && new Date(targetUser.trialEndsAt) > new Date();
        const isEligible = targetUser.role === 'premium' || targetUser.role === 'admin' || isTrialActive;

        if (!isEligible) {
          const reply = `⚠️ *Akses Terbatas: Khusus Paket Premium / Trial*\n\nAkun Anda saat ini berada pada *Free Plan* atau masa trial telah berakhir.\n\nFitur integrasi WhatsApp AI Assistant ini khusus untuk pengguna *Paket Premium* atau *Trial Aktif*.\n\nSilakan upgrade paket usaha Anda di web:\n👉 https://bizkit.id/checkout`;
          await logOutgoing(client, phoneNumber, targetUser.id, reply);
          return { reply, userId: targetUser.id, actionTaken: 'token_invalid' };
        }

        // Hubungkan nomor WhatsApp ini ke user
        await client.query(
          `UPDATE "User" SET "waPhoneNumber" = $1, "isWaConnected" = TRUE, "updatedAt" = NOW() WHERE id = $2`,
          [phoneNumber, targetUser.id]
        );

        const storeName = targetUser.namaUsaha || targetUser.name || 'Usaha Anda';
        const reply = `🎉 *Selamat Datang di Bizkit Assistant!*\n\nNomor WhatsApp Anda berhasil terhubung dengan akun toko:\n🏪 *${storeName}*\n👤 Email: ${targetUser.email}\n\n━━━━━━━━━━━━━━━━━━━━\nSekarang Kakak bisa mencatat pembukuan keuangan toko langsung lewat chat ini tanpa perlu buka web!\n\n💡 *Contoh Cara Pakai:*\n• _"Catat pengeluaran beli bumbu dapur 45rb"_\n• _"Pemasukan jualan bakso 250.000"_\n• _"Laporan keuangan hari ini"_\n\nSetiap transaksi akan diverifikasi (*YA / BATAL*) terlebih dahulu agar data selalu akurat. Coba kirim pencatatan pertama Kakak sekarang! 😊`;

        await logOutgoing(client, phoneNumber, targetUser.id, reply);
        return { reply, userId: targetUser.id, actionTaken: 'token_bound' };
      }

      // Belum kirim token
      const reply = `Halo! 👋 Selamat datang di *Bizkit WhatsApp Assistant*.\n\nUntuk mulai mencatat pemasukan dan pengeluaran toko langsung via WhatsApp, silakan hubungkan akun Anda terlebih dahulu.\n\n🔑 *Kirimkan Token Akun Bizkit Anda:*\n1. Buka dashboard Bizkit di browser Anda\n2. Buka menu *Pengaturan Akun*\n3. Salin *Token Asisten WhatsApp* Anda (contoh: *BIZ-123456*)\n4. Balas chat ini dengan mengetikkan token tersebut.\n\n_Kami siap membantu mengelola keuangan usaha Anda lebih cepat & praktis!_`;
      await logOutgoing(client, phoneNumber, null, reply);
      return { reply, actionTaken: 'token_required' };
    }

    // =========================================================================
    // SKENARIO 2: Pengguna Sudah Terikat (Otentikasi Berhasil)
    // =========================================================================
    const userId = currentUser.id;
    const storeName = currentUser.namaUsaha || currentUser.name || 'Toko Anda';

    // 2.1 Cek status pending konfirmasi (WAITING_CONFIRMATION)
    const convRes = await client.query(
      `SELECT * FROM "WhatsAppConversation" 
       WHERE "phoneNumber" = $1 AND "state" = 'WAITING_CONFIRMATION' AND "expiresAt" > NOW()
       ORDER BY "createdAt" DESC LIMIT 1`,
      [phoneNumber]
    );

    if (convRes.rows.length > 0) {
      const activeConv = convRes.rows[0];
      const pendingRaw = activeConv.pendingAction;
      const pending = typeof pendingRaw === 'string' ? JSON.parse(pendingRaw) : pendingRaw;
      const lower = text.toLowerCase();

      // User Konfirmasi: YA / SIMPAN / OKE / BENAR
      if (/^(ya|iya|oke|ok|simpan|benar|betul|y|gas|save)$/i.test(lower)) {
        const trxId = crypto.randomUUID();
        const insertRes = await client.query(
          `INSERT INTO "Transaction" ("id", "userId", "tipe", "jumlah", "kategori", "deskripsi", "tanggal", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
           RETURNING id, tipe, jumlah, kategori, deskripsi, tanggal`,
          [trxId, userId, pending.tipe, pending.jumlah, pending.kategori, pending.deskripsi]
        );

        await client.query(
          `UPDATE "WhatsAppConversation" SET "state" = 'IDLE', "pendingAction" = NULL, "updatedAt" = NOW() WHERE id = $1`,
          [activeConv.id]
        );

        await client.query(
          `UPDATE "WhatsAppBotSession" SET "totalTransactions" = "totalTransactions" + 1, "totalMessages" = "totalMessages" + 1, "lastActiveAt" = NOW() WHERE id = 'primary'`
        );

        const trx = insertRes.rows[0];
        const isMasuk = trx.tipe === 'masuk';
        const formattedDate = new Date(trx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const reply = `✅ *Transaksi Berhasil Disimpan!*\n\n📌 Jenis: ${isMasuk ? '🟢 Pemasukan' : '🔴 Pengeluaran'}\n💰 Nominal: *${formatRupiah(Number(trx.jumlah))}*\n📂 Kategori: *${trx.kategori}*\n📝 Keterangan: ${trx.deskripsi}\n📅 Waktu: ${formattedDate}\n\nData telah otomatis tersinkron ke dashboard web *${storeName}*. Ketik transaksi berikutnya kapan saja! 👍`;

        await logOutgoing(client, phoneNumber, userId, reply);
        return { reply, userId, actionTaken: 'confirmed_saved' };
      }

      // User Membatalkan: BATAL / TIDAK / NGGAK / SALAH
      if (/^(batal|tidak|nggak|engga|ga|gak|bukan|salah|cancel|no)$/i.test(lower)) {
        await client.query(
          `UPDATE "WhatsAppConversation" SET "state" = 'IDLE', "pendingAction" = NULL, "updatedAt" = NOW() WHERE id = $1`,
          [activeConv.id]
        );

        const reply = `❌ *Pencatatan Dibatalkan*\n\nTransaksi tidak disimpan ke pembukuan toko. Silakan ketik ulang pencatatan yang benar kapan saja.`;
        await logOutgoing(client, phoneNumber, userId, reply);
        return { reply, userId, actionTaken: 'cancelled' };
      }
    }

    // 2.2 Cek apakah pengguna meminta Laporan / Ringkasan Keuangan
    if (/^(laporan|ringkasan|kas|omset|saldo|keuangan|cek\s*laporan|cek\s*kas)/i.test(text)) {
      const todayTrx = await client.query(
        `SELECT tipe, SUM(jumlah) as total
         FROM "Transaction"
         WHERE "userId" = $1 AND DATE(tanggal) = CURRENT_DATE
         GROUP BY tipe`,
        [userId]
      );

      let totalMasukHariIni = 0;
      let totalKeluarHariIni = 0;

      for (const row of todayTrx.rows) {
        if (row.tipe === 'masuk') totalMasukHariIni = Number(row.total);
        if (row.tipe === 'keluar') totalKeluarHariIni = Number(row.total);
      }

      const saldoHariIni = totalMasukHariIni - totalKeluarHariIni;

      const reply = `📊 *Ringkasan Keuangan Hari Ini*\n🏪 *${storeName}*\n📅 ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}\n\n🟢 *Total Pemasukan:* ${formatRupiah(totalMasukHariIni)}\n🔴 *Total Pengeluaran:* ${formatRupiah(totalKeluarHariIni)}\n━━━━━━━━━━━━━━━━━━━━\n💵 *Saldo Bersih Hari Ini:* ${formatRupiah(saldoHariIni)}\n\n💡 _Ketik pencatatan transaksi baru kapan saja, misal:_\n_"Beli kantong plastik 15rb"_`;

      await logOutgoing(client, phoneNumber, userId, reply);
      return { reply, userId, actionTaken: 'report_generated' };
    }

    // =========================================================================
    // 2.3 Deteksi Transaksi (Groq AI Balancer + Robust NLP Fallback)
    // =========================================================================
    let parsedTransaction: { isTransaction: boolean; tipe?: 'masuk' | 'keluar'; jumlah?: number; kategori?: string; deskripsi?: string } | null = null;
    let keyUsedId: number | undefined = undefined;
    let latencyMs: number | undefined = undefined;

    // Coba via Groq AI Balancer terlebih dahulu
    try {
      const systemPrompt = `Anda adalah Asisten WhatsApp AI resmi Bizkit UMKM.
Ekstrak transaksi keuangan dari pesan pengguna.
Output HANYA satu baris JSON valid:
{"isTransaction":true,"tipe":"masuk"|"keluar","jumlah":angka_nominal,"kategori":"kategori","deskripsi":"deskripsi"}
atau jika bukan transaksi:
{"isTransaction":false,"reply":"balasan ramah"}`;

      const aiCall = await chatWhatsAppGroq(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        { temperature: 0.1, max_tokens: 150 }
      );

      keyUsedId = aiCall.keyId;
      latencyMs = aiCall.latencyMs;

      const cleanedJson = aiCall.text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);
      if (parsed.isTransaction && parsed.jumlah > 0) {
        parsedTransaction = parsed;
      }
    } catch (groqErr: any) {
      console.warn('[WA-Handler] Groq AI gagal/cooldown, beralih ke Robust Local NLP Parser:', groqErr.message);
    }

    // Jika Groq tidak dapat diakses atau gagal mem-parse, gunakan Local NLP Parser
    if (!parsedTransaction || !parsedTransaction.isTransaction) {
      const localResult = parseLocalIndonesianTransaction(text);
      if (localResult.isTransaction && localResult.jumlah && localResult.jumlah > 0) {
        parsedTransaction = localResult;
      }
    }

    // Jika transaksi terdeteksi: Masukkan ke state WAITING_CONFIRMATION
    if (parsedTransaction && parsedTransaction.isTransaction && parsedTransaction.jumlah && parsedTransaction.jumlah > 0) {
      const tipe = parsedTransaction.tipe === 'masuk' ? 'masuk' : 'keluar';
      const jumlah = Number(parsedTransaction.jumlah);
      const kategori = parsedTransaction.kategori || (tipe === 'masuk' ? 'Penjualan Produk' : 'Operasional');
      const deskripsi = parsedTransaction.deskripsi || text;

      // Simpan state konfirmasi di tabel WhatsAppConversation (kedaluwarsa 10 menit)
      await client.query(
        `INSERT INTO "WhatsAppConversation" ("phoneNumber", "userId", "state", "pendingAction", "expiresAt", "createdAt", "updatedAt")
         VALUES ($1, $2, 'WAITING_CONFIRMATION', $3, NOW() + INTERVAL '10 minutes', NOW(), NOW())`,
        [phoneNumber, userId, JSON.stringify({ tipe, jumlah, kategori, deskripsi })]
      );

      const isMasuk = tipe === 'masuk';
      const reply = `Halo Kak! Kami mendeteksi transaksi berikut:\n\n📌 Jenis: *${isMasuk ? '🟢 Pemasukan' : '🔴 Pengeluaran'}*\n💰 Nominal: *${formatRupiah(jumlah)}*\n📂 Kategori: *${kategori}*\n📝 Keterangan: *${deskripsi}*\n\nKetik *YA* untuk menyimpan ke pembukuan, atau ketik *BATAL* jika ada kesalahan.`;

      await logOutgoing(client, phoneNumber, userId, reply, keyUsedId, latencyMs);

      return {
        reply,
        userId,
        isTransactionExtracted: true,
        keyUsedId,
        latencyMs,
        actionTaken: 'pending_confirmation',
      };
    }

    // Sapaan / Pesan Umum
    const reply = `Halo Kak! Ada pemasukan atau pengeluaran yang ingin dicatat hari ini?\n\nKetik langsung seperti:\n• _"Beli bumbu dapur 45rb"_\n• _"Omset jualan bakso 350.000"_\n• _"Laporan hari ini"_`;
    await logOutgoing(client, phoneNumber, userId, reply, keyUsedId, latencyMs);

    return {
      reply,
      userId,
      isTransactionExtracted: false,
      keyUsedId,
      latencyMs,
      actionTaken: 'chat_replied',
    };

  } finally {
    client.release();
  }
}

async function logOutgoing(
  client: any,
  phoneNumber: string,
  userId: string | null,
  text: string,
  keyUsedId?: number,
  latencyMs?: number
) {
  try {
    await client.query(
      `INSERT INTO "WhatsAppMessageLog" ("phoneNumber", "userId", "direction", "messageText", "keyUsedId", "latencyMs")
       VALUES ($1, $2, 'outgoing', $3, $4, $5)`,
      [phoneNumber, userId, text, keyUsedId || null, latencyMs || null]
    );
  } catch (e) {
    console.error('Failed to log outgoing WA message:', e);
  }
}
