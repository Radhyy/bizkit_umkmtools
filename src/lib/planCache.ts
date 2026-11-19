import pool from '@/lib/db';

export interface PlanConfigItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  billingCycle: 'lifetime' | 'monthly' | 'annual';
  badge: string;
  features: string[];
  isActive: boolean;
  updatedAt: string;
}

interface PlanCacheState {
  plans: PlanConfigItem[] | null;
  lastFetched: number;
  hits: number;
  misses: number;
}

// Global in-memory cache ("otak cache") singleton
const globalForCache = globalThis as unknown as {
  planCacheState?: PlanCacheState;
};

const cacheState: PlanCacheState = globalForCache.planCacheState || {
  plans: null,
  lastFetched: 0,
  hits: 0,
  misses: 0,
};

if (process.env.NODE_ENV !== 'production') {
  globalForCache.planCacheState = cacheState;
}

// TTL: 15 Menit (otomatis refresh jika kedaluwarsa, atau instan saat admin mengubah harga)
const CACHE_TTL_MS = 15 * 60 * 1000;

const DEFAULT_PLANS: PlanConfigItem[] = [
  {
    id: 'free',
    name: 'Free Plan',
    description: 'Untuk pengguna baru yang ingin melihat gambaran platform. Akses dasbor dan seluruh fitur operasional dikunci.',
    price: 0,
    originalPrice: 0,
    billingCycle: 'lifetime',
    badge: 'Paket Dasar',
    features: [
      'Akses Landing Page & Informasi Platform',
      'Akses Dashboard UMKM (Terkunci)',
      'Catat Pemasukan & Pengeluaran Kas (Terkunci)',
      'Laporan Keuangan & Grafik Otomatis (Terkunci)',
      'Asisten AI 24/7 & AI Content Builder (Terkunci)',
      'Cari Influencer & Matchmaking AI (Terkunci)',
      'Ekspor Data (Excel, CSV, PDF) (Terkunci)'
    ],
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'premium_monthly',
    name: 'Premium Plan (Bulanan)',
    description: 'Membuka seluruh dasbor dan fitur pintar Bizkit untuk mengelola, menganalisis, dan melipatgandakan keuntungan UMKM Anda.',
    price: 49000,
    originalPrice: 79000,
    billingCycle: 'monthly',
    badge: 'Paling Populer',
    features: [
      'Akses Penuh Dashboard UMKM realtime',
      'Catat Pemasukan & Pengeluaran tanpa batas',
      'Laporan Bisnis & Analisis Arus Kas otomatis',
      'Asisten AI 24/7 untuk solusi strategi bisnis Anda',
      'AI Content Builder (Copywriting & caption otomatis)',
      'AI Influencer Matchmaking untuk promosi produk',
      'Ekspor Laporan Lengkap ke Excel, CSV & PDF',
      'Dukungan Prioritas VIP & penyimpanan cloud aman'
    ],
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'premium_annual',
    name: 'Premium Plan (Tahunan)',
    description: 'Akses penuh fitur premium dengan harga lebih terjangkau, ditagih sekaligus selama satu tahun penuh.',
    price: 468000,
    originalPrice: 588000,
    billingCycle: 'annual',
    badge: 'Hemat 20%',
    features: [
      'Semua fitur lengkap Premium Plan selama 12 bulan',
      'Setara Rp 39.000 / bulan (Hemat Rp 120.000)',
      'Akses Penuh Dashboard UMKM realtime',
      'Catat Pemasukan & Pengeluaran tanpa batas',
      'Laporan Bisnis & Analisis Arus Kas otomatis',
      'Asisten AI 24/7 untuk solusi strategi bisnis Anda',
      'AI Content Builder & Influencer Matchmaking',
      'Dukungan Prioritas VIP & cloud cloud tanpa batas'
    ],
    isActive: true,
    updatedAt: new Date().toISOString()
  }
];

/**
 * Mengambil seluruh paket dari in-memory cache ("otak cache").
 * Jika cache dingin / kedaluwarsa, baca database Neon PostgreSQL lalu simpan ke memory.
 */
export async function getPlanConfigs(forceRefresh = false): Promise<PlanConfigItem[]> {
  const now = Date.now();
  const isCacheValid = cacheState.plans !== null && (now - cacheState.lastFetched < CACHE_TTL_MS);

  if (isCacheValid && !forceRefresh) {
    cacheState.hits++;
    return cacheState.plans!;
  }

  cacheState.misses++;

  try {
    const res = await pool.query(`
      SELECT 
        id, 
        name, 
        description, 
        price::numeric, 
        "originalPrice"::numeric as "originalPrice", 
        "billingCycle", 
        badge, 
        features, 
        "isActive", 
        "updatedAt"
      FROM "PlanConfig"
      WHERE "isActive" = TRUE
      ORDER BY price ASC
    `);

    if (res.rows && res.rows.length > 0) {
      const formatted: PlanConfigItem[] = res.rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        price: Number(r.price) || 0,
        originalPrice: Number(r.originalPrice) || 0,
        billingCycle: r.billingCycle || 'monthly',
        badge: r.badge || '',
        features: Array.isArray(r.features) ? r.features : (typeof r.features === 'string' ? JSON.parse(r.features) : []),
        isActive: Boolean(r.isActive),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
      }));

      cacheState.plans = formatted;
      cacheState.lastFetched = now;
      return formatted;
    }
  } catch (err) {
    console.error('Error fetching plans from database, falling back to defaults/cache:', err);
  }

  // Fallback jika database belum ada atau error
  if (!cacheState.plans) {
    cacheState.plans = DEFAULT_PLANS;
    cacheState.lastFetched = now;
  }
  return cacheState.plans;
}

/**
 * Mengambil 1 paket berdasarkan ID
 */
export async function getPlanById(id: string): Promise<PlanConfigItem | null> {
  const plans = await getPlanConfigs();
  return plans.find(p => p.id === id) || null;
}

/**
 * Mengupdate harga paket di database dan langsung memperbarui cache memory (In-memory update)
 */
export async function updatePlanPrice(id: string, price: number, originalPrice?: number): Promise<PlanConfigItem | null> {
  const cleanPrice = Math.max(0, Math.round(price));
  const cleanOriginal = originalPrice !== undefined ? Math.max(0, Math.round(originalPrice)) : null;

  let query: string;
  let params: any[];

  if (cleanOriginal !== null) {
    query = `
      UPDATE "PlanConfig"
      SET price = $1, "originalPrice" = $2, "updatedAt" = NOW()
      WHERE id = $3
      RETURNING id, name, description, price::numeric, "originalPrice"::numeric, "billingCycle", badge, features, "isActive", "updatedAt"
    `;
    params = [cleanPrice, cleanOriginal, id];
  } else {
    query = `
      UPDATE "PlanConfig"
      SET price = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING id, name, description, price::numeric, "originalPrice"::numeric, "billingCycle", badge, features, "isActive", "updatedAt"
    `;
    params = [cleanPrice, id];
  }

  const res = await pool.query(query, params);

  if (res.rows.length === 0) {
    return null;
  }

  const updatedRow = res.rows[0];
  const updatedItem: PlanConfigItem = {
    id: updatedRow.id,
    name: updatedRow.name,
    description: updatedRow.description || '',
    price: Number(updatedRow.price) || 0,
    originalPrice: Number(updatedRow.originalPrice) || 0,
    billingCycle: updatedRow.billingCycle || 'monthly',
    badge: updatedRow.badge || '',
    features: Array.isArray(updatedRow.features) ? updatedRow.features : [],
    isActive: Boolean(updatedRow.isActive),
    updatedAt: new Date(updatedRow.updatedAt).toISOString()
  };

  // Instantly perbarui cache memory ("otak cache")
  if (cacheState.plans) {
    const idx = cacheState.plans.findIndex(p => p.id === id);
    if (idx !== -1) {
      cacheState.plans[idx] = updatedItem;
    } else {
      cacheState.plans.push(updatedItem);
    }
    cacheState.lastFetched = Date.now();
  } else {
    cacheState.plans = [updatedItem];
    cacheState.lastFetched = Date.now();
  }

  return updatedItem;
}

/**
 * Menghapus/mereset in-memory cache
 */
export function flushPlanCache(): void {
  cacheState.plans = null;
  cacheState.lastFetched = 0;
}

/**
 * Mengambil diagnostik & metrik performa otak cache
 */
export function getPlanCacheMetrics() {
  const now = Date.now();
  const isWarmed = cacheState.plans !== null;
  const ageSeconds = isWarmed ? Math.round((now - cacheState.lastFetched) / 1000) : 0;
  const ttlRemaining = isWarmed ? Math.max(0, Math.round((CACHE_TTL_MS - (now - cacheState.lastFetched)) / 1000)) : 0;

  return {
    isCached: isWarmed,
    lastFetchedAt: cacheState.lastFetched ? new Date(cacheState.lastFetched).toISOString() : null,
    cacheAgeSeconds: ageSeconds,
    ttlRemainingSeconds: ttlRemaining,
    hits: cacheState.hits,
    misses: cacheState.misses,
    cachedPlansCount: cacheState.plans?.length || 0
  };
}

