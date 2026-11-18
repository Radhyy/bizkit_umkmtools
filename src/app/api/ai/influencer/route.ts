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

interface InfluencerItem {
  id: number;
  name: string;
  handle: string;
  platform: 'instagram' | 'tiktok';
  niche: string;
  cityRegion: string;
  followers: string;
  followersCount: number;
  engagement: string;
  matchScore: number;
  tags: string[];
  initials: string;
  avatarBg: string;
  description: string;
  rateEstimate: string;
  contact: InfluencerContact;
  isHype?: boolean;
}

function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Filter dan prioritaskan kandidat kreator berdasarkan Niche & KOTA/WILAYAH UMKM
function getCandidateCreators(category: string, userCity: string = ''): VerifiedCreator[] {
  const cat = (category || '').toLowerCase();
  const city = (userCity || '').toLowerCase().trim();

  // 1. Filter kategori niche
  let byNiche = VERIFIED_INFLUENCERS.filter((c) => {
    if (cat.includes('kuliner') || cat.includes('makanan') || cat.includes('minuman')) {
      return c.nicheCategory === 'kuliner' || c.nicheCategory === 'retail';
    }
    if (cat.includes('fashion') || cat.includes('busana') || cat.includes('hijab') || cat.includes('pakaian')) {
      return c.nicheCategory === 'fashion' || c.nicheCategory === 'retail';
    }
    if (cat.includes('kecantikan') || cat.includes('skincare') || cat.includes('bodycare') || cat.includes('kosmetik')) {
      return c.nicheCategory === 'beauty' || c.nicheCategory === 'fashion';
    }
    return true;
  });

  if (byNiche.length === 0) byNiche = VERIFIED_INFLUENCERS;

  // 2. Sort berdasarkan kedekatan lokasi: jika kreator meliput kota user (misal Sidoarjo / Surabaya), letakkan di PALING ATAS!
  if (city) {
    byNiche.sort((a, b) => {
      const aMatchesCity = a.citiesSupported.some((c) => city.includes(c) || c.includes(city));
      const bMatchesCity = b.citiesSupported.some((c) => city.includes(c) || c.includes(city));

      if (aMatchesCity && !bMatchesCity) return -1;
      if (!aMatchesCity && bMatchesCity) return 1;
      return 0;
    });
  }

  return byNiche;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || req.headers.get('x-user-id');
    const force = searchParams.get('force') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    // 1. Cek Profil Bisnis UMKM pengguna
    const profileRes = await pool.query(
      `SELECT "namaUsaha", "kategoriBisnis", "deskripsiBisnis", "targetAudiens", "platformFokus", "gayaPromosi", "budgetPromosi", "kotaLokasi"
       FROM "BusinessProfile"
       WHERE "userId" = $1 LIMIT 1`,
      [userId]
    );

    // Jika pengguna belum mengisi survei profil bisnis UMKM
    if (profileRes.rows.length === 0) {
      return NextResponse.json({
        profileFilled: false,
        profile: null,
        influencers: [],
        message: 'Pengguna belum mengisi profil bisnis UMKM.',
      });
    }

    const profile = profileRes.rows[0];
    const userCity = profile.kotaLokasi || 'Sidoarjo';
    const dateKey = getTodayKey();

    // 2. Cek Cache Harian di Database (Kecuali jika tombol force refresh ditekan)
    if (!force) {
      const cacheRes = await pool.query(
        `SELECT influencers, "updatedAt"
         FROM "AiInfluencerCache"
         WHERE "userId" = $1 AND "dateKey" = $2`,
        [userId, dateKey]
      );

      if (cacheRes.rows.length > 0) {
        return NextResponse.json({
          profileFilled: true,
          profile,
          influencers: cacheRes.rows[0].influencers,
          cached: true,
          dateKey,
          updatedAt: cacheRes.rows[0].updatedAt,
        });
      }
    }

    // 3. Ambil calon kandidat kreator ASLI dengan memprioritaskan KOTA / WILAYAH UMKM
    const candidateCreators = getCandidateCreators(profile.kategoriBisnis, userCity);

    let selectedInfluencers: InfluencerItem[] = [];

    // 4. Minta AI (Groq Load Balancer) untuk menilai, memilih 6 terbaik yang sesuai wilayah & niche
    try {
      const promptSystem = `
Kamu adalah AI Matchmaker Influencer & Pakar Marketing UMKM Indonesia.
Tugasmu: Dari daftar KREATOR ASLI & TERVERIFIKASI Indonesia berikut, pilih TEPAT 6 kreator yang paling cocok untuk mempromosikan bisnis UMKM pengguna.
SANGAT PENTING: Perhatikan Lokasi Kota UMKM (${userCity})! Prioritaskan kreator yang berdomisili atau fokus meliput wilayah ${userCity} dan sekitarnya agar relevan secara geografis!
JANGAN membuat akun fiktif atau mengubah username (@handle) mereka! Gunakan nama dan handle asli persis seperti di daftar.
Berikan skor kecocokan (85-99%) dan alasan personalisasi yang menghubungkan produk UMKM dengan wilayah/audiens kreator.

KEMBALIKAN HANYA JSON MURNI TANPA MARKDOWN (tanpa \`\`\`json, tanpa tanda pagar #, tanpa tanda bintang *).
Format JSON persis:
{
  "selectedHandles": [
    {
      "handle": "@handle_dari_daftar",
      "matchScore": 98,
      "personalizedReason": "Alasan singkat 1-2 kalimat kenapa kreator ini tepat untuk produk UMKM ini di wilayah ${userCity}.",
      "isHype": true
    }
  ]
}
      `.trim();

      const candidateSummary = candidateCreators.map((c) => 
        `- Name: ${c.name} | Handle: ${c.handle} | Wilayah: ${c.cityRegion} | Niche: ${c.nicheLabel} | Followers: ${c.followers} | ER: ${c.engagement} | Deskripsi: ${c.description}`
      ).join('\n');

      const promptUser = `
Profil Bisnis UMKM:
- Nama Usaha: ${profile.namaUsaha}
- Kategori Usaha: ${profile.kategoriBisnis}
- Lokasi Kota UMKM: ${userCity} (Prioritaskan kreator lokal di ${userCity} / sekitarnya!)
- Deskripsi Produk: ${profile.deskripsiBisnis || 'Produk unggulan UMKM lokal berkualitas'}
- Target Audiens: ${profile.targetAudiens}
- Platform Utama: ${profile.platformFokus}
- Gaya Promosi: ${profile.gayaPromosi}
- Estimasi Budget: ${profile.budgetPromosi || 'Standar UMKM'}

Daftar Kandidat Kreator Nyata (diurutkan berdasarkan wilayah terdekat):
${candidateSummary}

Pilih TEPAT 6 handle dari daftar di atas yang paling relevan dengan wilayah ${userCity} dan bidang bisnis ini.
      `.trim();

      const aiResponse = await groqChatCompletion(
        [
          { role: 'system', content: promptSystem },
          { role: 'user', content: promptUser }
        ],
        {
          temperature: 0.4,
          max_tokens: 1200,
        }
      );

      let rawText = aiResponse.text.trim();
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      }

      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed.selectedHandles) && parsed.selectedHandles.length > 0) {
        const handleMap = new Map<string, { matchScore: number; reason: string; isHype: boolean }>();
        parsed.selectedHandles.forEach((item: any) => {
          if (item.handle) {
            handleMap.set(item.handle.toLowerCase().trim(), {
              matchScore: Number(item.matchScore) || 92,
              reason: String(item.personalizedReason || '').replace(/[#*]/g, ''),
              isHype: Boolean(item.isHype),
            });
          }
        });

        // Petakan kandidat asli ke dalam hasil akhir
        const matched = candidateCreators.filter((c) => handleMap.has(c.handle.toLowerCase().trim()));
        const remaining = candidateCreators.filter((c) => !handleMap.has(c.handle.toLowerCase().trim()));
        const combined = [...matched, ...remaining].slice(0, 6);

        selectedInfluencers = combined.map((creator, idx) => {
          const aiData = handleMap.get(creator.handle.toLowerCase().trim());
          return {
            id: idx + 1,
            name: creator.name,
            handle: creator.handle,
            platform: creator.platform,
            niche: creator.nicheLabel,
            cityRegion: creator.cityRegion,
            followers: creator.followers,
            followersCount: creator.followersCount,
            engagement: creator.engagement,
            matchScore: aiData?.matchScore || (98 - idx * 2),
            tags: creator.tags,
            initials: creator.initials,
            avatarBg: creator.avatarBg,
            description: aiData?.reason || creator.description,
            rateEstimate: creator.rateEstimate,
            contact: creator.contact,
            isHype: aiData?.isHype ?? creator.isHype,
          };
        });
      }
    } catch (aiErr) {
      console.warn('[AI Influencer] Gagal memanggil AI, menggunakan kurasi kandidat asli terdekat:', aiErr);
    }

    // Jika AI tidak mengembalikan 6, gunakan 6 kandidat asli terdekat
    if (selectedInfluencers.length < 6) {
      selectedInfluencers = candidateCreators.slice(0, 6).map((creator, idx) => ({
        id: idx + 1,
        name: creator.name,
        handle: creator.handle,
        platform: creator.platform,
        niche: creator.nicheLabel,
        cityRegion: creator.cityRegion,
        followers: creator.followers,
        followersCount: creator.followersCount,
        engagement: creator.engagement,
        matchScore: 98 - idx * 2,
        tags: creator.tags,
        initials: creator.initials,
        avatarBg: creator.avatarBg,
        description: creator.description,
        rateEstimate: creator.rateEstimate,
        contact: creator.contact,
        isHype: creator.isHype,
      }));
    }

    // 5. Simpan ke Cache Harian di PostgreSQL
    const cacheId = 'inf_cache_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    await pool.query(
      `INSERT INTO "AiInfluencerCache" ("id", "userId", "dateKey", "influencers", "updatedAt")
       VALUES ($1, $2, $3, $4::jsonb, NOW())
       ON CONFLICT ("userId", "dateKey")
       DO UPDATE SET "influencers" = EXCLUDED."influencers", "updatedAt" = NOW()`,
      [cacheId, userId, dateKey, JSON.stringify(selectedInfluencers)]
    );

    return NextResponse.json({
      profileFilled: true,
      profile,
      influencers: selectedInfluencers,
      cached: false,
      dateKey,
      updatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error in /api/ai/influencer:', error);
    return NextResponse.json({ error: 'Gagal memproses rekomendasi influencer', detail: error?.message }, { status: 500 });
  }
}
