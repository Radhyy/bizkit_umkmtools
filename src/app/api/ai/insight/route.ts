import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';
import { groqChatCompletion } from '@/lib/groqClient';

interface WawasanItem {
  tipe: 'tren' | 'biaya' | 'rasio';
  judul: string;
  deskripsi: string;
  highlight?: string;
  status: 'positif' | 'peringatan' | 'netral';
}

interface TipItem {
  judul: string;
  deskripsi: string;
  kategori: 'omzet' | 'biaya' | 'kas';
}

// Clean helper to strip any residual markdown asterisks or hashes
function cleanText(txt: string): string {
  if (!txt) return '';
  return txt
    .replace(/[#*`_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || req.headers.get('x-user-id');
    const force = searchParams.get('force') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    // 1. Cek validitas user
    const userRes = await pool.query('SELECT id, name, role FROM "User" WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }
    const user = userRes.rows[0];

    // 2. Ambil profil bisnis (jika ada)
    const profileRes = await pool.query(
      `SELECT "namaUsaha", "kategoriBisnis", "deskripsiBisnis", "targetAudiens", "platformFokus", "updatedAt"
       FROM "BusinessProfile" WHERE "userId" = $1 LIMIT 1`,
      [userId]
    );
    const businessProfile = profileRes.rows[0] || null;

    // 3. Ambil data transaksi user
    const trxRes = await pool.query(
      `SELECT id, tipe, kategori, deskripsi, jumlah, tanggal, "updatedAt"
       FROM "Transaction" WHERE "userId" = $1
       ORDER BY tanggal DESC, "createdAt" DESC`,
      [userId]
    );
    const transactions = trxRes.rows;

    // 4. Hitung ringkasan & fingerprint
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let latestTrxUpdate = '0';

    const expenseMap: Record<string, { count: number; total: number }> = {};

    for (const trx of transactions) {
      const amt = Number(trx.jumlah) || 0;
      if (trx.tipe === 'masuk') {
        totalPemasukan += amt;
      } else if (trx.tipe === 'keluar') {
        totalPengeluaran += amt;
        const name = (trx.deskripsi || trx.kategori || 'Pengeluaran Lain').trim();
        if (!expenseMap[name]) {
          expenseMap[name] = { count: 0, total: 0 };
        }
        expenseMap[name].count += 1;
        expenseMap[name].total += amt;
      }

      const upd = new Date(trx.updatedAt).getTime();
      if (upd > Number(latestTrxUpdate)) {
        latestTrxUpdate = String(upd);
      }
    }

    const topExpenses = Object.entries(expenseMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const profileUpd = businessProfile?.updatedAt ? new Date(businessProfile.updatedAt).getTime() : 0;
    const dataFingerprint = `${transactions.length}_${totalPemasukan}_${totalPengeluaran}_${latestTrxUpdate}_${profileUpd}`;

    // 5. Cek Cache di Database (Jika tidak force dan fingerprint cocok, kembalikan data cache yang persis sama)
    if (!force) {
      const cacheRes = await pool.query(
        `SELECT "dataFingerprint", wawasan, tips, "updatedAt"
         FROM "AiInsightCache"
         WHERE "userId" = $1`,
        [userId]
      );

      if (cacheRes.rows.length > 0) {
        const cachedRow = cacheRes.rows[0];
        if (cachedRow.dataFingerprint === dataFingerprint) {
          return NextResponse.json({
            wawasan: cachedRow.wawasan,
            tips: cachedRow.tips,
            cached: true,
            updatedAt: cachedRow.updatedAt,
            fingerprint: dataFingerprint,
          });
        }
      }
    }

    // 6. Siapkan Fallback Cerdas berbasis Angka Riil jika AI timeout/offline
    const expenseRatio = totalPemasukan > 0 ? Math.round((totalPengeluaran / totalPemasukan) * 100) : 0;
    const topItem = topExpenses[0];

    const fallbackWawasan: WawasanItem[] = [
      {
        tipe: 'tren',
        judul: 'Pemasukan Bisnis',
        deskripsi: totalPemasukan > 0
          ? `Total pemasukan tercatat mencapai Rp ${totalPemasukan.toLocaleString('id-ID')} dari seluruh aktivitas penjualan Anda.`
          : 'Belum ada catatan transaksi pemasukan. Catat hasil penjualan Anda untuk melihat tren otomatis.',
        highlight: `Rp ${totalPemasukan.toLocaleString('id-ID')}`,
        status: totalPemasukan > 0 ? 'positif' : 'netral',
      },
      {
        tipe: 'biaya',
        judul: 'Pengeluaran Bahan Terbanyak',
        deskripsi: topItem
          ? `Alokasi biaya tertinggi saat ini adalah ${topItem.name} dengan ${topItem.count}x pembelian senilai Rp ${topItem.total.toLocaleString('id-ID')}.`
          : 'Belum ada catatan belanja bahan atau operasional yang tercatat di sistem.',
        highlight: topItem ? `Rp ${topItem.total.toLocaleString('id-ID')}` : 'Rp 0',
        status: topItem ? 'peringatan' : 'netral',
      },
      {
        tipe: 'rasio',
        judul: 'Rasio Arus Kas',
        deskripsi: totalPemasukan > 0
          ? `Total pengeluaran memakan ${expenseRatio}% dari seluruh pemasukan Anda. ${expenseRatio <= 65 ? 'Arus kas berada pada kondisi sehat.' : 'Perlu pengetatan belanja agar margin keuntungan tetap terjaga.'}`
          : 'Catat transaksi pemasukan dan pengeluaran secara konsisten untuk membaca rasio kesehatan kas UMKM Anda.',
        highlight: `${expenseRatio}%`,
        status: expenseRatio <= 65 ? 'positif' : 'peringatan',
      },
    ];

    const fallbackTips: TipItem[] = [
      {
        judul: 'Optimasi Penjualan & Promosi',
        deskripsi: businessProfile?.kategoriBisnis
          ? `Untuk bisnis sektor ${businessProfile.kategoriBisnis}, buat promosi berkala atau paket bundling khusus di jam atau hari sepi agar arus kas tetap berputar.`
          : 'Buat promosi berkala atau paket bundling khusus di jam atau hari sepi agar arus kas tetap berputar.',
        kategori: 'omzet',
      },
      {
        judul: 'Efisiensi Belanja Bahan Baku',
        deskripsi: topItem
          ? `Lakukan negosiasi harga atau bandingkan dengan supplier grosir lain untuk item ${topItem.name} guna menekan harga pokok penjualan.`
          : 'Bandingkan minimal 2 supplier langganan untuk bahan utama bisnis Anda guna mendapatkan potongan harga grosir.',
        kategori: 'biaya',
      },
      {
        judul: 'Alokasi Cadangan Kas Bisnis',
        deskripsi: 'Sisihkan minimal 10% hingga 15% dari keuntungan harian ke rekening cadangan terpisah sebelum digunakan untuk belanja non-esensial.',
        kategori: 'kas',
      },
    ];

    let wawasanFinal: WawasanItem[] = fallbackWawasan;
    let tipsFinal: TipItem[] = fallbackTips;

    // 7. Panggil Groq AI dengan Load Balancer jika ada data untuk dianalisis
    try {
      const businessName = businessProfile?.namaUsaha || user.name || 'UMKM Anda';
      const category = businessProfile?.kategoriBisnis || 'Umum';

      const promptUser = `
Data Profil Usaha:
- Nama Usaha: ${businessName}
- Kategori Usaha: ${category}
- Platform Utama: ${businessProfile?.platformFokus || 'Offline & Online'}

Data Keuangan Real dari Database:
- Total Pemasukan: Rp ${totalPemasukan.toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${totalPengeluaran.toLocaleString('id-ID')}
- Saldo Kas Bersih: Rp ${(totalPemasukan - totalPengeluaran).toLocaleString('id-ID')}
- Total Transaksi: ${transactions.length} transaksi
- Daftar Pengeluaran Bahan/Biaya Terbesar:
${topExpenses.map((e, idx) => `  ${idx + 1}. ${e.name} (${e.count}x belanja, Total: Rp ${e.total.toLocaleString('id-ID')})`).join('\n') || '  (Belum ada pengeluaran bahan)'}

Tugas:
Analisis data riil di atas dan buatkan:
1. "wawasan": Tepat 3 butir wawasan penting mengenai performa pemasukan, pengeluaran bahan terbesar, dan rasio kesehatan kas.
2. "tips": Tepat 3 saran/tips bisnis yang praktis dan aplikatif untuk menaikkan omzet dan efisiensi biaya.

PENTING:
- DILARANG menggunakan tanda format markdown seperti #, ##, ###, *, **, _, atau backticks dalam nilai teks JSON.
- Kembalikan HANYA JSON valid murni tanpa pembuka/penutup markdown seperti \`\`\`json.
Format JSON:
{
  "wawasan": [
    {
      "tipe": "tren",
      "judul": "...",
      "deskripsi": "...",
      "highlight": "...",
      "status": "positif"
    },
    {
      "tipe": "biaya",
      "judul": "...",
      "deskripsi": "...",
      "highlight": "...",
      "status": "peringatan"
    },
    {
      "tipe": "rasio",
      "judul": "...",
      "deskripsi": "...",
      "highlight": "...",
      "status": "netral"
    }
  ],
  "tips": [
    {
      "judul": "...",
      "deskripsi": "...",
      "kategori": "omzet"
    },
    {
      "judul": "...",
      "deskripsi": "...",
      "kategori": "biaya"
    },
    {
      "judul": "...",
      "deskripsi": "...",
      "kategori": "kas"
    }
  ]
}
      `.trim();

      const aiResponse = await groqChatCompletion([
        {
          role: 'system',
          content: 'Kamu adalah financial advisor cerdas untuk UMKM Indonesia. Keluarkan analisis keuangan singkat, tepat, tajam, dan hanya dalam format JSON murni tanpa markdown, tanpa tanda bintang (*), dan tanpa tanda pagar (#).'
        },
        {
          role: 'user',
          content: promptUser,
        }
      ], {
        temperature: 0.5,
        max_tokens: 1000,
      });

      let jsonStr = aiResponse.text.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      }

      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.wawasan) && parsed.wawasan.length > 0) {
        wawasanFinal = parsed.wawasan.slice(0, 3).map((w: any) => ({
          tipe: w.tipe === 'biaya' || w.tipe === 'rasio' ? w.tipe : 'tren',
          judul: cleanText(w.judul || 'Wawasan Bisnis'),
          deskripsi: cleanText(w.deskripsi || ''),
          highlight: cleanText(w.highlight || ''),
          status: w.status === 'positif' || w.status === 'peringatan' ? w.status : 'netral',
        }));
      }

      if (Array.isArray(parsed.tips) && parsed.tips.length > 0) {
        tipsFinal = parsed.tips.slice(0, 3).map((t: any) => ({
          judul: cleanText(t.judul || 'Tips Bisnis'),
          deskripsi: cleanText(t.deskripsi || ''),
          kategori: t.kategori === 'biaya' || t.kategori === 'kas' ? t.kategori : 'omzet',
        }));
      }
    } catch (aiErr) {
      console.warn('[AI Insight] Gagal memanggil AI, menggunakan fallback kalkulasi matematis:', aiErr);
    }

    // 8. Simpan ke Database Cache agar tidak berubah saat reload
    const cacheId = 'cache_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    await pool.query(
      `INSERT INTO "AiInsightCache" ("id", "userId", "dataFingerprint", "wawasan", "tips", "updatedAt")
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, NOW())
       ON CONFLICT ("userId")
       DO UPDATE SET 
         "dataFingerprint" = EXCLUDED."dataFingerprint", 
         "wawasan" = EXCLUDED."wawasan", 
         "tips" = EXCLUDED."tips", 
         "updatedAt" = NOW()`,
      [cacheId, userId, dataFingerprint, JSON.stringify(wawasanFinal), JSON.stringify(tipsFinal)]
    );

    return NextResponse.json({
      wawasan: wawasanFinal,
      tips: tipsFinal,
      cached: false,
      updatedAt: new Date().toISOString(),
      fingerprint: dataFingerprint,
    });

  } catch (error: any) {
    console.error('Error in /api/ai/insight:', error);
    return NextResponse.json({ error: 'Gagal memproses insight AI', detail: error?.message }, { status: 500 });
  }
}

