require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Connecting to database...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "PlanConfig" (
      "id" VARCHAR(50) PRIMARY KEY,
      "name" VARCHAR(100) NOT NULL,
      "description" TEXT,
      "price" NUMERIC NOT NULL DEFAULT 0,
      "originalPrice" NUMERIC DEFAULT 0,
      "billingCycle" VARCHAR(30) NOT NULL DEFAULT 'monthly',
      "badge" VARCHAR(50),
      "features" JSONB,
      "isActive" BOOLEAN DEFAULT TRUE,
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const initialPlans = [
    {
      id: 'free',
      name: 'Free Plan',
      description: 'Untuk pengguna baru yang ingin melihat gambaran platform. Akses dasbor dan seluruh fitur operasional dikunci.',
      price: 0,
      originalPrice: 0,
      billingCycle: 'lifetime',
      badge: 'Paket Dasar',
      features: JSON.stringify([
        'Akses Landing Page & Informasi Platform',
        'Akses Dashboard UMKM (Terkunci)',
        'Catat Pemasukan & Pengeluaran Kas (Terkunci)',
        'Laporan Keuangan & Grafik Otomatis (Terkunci)',
        'Asisten AI 24/7 & AI Content Builder (Terkunci)',
        'Cari Influencer & Matchmaking AI (Terkunci)',
        'Ekspor Data (Excel, CSV, PDF) (Terkunci)'
      ])
    },
    {
      id: 'premium_monthly',
      name: 'Premium Plan (Bulanan)',
      description: 'Membuka seluruh dasbor dan fitur pintar Bizkit untuk mengelola, menganalisis, dan melipatgandakan keuntungan UMKM Anda.',
      price: 49000,
      originalPrice: 79000,
      billingCycle: 'monthly',
      badge: 'Paling Populer',
      features: JSON.stringify([
        'Akses Penuh Dashboard UMKM realtime',
        'Catat Pemasukan & Pengeluaran tanpa batas',
        'Laporan Bisnis & Analisis Arus Kas otomatis',
        'Asisten AI 24/7 untuk solusi strategi bisnis Anda',
        'AI Content Builder (Copywriting & caption otomatis)',
        'AI Influencer Matchmaking untuk promosi produk',
        'Ekspor Laporan Lengkap ke Excel, CSV & PDF',
        'Dukungan Prioritas VIP & penyimpanan cloud aman'
      ])
    },
    {
      id: 'premium_annual',
      name: 'Premium Plan (Tahunan)',
      description: 'Akses penuh fitur premium dengan harga lebih terjangkau, ditagih sekaligus selama satu tahun penuh.',
      price: 468000,
      originalPrice: 588000,
      billingCycle: 'annual',
      badge: 'Hemat 20%',
      features: JSON.stringify([
        'Semua fitur lengkap Premium Plan selama 12 bulan',
        'Setara Rp 39.000 / bulan (Hemat Rp 120.000)',
        'Akses Penuh Dashboard UMKM realtime',
        'Catat Pemasukan & Pengeluaran tanpa batas',
        'Laporan Bisnis & Analisis Arus Kas otomatis',
        'Asisten AI 24/7 untuk solusi strategi bisnis Anda',
        'AI Content Builder & Influencer Matchmaking',
        'Dukungan Prioritas VIP & cloud cloud tanpa batas'
      ])
    }
  ];

  for (const p of initialPlans) {
    await pool.query(`
      INSERT INTO "PlanConfig" ("id", "name", "description", "price", "originalPrice", "billingCycle", "badge", "features", "isActive", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, TRUE, NOW())
      ON CONFLICT ("id") DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "features" = EXCLUDED."features",
        "badge" = EXCLUDED."badge";
    `, [p.id, p.name, p.description, p.price, p.originalPrice, p.billingCycle, p.badge, p.features]);
  }

  const res = await pool.query('SELECT id, name, price, "originalPrice", "billingCycle", "badge" FROM "PlanConfig" ORDER BY price ASC');
  console.log('MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('Seeded PlanConfig rows:', res.rows);
  await pool.end();
}

migrate().catch(e => {
  console.error('Migration error:', e);
  pool.end();
  process.exit(1);
});

