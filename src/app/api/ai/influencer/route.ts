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
// Hierarki Pengurutan:
// 1. Kedekatan Lokasi Influencer dengan Toko Dulu (Direct City > Regional > Nasional)
// 2. Frekuensi Kerjasama (Contact Log across all dashboard) & Prioritas Food Vlogger Kecil
// ========================================================
function rankInfluencersRAG(
  creators: VerifiedCreator[],
  businessProfile: any,
  contactCounts: Record<string, number>
): InfluencerItem[] {
  const userCity = (businessProfile?.kotaLokasi || 'Sidoarjo').toLowerCase().trim();
  const userCategory = (businessProfile?.kategoriBisnis || 'kuliner').toLowerCase().trim();
  const storeName = businessProfile?.namaUsaha || 'Toko UMKM';

  // Helper clustering wilayah aglomerasi / provinsi di Indonesia
  const isEastJava = (c: string) =>
    ['sidoarjo', 'surabaya', 'malang', 'gresik', 'mojokerto', 'pasuruan', 'batu', 'kediri', 'jember', 'banyuwangi', 'jatim', 'jawa timur'].some((k) => c.includes(k));

  const isJabodetabek = (c: string) =>
    ['jakarta', 'bogor', 'depok', 'tangerang', 'bekasi', 'tangsel', 'jabodetabek'].some((k) => c.includes(k));

  const isJatengDiy = (c: string) =>
    ['semarang', 'solo', 'surakarta', 'jogja', 'yogyakarta', 'magelang', 'salatiga', 'jateng', 'jawa tengah', 'diy'].some((k) => c.includes(k));

  const isJabar = (c: string) =>
    ['bandung', 'cimahi', 'cirebon', 'tasikmalaya', 'sukabumi', 'garut', 'jabar', 'jawa barat'].some((k) => c.includes(k));

  const isBali = (c: string) =>
    ['bali', 'denpasar', 'badung', 'ubud', 'canggu', 'kuta', 'seminyak'].some((k) => c.includes(k));

  const isSumut = (c: string) =>
    ['medan', 'binjai', 'deli serdang', 'sumut', 'sumatera utara'].some((k) => c.includes(k));

  const isSulsel = (c: string) =>
    ['makassar', 'gowa', 'maros', 'sulsel', 'sulawesi selatan'].some((k) => c.includes(k));

  const scoredList = creators.map((creator) => {
    const handleClean = creator.handle.toLowerCase().trim();
    const contactsForThisCreator = contactCounts[handleClean] || 0;
    const isSmallCreator = creator.tier === 'nano' || creator.tier === 'micro' || creator.followersCount <= 75000;

    // 1. TIER KEDEKATAN LOKASI (Prioritas Utama)
    // Tier 3: Langsung di kota toko (Direct City Match)
    // Tier 2: Kawasan regional / provinsi terdekat (Regional Match)
    // Tier 1: Nasional / Luar wilayah (National Match)
    const directCityMatch =
      creator.citiesSupported.some((c) => userCity.includes(c) || c.includes(userCity)) ||
      creator.cityRegion.toLowerCase().includes(userCity);

    const regionalMatch =
      (isEastJava(userCity) && (creator.citiesSupported.some(isEastJava) || isEastJava(creator.cityRegion.toLowerCase()))) ||
      (isJabodetabek(userCity) && (creator.citiesSupported.some(isJabodetabek) || isJabodetabek(creator.cityRegion.toLowerCase()))) ||
      (isJatengDiy(userCity) && (creator.citiesSupported.some(isJatengDiy) || isJatengDiy(creator.cityRegion.toLowerCase()))) ||
      (isJabar(userCity) && (creator.citiesSupported.some(isJabar) || isJabar(creator.cityRegion.toLowerCase()))) ||
      (isBali(userCity) && (creator.citiesSupported.some(isBali) || isBali(creator.cityRegion.toLowerCase()))) ||
      (isSumut(userCity) && (creator.citiesSupported.some(isSumut) || isSumut(creator.cityRegion.toLowerCase()))) ||
      (isSulsel(userCity) && (creator.citiesSupported.some(isSulsel) || isSulsel(creator.cityRegion.toLowerCase())));

    let locationTier = 1;
    if (directCityMatch) {
      locationTier = 3;
    } else if (regionalMatch) {
      locationTier = 2;
    } else {
      locationTier = 1;
    }

    // 2. FAKTOR KEDUA: LOG KONTAK KERJASAMA & KREATOR KECIL
    // Requirement:
    // - Berapa kali diajak kerjasama: Jika sudah terlalu sering dihubungi (banyak log kontak),
    //   posisinya diturunkan agar tidak terjadi saturasi / monopoli.
    // - Sebaliknya, kreator kecil (food vlogger lokal nano/micro) yang belum banyak dihubungi
    //   diangkat posisinya ke atas agar ternotice UMKM.
    const contactPenalty = contactsForThisCreator * 20;

    let smallCreatorScore = 0;
    if (isSmallCreator) {
      smallCreatorScore += 35;
      if (contactsForThisCreator === 0) {
        smallCreatorScore += 15; // Bonus belum pernah dihubungi
      }
    } else {
      if (contactsForThisCreator > 0) {
        smallCreatorScore -= 10;
      }
    }

    // Relevansi Niche
    let nicheScore = 15;
    if (userCategory.includes('kuliner') || userCategory.includes('makan') || userCategory.includes('minum')) {
      nicheScore = creator.nicheCategory === 'kuliner' ? 25 : 10;
    } else if (userCategory.includes('fashion') || userCategory.includes('baju') || userCategory.includes('hijab')) {
      nicheScore = (creator.nicheCategory === 'fashion' || creator.nicheCategory === 'retail') ? 25 : 8;
    } else {
      nicheScore = 18;
    }

    // Public ER Score
    const erScore = Math.min((parseFloat(creator.engagement) || 5) * 1.5, 15);

    const secondaryScore = smallCreatorScore + nicheScore + erScore - contactPenalty;

    // 3. ESTIMASI ENGAGEMENT / DAMPAK KE TOKO (PERSENTASE)
    const publicErNumber = parseFloat(creator.engagement) || 6.0;
    let storeEngagementNum = publicErNumber;
    if (directCityMatch) {
      storeEngagementNum += 4.5;
    } else if (regionalMatch) {
      storeEngagementNum += 2.8;
    }

    if (nicheScore >= 20) {
      storeEngagementNum += 2.0;
    }

    if (isSmallCreator) {
      storeEngagementNum += 3.2;
    }

    const estimatedStoreEngagement = `+${storeEngagementNum.toFixed(1)}%`;

    // 4. MATCH SCORE PERSENTASE UNTUK CARD
    // Tier 3 (Kota Toko): 95% - 99%
    // Tier 2 (Regional): 88% - 94%
    // Tier 1 (Nasional/Lain): 80% - 87%
    let matchScore = 80;
    const normalizedSec = Math.min(Math.max(secondaryScore / 70, 0), 1);
    if (locationTier === 3) {
      matchScore = Math.round(95 + normalizedSec * 4);
    } else if (locationTier === 2) {
      matchScore = Math.round(88 + normalizedSec * 6);
    } else {
      matchScore = Math.round(80 + normalizedSec * 7);
    }

    // 5. Default Rationale Berbasis RAG Lokasi & Profil Toko
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
      locationTier,
      secondaryScore,
      matchScore,
      estimatedStoreEngagement,
      isSmallCreator,
      contactCount: contactsForThisCreator,
      personalizedReason,
      collaborationTip,
    };
  });

  // PENGURUTAN STRICT:
  // 1. Kedekatan lokasi influencer dengan toko DULU
  // 2. Baru yang lain-lain (frekuensi kerjasama di platform & kreator kecil ke atas)
  // 3. Fallback: followers lebih kecil (lebih merakyat) jika seri
  scoredList.sort((a, b) => {
    if (b.locationTier !== a.locationTier) {
      return b.locationTier - a.locationTier;
    }
    if (b.secondaryScore !== a.secondaryScore) {
      return b.secondaryScore - a.secondaryScore;
    }
    return a.creator.followersCount - b.creator.followersCount;
  });

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
