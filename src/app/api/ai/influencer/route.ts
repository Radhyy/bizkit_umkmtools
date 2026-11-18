import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';
import { groqChatCompletion } from '@/lib/groqClient';
import { VERIFIED_INFLUENCERS, VerifiedCreator } from '@/lib/verifiedInfluencers';

interface InfluencerContact {
  whatsapp: string;
  email: string;
  instagramUrl: string;
  tiktokUrl: string;
}

export interface InfluencerItem {
  id: number;
  name: string;
  handle: string;
  platform: 'instagram' | 'tiktok';
  tier: 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
  niche: string;
  cityRegion: string;
  followers: string;
  followersCount: number;
  engagement: string; // Public ER
  estimatedStoreEngagement: string; // % Potensi interaksi/engagement langsung ke toko UMKM
  matchScore: number;
  tags: string[];
  initials: string;
  avatarBg: string;
  description: string;
  rateEstimate: string;
  contact: InfluencerContact;
  isHype?: boolean;
  isSmallCreator: boolean; // Flag food vlogger kecil (nano/micro)
  contactCount: number; // Log kontak across all dashboard
  recommendationReason?: string;
  collaborationTip?: string;
}

function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "InfluencerContactLog" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT,
      "influencerHandle" TEXT NOT NULL,
      "influencerName" TEXT,
      "actionType" TEXT NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "idx_inf_contact_log_handle" ON "InfluencerContactLog" ("influencerHandle");
    CREATE INDEX IF NOT EXISTS "idx_inf_contact_log_created_at" ON "InfluencerContactLog" ("createdAt");

    CREATE TABLE IF NOT EXISTS "AiInfluencerCache" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "dateKey" TEXT NOT NULL,
      "influencers" JSONB NOT NULL,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT "AiInfluencerCache_userId_dateKey_key" UNIQUE ("userId", "dateKey")
    );
  `);
}

// ========================================================
// RAG RETRIEVAL & DYNAMIC RANKING MECHANISM
// Termasuk Mekanisme Notice Food Vlogger Kecil & Log Kontak
// ========================================================
function rankInfluencersRAG(
  creators: VerifiedCreator[],
  businessProfile: any,
  contactCounts: Record<string, number>
): InfluencerItem[] {
  const userCity = (businessProfile?.kotaLokasi || 'Sidoarjo').toLowerCase().trim();
  const userCategory = (businessProfile?.kategoriBisnis || 'kuliner').toLowerCase().trim();
  const storeName = businessProfile?.namaUsaha || 'Toko UMKM';

  // Hitung total kontak di sistem
  let totalPlatformContacts = 0;
  Object.values(contactCounts).forEach((c) => {
    totalPlatformContacts += c;
  });

  const scoredList = creators.map((creator) => {
    const handleClean = creator.handle.toLowerCase().trim();
    const contactsForThisCreator = contactCounts[handleClean] || 0;
    const isSmallCreator = creator.tier === 'nano' || creator.tier === 'micro' || creator.followersCount <= 75000;

    // 1. SKOR GEOGRAFIS / LOKASI (Bobot Tinggi: 50 poin)
    let locScore = 15;
    const directCityMatch = creator.citiesSupported.some((c) => userCity.includes(c) || c.includes(userCity));
    const regionalMatch = 
      (userCity.includes('sidoarjo') || userCity.includes('surabaya') || userCity.includes('malang')) &&
      creator.citiesSupported.some(c => ['sidoarjo', 'surabaya', 'jatim', 'jawa timur', 'malang'].includes(c));

    if (directCityMatch) {
      locScore = 50; // Langsung di kota toko!
    } else if (regionalMatch) {
      locScore = 38; // Kawasan aglomerasi / provinsi terdekat
    } else if (creator.citiesSupported.includes('nasional') || creator.citiesSupported.includes('indonesia')) {
      locScore = 22;
    }

    // 2. SKOR NICHE / KATEGORI (Bobot: 30 poin)
    let nicheScore = 15;
    if (userCategory.includes('kuliner') || userCategory.includes('makan') || userCategory.includes('minum')) {
      nicheScore = creator.nicheCategory === 'kuliner' ? 30 : 18;
    } else if (userCategory.includes('fashion') || userCategory.includes('baju') || userCategory.includes('hijab')) {
      nicheScore = (creator.nicheCategory === 'fashion' || creator.nicheCategory === 'retail') ? 30 : 14;
    } else {
      nicheScore = 20;
    }

    // 3. MEKANISME LOG KONTAK ACROSS ALL DASHBOARD & NOTICE FOOD VLOGGER KECIL
    // Requirement:
    // "catat seluruh log (across all dashboard) yang menghubungi influencer, nanti kalau udah terlalu banyak, 
    //  influencer itu jangan ditaruh rekomendasi atas, sebaliknya, taruh influencer yang kecil keatas rekomendasi."
    
    // a) Penalti Saturasi: Semakin sering dihubungi di dashboard, skornya diturunkan
    const saturationPenalty = Math.min(contactsForThisCreator * 8, 42);

    // b) Boost Khusus Food Vlogger Kecil (Nano & Micro):
    // Food vlogger kecil diberikan dorongan skor agar naik ke atas
    let smallCreatorBoost = 0;
    if (isSmallCreator) {
      // Baseline prioritas untuk kreator kecil agar mudah ternotice
      smallCreatorBoost += 24;

      // Jika belum banyak atau belum pernah dihubungi sama sekali, beri bonus eksplorasi
      if (contactsForThisCreator === 0) {
        smallCreatorBoost += 12;
      }

      // Jika platform memiliki influencer besar yang sering dihubungi, otomatis angkat kreator kecil lebih tinggi lagi
      if (totalPlatformContacts > 0) {
        smallCreatorBoost += 8;
      }
    }

    // 4. ESTIMASI ENGAGEMENT / DAMPAK YANG BISA DIBERIKAN KE TOKO (PERSENTASE)
    // Requirement: "engagement yang bisa diberikan oleh influencer ke toko (persentase)"
    const publicErNumber = parseFloat(creator.engagement) || 6.0;
    let storeEngagementNum = publicErNumber;

    // Lokasi satu kota memberikan konversi kunjungan fisik / order lokal lebih tinggi
    if (directCityMatch) {
      storeEngagementNum += 4.5;
    } else if (regionalMatch) {
      storeEngagementNum += 2.8;
    }

    // Niche yang relevan meningkatkan konversi interaksi langsung
    if (nicheScore >= 25) {
      storeEngagementNum += 2.0;
    }

    // Kreator mikro/nano memiliki kedekatan audiens lokal & rasio interaksi per tayang lebih tinggi
    if (isSmallCreator) {
      storeEngagementNum += 3.2;
    }

    // Format persentase estimasi dampak ke toko
    const estimatedStoreEngagement = `+${storeEngagementNum.toFixed(1)}%`;

    // 5. TOTAL PERHITUNGAN SKOR AKHIR KANDIDAT
    let rawScore = locScore + nicheScore - saturationPenalty + smallCreatorBoost;

    // Normalisasi skor kecocokan dalam rentang 82% - 99%
    let matchScore = Math.min(Math.max(Math.round(75 + (rawScore / 115) * 24), 82), 99);

    // Default Rationale berbasis RAG Lokasi & Profil Toko
    let personalizedReason = creator.description;
    let collaborationTip = 'Kirim sampel produk terbaik Anda atau ajukan review santai di tempat.';

    if (directCityMatch && isSmallCreator) {
      personalizedReason = `Food vlogger lokal asli ${creator.cityRegion} dengan audiens warga sekitar yang sangat loyal. Sangat efektif mendatangkan pembeli lokal ke ${storeName} dengan biaya terjangkau.`;
      collaborationTip = `Ajak food vlogger ini mencoba menu andalan ${storeName}. Kreator lokal seperti ${creator.handle} sangat cepat merespons dan antusias mengulas kuliner sekitar!`;
    } else if (directCityMatch) {
      personalizedReason = `Kreator kuliner utama di ${creator.cityRegion}. Kontennya sering jadi rujukan kuliner warga lokal dan memiliki eksposur tinggi untuk ${storeName}.`;
      collaborationTip = `Ajukan promosi paket menu spesial atau promo diskon khusus followers ${creator.handle}.`;
    } else if (regionalMatch && isSmallCreator) {
      personalizedReason = `Kreator potensial kawasan sekitar ${creator.cityRegion} yang aktif menjelajahi kuliner terdekat. Berpeluang besar memperluas jangkauan ${storeName}.`;
      collaborationTip = `Kirimkan menu makanan kemasan atau undang saat kreator mengadakan agenda hunting kuliner di kota Anda.`;
    } else if (contactsForThisCreator > 2) {
      personalizedReason = `${creator.name} saat ini sedang banyak diminati UMKM lain di platform (${contactsForThisCreator}x dihubungi). Jadwalkan kolaborasi dari jauh hari.`;
      collaborationTip = `Gunakan template pesan profesional dan cantumkan ketersediaan jadwal serta detail produk dengan jelas.`;
    }

    return {
      creator,
      rawScore,
      matchScore,
      estimatedStoreEngagement,
      isSmallCreator,
      contactCount: contactsForThisCreator,
      personalizedReason,
      collaborationTip,
    };
  });

  // Urutkan kandidat berdasarkan skor tertinggi ke terendah
  scoredList.sort((a, b) => b.rawScore - a.rawScore);

  // Petakan ke antarmuka InfluencerItem
  return scoredList.map((item, idx) => ({
    id: idx + 1,
    name: item.creator.name,
    handle: item.creator.handle,
    platform: item.creator.platform,
    tier: item.creator.tier,
    niche: item.creator.nicheLabel,
    cityRegion: item.creator.cityRegion,
    followers: item.creator.followers,
    followersCount: item.creator.followersCount,
    engagement: item.creator.engagement,
    estimatedStoreEngagement: item.estimatedStoreEngagement,
    matchScore: item.matchScore,
    tags: item.creator.tags,
    initials: item.creator.initials,
    avatarBg: item.creator.avatarBg,
    description: item.personalizedReason,
    rateEstimate: item.creator.rateEstimate,
    contact: item.creator.contact,
    isHype: item.creator.isHype,
    isSmallCreator: item.isSmallCreator,
    contactCount: item.contactCount,
    recommendationReason: item.personalizedReason,
    collaborationTip: item.collaborationTip,
  }));
}

export async function GET(req: Request) {
  try {
    await ensureTables();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || req.headers.get('x-user-id');
    const force = searchParams.get('force') === 'true';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.max(parseInt(searchParams.get('limit') || '9', 10), 1); // Default 9 influencer per batch

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    // 1. Cek Profil Bisnis UMKM Pengguna
    const profileRes = await pool.query(
      `SELECT "namaUsaha", "kategoriBisnis", "deskripsiBisnis", "targetAudiens", "platformFokus", "gayaPromosi", "budgetPromosi", "kotaLokasi"
       FROM "BusinessProfile"
       WHERE "userId" = $1 LIMIT 1`,
      [userId]
    );

    if (profileRes.rows.length === 0) {
      return NextResponse.json({
        profileFilled: false,
        profile: null,
        influencers: [],
        totalAvailable: 0,
        hasMore: false,
        message: 'Pengguna belum mengisi profil bisnis UMKM.',
      });
    }

    const profile = profileRes.rows[0];
    const userCity = profile.kotaLokasi || 'Sidoarjo';
    const dateKey = getTodayKey();

    // 2. Ambil statistik log kontak across all dashboard
    const contactStatsRes = await pool.query(`
      SELECT "influencerHandle", COUNT(*)::int AS "contactCount"
      FROM "InfluencerContactLog"
      GROUP BY "influencerHandle"
    `);

    const contactCounts: Record<string, number> = {};
    contactStatsRes.rows.forEach((r) => {
      contactCounts[r.influencerHandle.toLowerCase().trim()] = r.contactCount;
    });

    let allRankedInfluencers: InfluencerItem[] = [];

    // 3. Cek Cache di Database (Jika tidak force refresh)
    if (!force) {
      const cacheRes = await pool.query(
        `SELECT influencers, "updatedAt"
         FROM "AiInfluencerCache"
         WHERE "userId" = $1 AND "dateKey" = $2`,
        [userId, dateKey]
      );

      if (cacheRes.rows.length > 0 && Array.isArray(cacheRes.rows[0].influencers) && cacheRes.rows[0].influencers.length > 0) {
        allRankedInfluencers = cacheRes.rows[0].influencers;
        // Perbarui contactCount terbaru pada data cache
        allRankedInfluencers.forEach((inf) => {
          inf.contactCount = contactCounts[inf.handle.toLowerCase().trim()] || 0;
        });
      }
    }

    // 4. Jika cache kosong atau force=true, jalankan RAG ranking baru
    if (allRankedInfluencers.length === 0) {
      allRankedInfluencers = rankInfluencersRAG(VERIFIED_INFLUENCERS, profile, contactCounts);

      // Jalankan AI LLM enhancement secara asinkron/opsional untuk memperkaya deskripsi batch teratas
      try {
        const topBatch = allRankedInfluencers.slice(0, 9);
        const topSummary = topBatch.map((c) => 
          `- Handle: ${c.handle} | Name: ${c.name} | Wilayah: ${c.cityRegion} | Niche: ${c.niche} | Tier: ${c.tier} | Followers: ${c.followers}`
        ).join('\n');

        const promptSystem = `
Kamu adalah AI Matchmaker Influencer & Pakar Marketing UMKM Indonesia.
Tugasmu: Berikan analisa 1 kalimat tajam dan 1 tips kolaborasi praktis untuk toko UMKM "${profile.namaUsaha}" (Bidang: ${profile.kategoriBisnis}, Lokasi: ${userCity}).
Fokuskan pada alasan mengapa kreator lokal ini cocok dan persentase dampak yang bisa diberikan ke toko.
KEMBALIKAN HANYA JSON MURNI TANPA MARKDOWN (\`\`\`json). Format:
{
  "enhancements": [
    {
      "handle": "@handle",
      "reason": "Alasan singkat 1 kalimat keterkaitan produk dengan audiens kreator di ${userCity}.",
      "tip": "Tips kolaborasi ringkas 1 kalimat."
    }
  ]
}
        `.trim();

        const promptUser = `
Toko: ${profile.namaUsaha} (${profile.kategoriBisnis}) di ${userCity}.
Deskripsi: ${profile.deskripsiBisnis || 'Produk unggulan lokal'}. Target: ${profile.targetAudiens}.
Kandidat Teratas:
${topSummary}
        `.trim();

        const aiResponse = await groqChatCompletion(
          [
            { role: 'system', content: promptSystem },
            { role: 'user', content: promptUser },
          ],
          { temperature: 0.3, max_tokens: 1000 }
        );

        let rawText = aiResponse.text.trim();
        if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
        }

        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed.enhancements)) {
          const enhMap = new Map<string, { reason: string; tip: string }>();
          parsed.enhancements.forEach((e: any) => {
            if (e.handle) {
              enhMap.set(e.handle.toLowerCase().trim(), {
                reason: String(e.reason || '').replace(/[#*]/g, ''),
                tip: String(e.tip || '').replace(/[#*]/g, ''),
              });
            }
          });

          allRankedInfluencers.forEach((inf) => {
            const enh = enhMap.get(inf.handle.toLowerCase().trim());
            if (enh) {
              if (enh.reason) inf.description = enh.reason;
              if (enh.reason) inf.recommendationReason = enh.reason;
              if (enh.tip) inf.collaborationTip = enh.tip;
            }
          });
        }
      } catch (aiErr) {
        // Fallback RAG lokal sudah sangat akurat, tetap lanjutkan
        console.warn('[AI Influencer] Menggunakan deskripsi RAG bawaan:', aiErr);
      }

      // Simpan seluruh kandidat terurut ke dalam cache harian PostgreSQL
      const cacheId = 'inf_cache_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
      await pool.query(
        `INSERT INTO "AiInfluencerCache" ("id", "userId", "dateKey", "influencers", "updatedAt")
         VALUES ($1, $2, $3, $4::jsonb, NOW())
         ON CONFLICT ("userId", "dateKey")
         DO UPDATE SET "influencers" = EXCLUDED."influencers", "updatedAt" = NOW()`,
        [cacheId, userId, dateKey, JSON.stringify(allRankedInfluencers)]
      );
    }

    // 5. Paginate 9 Influencer per Batch
    const totalAvailable = allRankedInfluencers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = allRankedInfluencers.slice(startIndex, endIndex);
    const hasMore = endIndex < totalAvailable;

    return NextResponse.json({
      profileFilled: true,
      profile,
      influencers: paginatedItems,
      page,
      limit,
      totalAvailable,
      hasMore,
      cached: !force,
      dateKey,
      updatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error in /api/ai/influencer:', error);
    return NextResponse.json({ error: 'Gagal memproses rekomendasi influencer', detail: error?.message }, { status: 500 });
  }
}
