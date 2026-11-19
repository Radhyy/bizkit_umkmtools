require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Tambah kolom ke User
    await client.query(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "waToken" VARCHAR(50) UNIQUE,
      ADD COLUMN IF NOT EXISTS "waPhoneNumber" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "isWaConnected" BOOLEAN DEFAULT FALSE;
    `);

    // 2. Buat tabel WhatsAppBotSession
    await client.query(`
      CREATE TABLE IF NOT EXISTS "WhatsAppBotSession" (
        "id" VARCHAR(50) PRIMARY KEY DEFAULT 'primary',
        "phoneNumber" VARCHAR(50),
        "status" VARCHAR(30) NOT NULL DEFAULT 'waiting_scan',
        "qrCode" TEXT,
        "qrExpiresAt" TIMESTAMPTZ,
        "sessionData" TEXT,
        "connectedAt" TIMESTAMPTZ,
        "lastActiveAt" TIMESTAMPTZ DEFAULT NOW(),
        "totalMessages" INTEGER DEFAULT 0,
        "totalTransactions" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Buat tabel WhatsAppConversation
    await client.query(`
      CREATE TABLE IF NOT EXISTS "WhatsAppConversation" (
        "id" SERIAL PRIMARY KEY,
        "phoneNumber" VARCHAR(50) NOT NULL,
        "userId" VARCHAR(100),
        "state" VARCHAR(50) NOT NULL DEFAULT 'IDLE',
        "pendingAction" JSONB,
        "expiresAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_wa_conv_phone" ON "WhatsAppConversation"("phoneNumber");
    `);

    // 4. Buat tabel WhatsAppMessageLog
    await client.query(`
      CREATE TABLE IF NOT EXISTS "WhatsAppMessageLog" (
        "id" SERIAL PRIMARY KEY,
        "phoneNumber" VARCHAR(50) NOT NULL,
        "userId" VARCHAR(100),
        "direction" VARCHAR(20) NOT NULL,
        "messageText" TEXT NOT NULL,
        "keyUsedId" INTEGER,
        "latencyMs" INTEGER,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_wa_msg_phone" ON "WhatsAppMessageLog"("phoneNumber");
    `);

    // 5. Generate waToken untuk user yang belum punya
    const usersWithoutToken = await client.query('SELECT id, email FROM "User" WHERE "waToken" IS NULL');
    for (const u of usersWithoutToken.rows) {
      const rand = Math.floor(100000 + Math.random() * 900000);
      const token = 'BIZ-' + rand;
      await client.query('UPDATE "User" SET "waToken" = $1 WHERE id = $2', [token, u.id]);
    }

    // Inisialisasi default WhatsAppBotSession
    await client.query(`
      INSERT INTO "WhatsAppBotSession" ("id", "status", "qrCode", "qrExpiresAt")
      VALUES ('primary', 'waiting_scan', 'BIZKIT-WA-INIT', NOW() + INTERVAL '1 minute')
      ON CONFLICT ("id") DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('MIGRASI DATABASE WHATSAPP SUKSES!');
    console.log('Jumlah user di-assign waToken:', usersWithoutToken.rowCount);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('MIGRASI GAGAL:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
