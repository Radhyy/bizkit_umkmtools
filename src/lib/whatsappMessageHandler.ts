import pool from '@/lib/db';
import { chatWhatsAppGroq } from '@/lib/groqWhatsAppClient';
import crypto from 'crypto';

export interface WhatsAppProcessResult {
  reply: string;
  userId?: string;
  isTransactionExtracted?: boolean;
  keyUsedId?: number;
  latencyMs?: number;
  actionTaken?: 'token_bound' | 'token_invalid' | 'token_required' | 'confirmed_saved' | 'cancelled' | 'pending_confirmation' | 'report_generated' | 'chat_replied' | 'account_unlinked' | 'pending_revised';
}

/**
 * Normalisasi format nomor WhatsApp (hanya angka)
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
 */
export function parseLocalIndonesianTransaction(text: string): {
  isTransaction: boolean;
  tipe?: 'masuk' | 'keluar';
  jumlah?: number;
  kategori?: string;
  deskripsi?: string;
} {
  const lower = text.toLowerCase().trim();

  // Abaikan token, perintah logout, atau laporan
  if (/^BIZ-?\d+/i.test(lower) || /^(keluar|logout|putuskan|unlink|disconnect|batal|tidak|ya|oke)\b/i.test(lower)) {
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
  const isMasuk = /\b(pemasukan|masuk|omset|omzet|pendapatan|terima|dapat|jual|penjualan|laku|transferan|diterima|closing|closingan)\b/i.test(lower);
  const isKeluar = /\b(pengeluaran|keluar|beli|bayar|ongkir|belanja|biaya|tagihan|gaji|sewa|tarik|kulakan|belanjaan|bensin|listrik)\b/i.test(lower);

  let tipe: 'masuk' | 'keluar' = 'keluar';
  if (isMasuk && !isKeluar) {
    tipe = 'masuk';
  } else if (isKeluar) {
    tipe = 'keluar';
  } else {
    tipe = isMasuk ? 'masuk' : 'keluar';
  }

  // 3. Deteksi Kategori Cerdas
  let kategori = tipe === 'masuk' ? 'Penjualan Produk' : 'Operasional';

  if (tipe === 'keluar') {
    if (/\b(bumbu|dapur|beras|minyak|ayam|daging|telur|telor|tepung|sayur|sayuran|bawang|cabai|cabe|kopi|susu|buah|ikan|gula|bahan|stok|kulak)\b/i.test(lower)) {
      kategori = 'Bahan Baku';
    } else if (/\b(listrik|token|air|pdam|wifi|internet|pulsa|paket|bensin|bbm|parkir|galon|kebersihan)\b/i.test(lower)) {
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
    .replace(/\b(dari penjualan|hasil penjualan)\b/gi, 'Penjualan')
    .replace(/(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,10})/gi, '')
    .replace(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta|rb|k|ribu)\b/gi, '')
    .trim();

  if (deskripsi.length === 0) {
    deskripsi = tipe === 'masuk' ? 'Penjualan Produk' : 'Pengeluaran Toko';
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
 * Mengambil ringkasan keuangan toko pengguna
 */
async function getStoreFinancials(client: any, userId: string) {
  // 1. Data Hari Ini
  const todayRes = await client.query(
    `SELECT 
      COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN jumlah ELSE 0 END), 0) as masuk,
      COALESCE(SUM(CASE WHEN tipe = 'keluar' THEN jumlah ELSE 0 END), 0) as keluar,
      COUNT(*) as count
     FROM "Transaction"
     WHERE "userId" = $1 AND DATE(tanggal) = CURRENT_DATE`,
    [userId]
  );

  // 2. Data Bulan Ini
  const monthRes = await client.query(
    `SELECT 
      COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN jumlah ELSE 0 END), 0) as masuk,
      COALESCE(SUM(CASE WHEN tipe = 'keluar' THEN jumlah ELSE 0 END), 0) as keluar,
      COUNT(*) as count
     FROM "Transaction"
     WHERE "userId" = $1 AND DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)`,
    [userId]
  );

  // 3. Kategori Pengeluaran Terbesar Bulan Ini
  const topCatRes = await client.query(
    `SELECT kategori, SUM(jumlah) as total
     FROM "Transaction"
     WHERE "userId" = $1 AND tipe = 'keluar' AND DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)
     GROUP BY kategori
     ORDER BY total DESC
     LIMIT 3`,
    [userId]
  );

  // 4. Transaksi Terakhir (3 transaksi)
  const recentRes = await client.query(
    `SELECT tipe, jumlah, kategori, deskripsi, tanggal
     FROM "Transaction"
     WHERE "userId" = $1
     ORDER BY tanggal DESC, "createdAt" DESC
     LIMIT 3`,
    [userId]
  );

  const todayMasuk = Number(todayRes.rows[0]?.masuk || 0);
  const todayKeluar = Number(todayRes.rows[0]?.keluar || 0);
  const todayProfit = todayMasuk - todayKeluar;
  const todayCount = Number(todayRes.rows[0]?.count || 0);

  const monthMasuk = Number(monthRes.rows[0]?.masuk || 0);
  const monthKeluar = Number(monthRes.rows[0]?.keluar || 0);
  const monthProfit = monthMasuk - monthKeluar;
  const monthCount = Number(monthRes.rows[0]?.count || 0);

  return {
    today: { masuk: todayMasuk, keluar: todayKeluar, profit: todayProfit, count: todayCount },
    month: { masuk: monthMasuk, keluar: monthKeluar, profit: monthProfit, count: monthCount },
    topCategories: topCatRes.rows.map((r: any) => ({ kategori: r.kategori, total: Number(r.total) })),
    recent: recentRes.rows
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
      `SELECT u.id, u.name, u.email, u.role, u."trialEndsAt", u."isLocked", u."waToken", u."isWaConnected", 
              bp."namaUsaha", bp."kategoriBisnis", bp."targetAudiens", bp."gayaPromosi"
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
          const reply = `❌ *Token Tidak Ditemukan*\n\nToken "${text}" tidak terdaftar di sistem Bizkit.\n\n💡 *Cara Cek Token:*\n1. Buka dashboard web Bizkit: https://bizkit.my.id\n2. Masuk ke menu *Pengaturan Akun*\n3. Salin kode *Token WhatsApp* (format: BIZ-XXXXXX) lalu kirimkan kembali ke chat ini.`;
          await logOutgoing(client, phoneNumber, null, reply);
          return { reply, actionTaken: 'token_invalid' };
        }

        const targetUser = tokenQuery.rows[0];

        // Validasi hak akses (Premium / Trial Aktif / Admin)
        const isTrialActive = targetUser.role === 'trial' && targetUser.trialEndsAt && new Date(targetUser.trialEndsAt) > new Date();
        const isEligible = targetUser.role === 'premium' || targetUser.role === 'admin' || isTrialActive;

        if (!isEligible) {
          const reply = `⚠️ *Akses Terbatas: Khusus Paket Premium / Trial*\n\nAkun Anda saat ini berada pada *Free Plan* atau masa trial telah berakhir.\n\nFitur integrasi WhatsApp AI Assistant ini khusus untuk pengguna *Paket Premium* atau *Trial Aktif*.\n\nSilakan upgrade paket usaha Anda di web:\n👉 https://bizkit.my.id/harga`;
          await logOutgoing(client, phoneNumber, targetUser.id, reply);
          return { reply, userId: targetUser.id, actionTaken: 'token_invalid' };
        }

        // Hubungkan nomor WhatsApp ini ke user
        await client.query(
          `UPDATE "User" SET "waPhoneNumber" = $1, "isWaConnected" = TRUE, "updatedAt" = NOW() WHERE id = $2`,
          [phoneNumber, targetUser.id]
        );

        const storeName = targetUser.namaUsaha || targetUser.name || 'Usaha Anda';
        const reply = `🎉 *Selamat Datang di Bizkit Assistant!*\n\nNomor WhatsApp Anda berhasil terhubung dengan akun toko:\n🏪 *${storeName}*\n👤 Email: ${targetUser.email}\n\n━━━━━━━━━━━━━━━━━━━━\nSekarang Kakak bisa mencatat pembukuan toko langsung lewat chat ini tanpa perlu buka web!\n\n💡 *Contoh Perintah:*\n• _"Pemasukan jual bakso 250.000"_\n• _"Beli bumbu dapur 45rb"_\n• _"Laporan hari ini"_\n• _"Laporan bulan ini"_\n• _"Keuntungan toko gimana?"_\n\nKetik *Keluar* kapan saja jika ingin memutuskan sambungan akun. Silakan coba catat transaksi pertama Kakak! 😊`;

        await logOutgoing(client, phoneNumber, targetUser.id, reply);
        return { reply, userId: targetUser.id, actionTaken: 'token_bound' };
      }

      // Belum kirim token
      const reply = `Halo! 👋 Selamat datang di *Bizkit WhatsApp Assistant*.\n\nUntuk mulai mencatat pemasukan dan pengeluaran toko langsung via WhatsApp, silakan hubungkan akun Anda terlebih dahulu.\n\n🔑 *Kirimkan Token Akun Bizkit Anda:*\n1. Buka dashboard Bizkit di browser: https://bizkit.my.id\n2. Buka menu *Pengaturan Akun*\n3. Salin *Token Asisten WhatsApp* Anda (contoh: *BIZ-123456*)\n4. Balas chat ini dengan mengetikkan token tersebut.\n\n_Kami siap membantu mengelola keuangan usaha Anda lebih cepat & praktis!_`;
      await logOutgoing(client, phoneNumber, null, reply);
      return { reply, actionTaken: 'token_required' };
    }

    // =========================================================================
    // SKENARIO 2: Pengguna Sudah Terikat (Otentikasi Berhasil)
    // =========================================================================
    const userId = currentUser.id;
    const storeName = currentUser.namaUsaha || currentUser.name || 'Toko Anda';
    const lowerText = text.toLowerCase();

    // 2.1 Perintah Keluar / Logout / Putuskan Akun
    if (/^(keluar|logout|putuskan|putus|unlink|disconnect|hapus\s*koneksi|batal\s*hubung)\b/i.test(lowerText)) {
      await client.query(
        `UPDATE "User" SET "waPhoneNumber" = NULL, "isWaConnected" = FALSE, "updatedAt" = NOW() WHERE id = $1`,
        [userId]
      );
      await client.query(
        `DELETE FROM "WhatsAppConversation" WHERE "phoneNumber" = $1`,
        [phoneNumber]
      );

      const reply = `👋 *Nomor WhatsApp Berhasil Diputuskan!*\n\nNomor ini sudah tidak lagi terhubung dengan akun toko *${storeName}* (${currentUser.email}).\n\nJika ingin menghubungkan kembali di kemudian hari, cukup kirimkan *Token WhatsApp* Anda dari menu Pengaturan Akun di https://bizkit.my.id.\n\nTerima kasih telah menggunakan Bizkit! 🙏`;
      await logOutgoing(client, phoneNumber, userId, reply);
      return { reply, userId, actionTaken: 'account_unlinked' };
    }

    // 2.2 Cek status pending konfirmasi (WAITING_CONFIRMATION)
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

      // A. User Konfirmasi Simpan: YA / IYA / OKE / SIMPAN
      if (/^(ya|iya|oke|ok|simpan|benar|betul|y|gas|save|sudah|sip|deal)$/i.test(lowerText)) {
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

      // B. User Membatalkan: BATAL / CANCEL / TIDAK
      if (/^(batal|tidak|nggak|engga|ga|gak|bukan|cancel|no|hapus)$/i.test(lowerText)) {
        await client.query(
          `UPDATE "WhatsAppConversation" SET "state" = 'IDLE', "pendingAction" = NULL, "updatedAt" = NOW() WHERE id = $1`,
          [activeConv.id]
        );

        const reply = `❌ *Pencatatan Dibatalkan*\n\nTransaksi tidak disimpan ke pembukuan toko. Silakan ketik ulang pencatatan yang benar kapan saja.`;
        await logOutgoing(client, phoneNumber, userId, reply);
        return { reply, userId, actionTaken: 'cancelled' };
      }

      // C. Koreksi / Revisi Transaksi Pending (Contoh: "keterangannya hapus tulisan 200000 nya" atau "ganti jadi 150rb")
      try {
        const revisionPrompt = `Anda adalah asisten WhatsApp cerdas Bizkit UMKM.
Pengguna sedang dalam tahap konfirmasi transaksi berikut:
- Tipe saat ini: "${pending.tipe}" ("masuk" atau "keluar")
- Nominal saat ini: ${pending.jumlah}
- Kategori saat ini: "${pending.kategori}"
- Keterangan saat ini: "${pending.deskripsi}"

Pesan baru pengguna: "${text}"

Analisis pesan pengguna:
1. Apakah pengguna ingin merevisi (mengubah nominal, kategori, tipe masuk/keluar, atau keterangan/deskripsi)?
2. Apakah pengguna membatalkan?
3. Apakah pengguna menyetujui?

Output HANYA satu baris JSON valid:
{"intent":"revise"|"cancel"|"confirm","tipe":"masuk"|"keluar","jumlah":number,"kategori":"kategori","deskripsi":"deskripsi_bersih"}`;

        const aiRevise = await chatWhatsAppGroq(
          [
            { role: 'system', content: revisionPrompt },
            { role: 'user', content: text }
          ],
          { temperature: 0.1, max_tokens: 200 }
        );

        const parsedRev = JSON.parse(aiRevise.text.replace(/```json|```/g, '').trim());

        if (parsedRev.intent === 'confirm') {
          const trxId = crypto.randomUUID();
          await client.query(
            `INSERT INTO "Transaction" ("id", "userId", "tipe", "jumlah", "kategori", "deskripsi", "tanggal", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())`,
            [trxId, userId, pending.tipe, pending.jumlah, pending.kategori, pending.deskripsi]
          );
          await client.query(
            `UPDATE "WhatsAppConversation" SET "state" = 'IDLE', "pendingAction" = NULL, "updatedAt" = NOW() WHERE id = $1`,
            [activeConv.id]
          );
          const reply = `✅ *Transaksi Berhasil Disimpan!*\n\n📌 Jenis: ${pending.tipe === 'masuk' ? '🟢 Pemasukan' : '🔴 Pengeluaran'}\n💰 Nominal: *${formatRupiah(Number(pending.jumlah))}*\n📂 Kategori: *${pending.kategori}*\n📝 Keterangan: ${pending.deskripsi}\n\nData tersinkron ke dashboard web *${storeName}*!`;
          await logOutgoing(client, phoneNumber, userId, reply);
          return { reply, userId, actionTaken: 'confirmed_saved' };
        }

        if (parsedRev.intent === 'cancel') {
          await client.query(
            `UPDATE "WhatsAppConversation" SET "state" = 'IDLE', "pendingAction" = NULL, "updatedAt" = NOW() WHERE id = $1`,
            [activeConv.id]
          );
          const reply = `❌ *Pencatatan Dibatalkan*\n\nTransaksi tidak disimpan. Silakan ketik transaksi baru kapan saja.`;
          await logOutgoing(client, phoneNumber, userId, reply);
          return { reply, userId, actionTaken: 'cancelled' };
        }

        if (parsedRev.intent === 'revise') {
          const updatedTipe = parsedRev.tipe || pending.tipe;
          const updatedJumlah = Number(parsedRev.jumlah || pending.jumlah);
          const updatedKategori = parsedRev.kategori || pending.kategori;
          const updatedDeskripsi = parsedRev.deskripsi || pending.deskripsi;

          await client.query(
            `UPDATE "WhatsAppConversation" 
             SET "pendingAction" = $1, "expiresAt" = NOW() + INTERVAL '10 minutes', "updatedAt" = NOW() 
             WHERE id = $2`,
            [JSON.stringify({ tipe: updatedTipe, jumlah: updatedJumlah, kategori: updatedKategori, deskripsi: updatedDeskripsi }), activeConv.id]
          );

          const isMasuk = updatedTipe === 'masuk';
          const reply = `✏️ *Detail Transaksi Diperbarui:*\n\n📌 Jenis: *${isMasuk ? '🟢 Pemasukan' : '🔴 Pengeluaran'}*\n💰 Nominal: *${formatRupiah(updatedJumlah)}*\n📂 Kategori: *${updatedKategori}*\n📝 Keterangan: *${updatedDeskripsi}*\n\nKetik *YA* untuk menyimpan ke pembukuan, atau ketik *BATAL* jika ingin membatalkan.`;
          await logOutgoing(client, phoneNumber, userId, reply);
          return { reply, userId, actionTaken: 'pending_revised' };
        }
      } catch (reviseErr) {
        console.warn('[WA-Handler] Revisi pending via AI gagal, cek parsing manual...');
      }
    }

    // =========================================================================
    // 2.3 Tanya Solusi Bisnis, Saran, Tips, atau Konsultasi AI
    // =========================================================================
    const isConsultation = /\b(solusi|saran|tips|gimana|bagaimana|cara|kenapa|mengapa|bantu|konsultasi|strategi|analisis|evaluasi|naikin|meningkatkan|ide)\b/i.test(lowerText);

    if (isConsultation) {
      try {
        const financials = await getStoreFinancials(client, userId);
        const bizCategory = currentUser.kategoriBisnis || 'Usaha Kuliner & Retail UMKM';
        const targetAudience = currentUser.targetAudiens || 'Pelanggan Lokal';

        const advisorySystemPrompt = `Anda adalah "Bizkit AI Advisor", konsultan bisnis dan keuangan terpercaya khusus UMKM Indonesia.
Karakter: Ramah, solutif, memotivasi, praktis, to-the-point, dan profesional (menggunakan sapaan 'Kak' atau nama usaha).

Konteks Bisnis Pengguna:
- Nama Usaha: ${storeName}
- Kategori Usaha: ${bizCategory}
- Target Pelanggan: ${targetAudience}
- Omset Bulan Ini: ${formatRupiah(financials.month.masuk)}
- Pengeluaran Bulan Ini: ${formatRupiah(financials.month.keluar)}
- Laba Bersih Bulan Ini: ${formatRupiah(financials.month.profit)}

Tugas Anda:
Berikan jawaban atau solusi bisnis yang praktis, aplikatif, dan mudah diterapkan oleh pemilik UMKM sesuai pertanyaan pengguna.
Gunakan format rapi dengan poin-poin singkat (maksimal 3-4 poin solusi utama). Jangan terlalu panjang agar nyaman dibaca di WhatsApp.`;

        const aiAdvice = await chatWhatsAppGroq(
          [
            { role: 'system', content: advisorySystemPrompt },
            { role: 'user', content: text }
          ],
          { temperature: 0.7, max_tokens: 350 }
        );

        if (aiAdvice.text && aiAdvice.text.trim()) {
          const reply = `💡 *Saran & Solusi dari Bizkit AI*\n🏪 *${storeName}*\n\n${aiAdvice.text.trim()}\n\n━━━━━━━━━━━━━━━━━━━━\n_Ketik transaksi kapan saja untuk dicatat, misal: "Jual 3 porsi 75rb"_`;
          await logOutgoing(client, phoneNumber, userId, reply, aiAdvice.keyId, aiAdvice.latencyMs);
          return { reply, userId, actionTaken: 'chat_replied', keyUsedId: aiAdvice.keyId, latencyMs: aiAdvice.latencyMs };
        }
      } catch (adviceErr) {
        console.warn('[WA-Handler] AI Consultation call error:', adviceErr);
      }
    }

    // =========================================================================
    // 2.4 Permintaan Laporan Keuangan (Hari Ini / Kemarin / Bulan Ini / Umum)
    // =========================================================================
    const isReportQuery = /\b(laporan|ringkasan|rekap|kas|omset|omzet|saldo|keuntungan|laba|rugi|profit|cek\s*uang)\b/i.test(lowerText);
    const isTodayQuery = /\b(hari\s*ini|harian|today|sekarang)\b/i.test(lowerText);
    const isMonthQuery = /\b(bulan\s*ini|bulanan|month|sebulan)\b/i.test(lowerText);
    const isProfitQuery = /\b(untung|keuntungan|laba|profit|margin|bersih)\b/i.test(lowerText);

    if (isReportQuery) {
      const financials = await getStoreFinancials(client, userId);
      const todayDateStr = new Date().toLocaleDateString('id-ID', { dateStyle: 'full' });
      const currentMonthStr = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      // Skenario A: Laporan Bulan Ini atau Tanya Keuntungan Bulanan
      if (isMonthQuery || (isProfitQuery && !isTodayQuery)) {
        const profitStatus = financials.month.profit >= 0 ? '🟢 Surplus (Untung)' : '🔴 Defisit (Rugi)';
        let topCatsText = '';
        if (financials.topCategories.length > 0) {
          topCatsText = '\n\n📊 *Pengeluaran Terbesar Bulan Ini:*\n' + 
            financials.topCategories.map((c: { kategori: string; total: number }, i: number) => `${i + 1}. ${c.kategori}: ${formatRupiah(c.total)}`).join('\n');
        }

        const reply = `📈 *Laporan Keuangan Bulan ${currentMonthStr}*\n🏪 *${storeName}*\n\n🟢 *Total Pemasukan (Omset):* ${formatRupiah(financials.month.masuk)}\n🔴 *Total Pengeluaran:* ${formatRupiah(financials.month.keluar)}\n━━━━━━━━━━━━━━━━━━━━\n💵 *Laba / Keuntungan Bersih:* *${formatRupiah(financials.month.profit)}* (${profitStatus})\n🧾 *Total Transaksi:* ${financials.month.count} transaksi${topCatsText}\n\n💡 _Ketik "Laporan hari ini" untuk melihat arus kas hari ini._`;

        await logOutgoing(client, phoneNumber, userId, reply);
        return { reply, userId, actionTaken: 'report_generated' };
      }

      // Skenario B: Laporan Hari Ini (Default jika tanya laporan, kas, atau hari ini)
      const profitStatusToday = financials.today.profit >= 0 ? '🟢 Surplus' : '🔴 Defisit';
      let recentTrxText = '';
      if (financials.recent.length > 0) {
        recentTrxText = '\n\n🕒 *Transaksi Terbaru:*\n' +
          financials.recent.map((t: any) => `• ${t.tipe === 'masuk' ? '🟢' : '🔴'} ${formatRupiah(Number(t.jumlah))} - ${t.deskripsi}`).join('\n');
      }

      const reply = `📊 *Laporan Keuangan Hari Ini*\n🏪 *${storeName}*\n📅 ${todayDateStr}\n\n🟢 *Pemasukan Hari Ini:* ${formatRupiah(financials.today.masuk)}\n🔴 *Pengeluaran Hari Ini:* ${formatRupiah(financials.today.keluar)}\n━━━━━━━━━━━━━━━━━━━━\n💵 *Saldo Bersih Hari Ini:* *${formatRupiah(financials.today.profit)}* (${profitStatusToday})\n🧾 *Transaksi Hari Ini:* ${financials.today.count} transaksi${recentTrxText}\n\n💡 _Ketik "Laporan bulan ini" untuk ringkasan sebulan penuh._`;

      await logOutgoing(client, phoneNumber, userId, reply);
      return { reply, userId, actionTaken: 'report_generated' };
    }

    // =========================================================================
    // 2.5 Deteksi Transaksi Baru (Groq AI Balancer + Robust NLP Fallback)
    // =========================================================================
    let parsedTransaction: { isTransaction: boolean; tipe?: 'masuk' | 'keluar'; jumlah?: number; kategori?: string; deskripsi?: string } | null = null;
    let keyUsedId: number | undefined = undefined;
    let latencyMs: number | undefined = undefined;

    // Coba via Groq AI Balancer terlebih dahulu
    try {
      const systemPrompt = `Anda adalah Asisten WhatsApp AI resmi Bizkit UMKM.
Tugas: Ekstrak apakah pesan pengguna adalah pencatatan transaksi keuangan (pemasukan atau pengeluaran).
Kategori pemasukan yang tersedia: Penjualan Produk, Jasa & Layanan, Pendapatan Lain.
Kategori pengeluaran yang tersedia: Bahan Baku, Operasional, Gaji Karyawan, Sewa Tempat, Pemasaran, Kemasan & Packing, Lain-lain.

Jika pesan BUKAN transaksi keuangan, berikan balasan chat yang ramah dan membantu terkait bisnis.

Output HANYA satu baris JSON valid:
{"isTransaction":true,"tipe":"masuk"|"keluar","jumlah":angka_nominal,"kategori":"kategori","deskripsi":"deskripsi_jelas"}
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
      } else if (!parsed.isTransaction && parsed.reply) {
        const reply = `${parsed.reply}\n\n💡 *Tips Cepat:*\n• Ketik _"Beli bumbu 50rb"_ untuk mencatat pengeluaran\n• Ketik _"Omset jualan 250rb"_ untuk pemasukan\n• Ketik _"Laporan hari ini"_ untuk cek kas`;
        await logOutgoing(client, phoneNumber, userId, reply, keyUsedId, latencyMs);
        return { reply, userId, actionTaken: 'chat_replied', keyUsedId, latencyMs };
      }
    } catch (groqErr: any) {
      console.warn('[WA-Handler] Groq AI parsing gagal, beralih ke Robust Local NLP Parser:', groqErr.message);
    }

    // Jika Groq tidak mem-parse sebagai transaksi, gunakan Local NLP Parser
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

      // Bersihkan pending konfirmasi lama dan simpan yang baru (berlaku 10 menit)
      await client.query(
        `DELETE FROM "WhatsAppConversation" WHERE "phoneNumber" = $1 AND "state" = 'WAITING_CONFIRMATION'`,
        [phoneNumber]
      );

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

    // =========================================================================
    // 2.6 Menu Bantuan & Panduan Interaktif
    // =========================================================================
    const reply = `Halo Kak! 👋 Ada yang bisa *Bizkit Assistant* bantu untuk toko *${storeName}*?\n\n📝 *Pencatatan Keuangan:*\n• _"Beli bumbu dapur 45rb"_\n• _"Pemasukan jual bakso 250.000"_\n\n📊 *Laporan & Analisis:*\n• _"Laporan hari ini"_\n• _"Laporan bulan ini"_\n• _"Keuntungan toko gimana?"_\n\n🧠 *Konsultasi AI Bisnis:*\n• _"Gimana cara hemat biaya operasional?"_\n• _"Saran untuk meningkatkan penjualan"_\n\n⚙️ *Pengaturan Akun:*\n• Ketik _"Keluar"_ untuk memutuskan nomor WA dari akun.`;

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
