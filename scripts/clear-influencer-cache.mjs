/**
 * clear-influencer-cache.mjs
 * 
 * Jalankan setiap kali kamu edit verifiedInfluencers.ts supaya
 * perubahan langsung muncul di website tanpa nunggu cache expire.
 * 
 * Usage:
 *   node scripts/clear-influencer-cache.mjs
 */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

// Load .env
const envText = readFileSync(envPath, 'utf-8');
for (const line of envText.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq < 0) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

const { default: pg } = await import('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const res = await pool.query('DELETE FROM "AiInfluencerCache"');
  console.log(`✅ Cache cleared: ${res.rowCount} row(s) deleted.`);
  console.log('   Influencer list akan di-rebuild dari verifiedInfluencers.ts saat halaman dibuka.');
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await pool.end();
}
