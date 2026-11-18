const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    console.log('Connecting to database...');
    // Create BusinessProfile table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "BusinessProfile" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "namaUsaha" TEXT NOT NULL,
        "kategoriBisnis" TEXT NOT NULL,
        "deskripsiBisnis" TEXT,
        "targetAudiens" TEXT NOT NULL,
        "platformFokus" TEXT NOT NULL,
        "gayaPromosi" TEXT NOT NULL,
        "budgetPromosi" TEXT,
        "kotaLokasi" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('Table "BusinessProfile" verified or created successfully!');

    // Check table
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'BusinessProfile'
    `);
    console.log('Columns in BusinessProfile:', res.rows.map(r => `${r.column_name} (${r.data_type})`));
  } catch (err) {
    console.error('Database setup error:', err);
  } finally {
    await pool.end();
  }
}

run();

