import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { groqChatCompletion, ChatMessageParam } from '@/lib/groqClient';

// Helper format Rupiah untuk prompt
const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

// GET: Ambil seluruh riwayat sesi dan pesan chat milik user dari database
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    // 1. Ambil semua sesi milik user
    const sessionsRes = await pool.query(
      `SELECT id, "userId", title, "createdAt", "updatedAt"
       FROM "ChatSession"
       WHERE "userId" = $1
       ORDER BY "updatedAt" DESC`,
      [userId]
    );

    const sessions = sessionsRes.rows;

    if (sessions.length === 0) {
      return NextResponse.json({ sessions: [] }, { status: 200 });
    }

    // 2. Ambil seluruh pesan untuk sesi-sesi tersebut
    const sessionIds = sessions.map(s => s.id);
    const messagesRes = await pool.query(
      `SELECT id, "sessionId", "userId", role, content, "createdAt"
       FROM "ChatMessage"
       WHERE "sessionId" = ANY($1::text[])
       ORDER BY "createdAt" ASC`,
      [sessionIds]
    );

    const messagesBySession: Record<string, any[]> = {};
    for (const msg of messagesRes.rows) {
      if (!messagesBySession[msg.sessionId]) {
        messagesBySession[msg.sessionId] = [];
      }
      messagesBySession[msg.sessionId].push({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        createdAt: msg.createdAt,
      });
    }

    // 3. Gabungkan sesi dengan pesannya
    const resultSessions = sessions.map(s => {
      const msgs = messagesBySession[s.id] || [];
      const lastMsg = msgs[msgs.length - 1];
      return {
        id: s.id,
        title: s.title,
        preview: lastMsg ? (lastMsg.content.slice(0, 70) + (lastMsg.content.length > 70 ? '...' : '')) : 'Sesi obrolan baru...',
        updatedAt: new Date(s.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        messages: msgs,
      };
    });

    return NextResponse.json({ sessions: resultSessions }, { status: 200 });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Gagal mengambil riwayat chat.' }, { status: 500 });
  }
}

// POST: Kirim pesan baru, proses lewat Groq Load Balancer, dan simpan ke database
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, sessionId, message, sessionTitle } = body;

    if (!userId || !message || !message.trim()) {
      return NextResponse.json({ error: 'User ID dan pesan wajib diisi.' }, { status: 400 });
    }

    // 1. Verifikasi User
    const userRes = await pool.query('SELECT id, name, email FROM "User" WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }
    const user = userRes.rows[0];

    // 2. Tentukan / Buat ChatSession
    let currentSessionId = sessionId;
    let finalTitle = sessionTitle || message.trim().slice(0, 32);

    if (!currentSessionId) {
      currentSessionId = uuidv4();
      await pool.query(
        `INSERT INTO "ChatSession" ("id", "userId", "title", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [currentSessionId, userId, finalTitle]
      );
    } else {
      // Cek apakah sesi sudah ada
      const existingSession = await pool.query(
        `SELECT id, title FROM "ChatSession" WHERE id = $1 AND "userId" = $2`,
        [currentSessionId, userId]
      );
      if (existingSession.rows.length === 0) {
        await pool.query(
          `INSERT INTO "ChatSession" ("id", "userId", "title", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [currentSessionId, userId, finalTitle]
        );
      } else {
        finalTitle = existingSession.rows[0].title;
      }
    }

    // 3. Simpan Pesan Pengguna (User) ke Database
    const userMsgId = uuidv4();
    await pool.query(
      `INSERT INTO "ChatMessage" ("id", "sessionId", "userId", "role", "content", "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userMsgId, currentSessionId, userId, 'user', message.trim()]
    );

    // 4. Kumpulkan Konteks Nyata Pengguna dari Database untuk AI Grounding
    // A. Profil Bisnis
    const profileRes = await pool.query(
      `SELECT * FROM "BusinessProfile" WHERE "userId" = $1 LIMIT 1`,
      [userId]
    );
    const profile = profileRes.rows[0] || null;

    // B. Ringkasan Keuangan
    const trxRes = await pool.query(
      `SELECT tipe, SUM(jumlah) as total, COUNT(*) as count 
       FROM "Transaction" 
       WHERE "userId" = $1 
       GROUP BY tipe`,
      [userId]
    );

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    for (const r of trxRes.rows) {
      if (r.tipe === 'masuk') totalPemasukan = Number(r.total) || 0;
      if (r.tipe === 'keluar') totalPengeluaran = Number(r.total) || 0;
    }
    const saldo = totalPemasukan - totalPengeluaran;

    // C. 3 Transaksi Terakhir untuk konteks operasional
    const recentTrxRes = await pool.query(
      `SELECT tipe, kategori, deskripsi, jumlah, tanggal 
       FROM "Transaction" 
       WHERE "userId" = $1 
       ORDER BY tanggal DESC, "createdAt" DESC 
       LIMIT 3`,
      [userId]
    );

    const recentTrxText = recentTrxRes.rows.map(t => 
      `- [${t.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}] ${t.kategori}: ${t.deskripsi} (${formatRupiah(Number(t.jumlah))})`
    ).join('\n') || 'Belum ada transaksi tercatat.';

    // D. Riwayat Pesan Sebelumnya dalam sesi ini (maksimal 6 pesan terakhir untuk conversational memory)
    const historyRes = await pool.query(
      `SELECT role, content 
       FROM "ChatMessage" 
       WHERE "sessionId" = $1 AND id != $2 
       ORDER BY "createdAt" DESC 
       LIMIT 6`,
      [currentSessionId, userMsgId]
    );
    const conversationHistory = historyRes.rows.reverse();

    // 5. Susun System Prompt yang cerdas dan terpersonalisasi
    const systemPrompt = `Anda adalah "Bizkit AI Assistant", konsultan bisnis, pemasaran, dan keuangan cerdas khusus UMKM di Indonesia.

Konteks Profil Bisnis Pemilik Usaha:
- Nama Pemilik: ${user.name || 'Pelaku UMKM'}
- Nama Toko / Brand: ${profile?.namaUsaha || 'Toko UMKM'}
- Kategori Usaha: ${profile?.kategoriBisnis || 'Usaha Umum'}
- Deskripsi Produk: ${profile?.deskripsiBisnis || 'Produk UMKM'}
- Target Pasar / Audiens: ${profile?.targetAudiens || 'Masyarakat Umum'}
- Saluran Promosi Utama: ${profile?.platformFokus || 'Instagram & TikTok'}
- Gaya Promosi yang Diinginkan: ${profile?.gayaPromosi || 'Review Jujur'}
- Kota Lokasi: ${profile?.kotaLokasi || 'Indonesia'}

Kondisi Keuangan & Pembukuan Saat Ini di Bizkit:
- Total Arus Kas Masuk: ${formatRupiah(totalPemasukan)}
- Total Arus Kas Keluar: ${formatRupiah(totalPengeluaran)}
- Saldo / Laba Bersih: ${formatRupiah(saldo)} (${saldo >= 0 ? 'Surplus' : 'Defisit'})
Transaksi Terakhir:
${recentTrxText}

Panduan Gaya Menjawab & Format:
1. Bersahabat, suportif, to-the-point, dan sangat solutif untuk skala UMKM.
2. Gunakan konteks bisnis dan angka keuangan di atas bila relevan dengan pertanyaan user.
3. Berikan saran taktis, langkah konkret, atau ide strategi yang mudah dieksekusi.
4. ATURAN FORMAT (SANGAT PENTING):
   - JANGAN PERNAH gunakan tanda pagar (#, ##, ###) untuk judul.
   - JANGAN PERNAH gunakan tanda bintang ganda (**) atau bintang (*) untuk poin daftar. Gunakan nomor (1., 2.) atau strip (-) / peluru (•).
   - Tulis teks dengan bersih, rapi, dan mudah dibaca tanpa simbol markdown mentah.`;

    // Susun array pesan untuk LLM
    const groqMessages: ChatMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user', content: message.trim() }
    ];

    // 6. Jalankan Groq Completion lewat Load Balancer (Auto-Failover antar 5 key)
    const completion = await groqChatCompletion(groqMessages, {
      temperature: 0.7,
      max_tokens: 900
    });

    const aiReplyText = completion.text || 'Maaf, saya tidak dapat merumuskan tanggapan saat ini. Silakan ulangi pertanyaan Anda.';

    // 7. Simpan Pesan AI (Assistant) ke Database
    const aiMsgId = uuidv4();
    await pool.query(
      `INSERT INTO "ChatMessage" ("id", "sessionId", "userId", "role", "content", "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [aiMsgId, currentSessionId, userId, 'assistant', aiReplyText]
    );

    // 8. Update Session's updatedAt dan title jika ini pesan pertama
    await pool.query(
      `UPDATE "ChatSession" 
       SET "updatedAt" = NOW(), 
           "title" = CASE WHEN "title" = 'Obrolan Baru' THEN $1 ELSE "title" END
       WHERE id = $2`,
      [finalTitle, currentSessionId]
    );

    return NextResponse.json({
      success: true,
      sessionId: currentSessionId,
      userMessageId: userMsgId,
      aiMessageId: aiMsgId,
      reply: aiReplyText,
      keyUsed: completion.keyUsed,
      model: completion.model,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ 
      error: error.message || 'Gagal memproses pesan asisten AI.' 
    }, { status: 500 });
  }
}

// DELETE: Hapus sesi chat tertentu beserta seluruh pesannya
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Session ID dan User ID wajib disertakan.' }, { status: 400 });
    }

    await pool.query(
      `DELETE FROM "ChatSession" WHERE id = $1 AND "userId" = $2`,
      [sessionId, userId]
    );

    return NextResponse.json({ message: 'Sesi chat berhasil dihapus.' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json({ error: 'Gagal menghapus sesi chat.' }, { status: 500 });
  }
}

