const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    console.log('Setting up ChatSession and ChatMessage tables in PostgreSQL...');
    
    // 1. Create ChatSession table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "ChatSession" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL DEFAULT 'Obrolan Baru',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "ChatSession_userId_idx" ON "ChatSession"("userId");
    `);

    // 2. Create ChatMessage table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "ChatMessage" (
        "id" TEXT PRIMARY KEY,
        "sessionId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");
      CREATE INDEX IF NOT EXISTS "ChatMessage_userId_idx" ON "ChatMessage"("userId");
    `);

    console.log('Chat tables created successfully in database!');

    const res1 = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ChatSession'`);
    console.log('Columns in ChatSession:', res1.rows.map(r => r.column_name));

    const res2 = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ChatMessage'`);
    console.log('Columns in ChatMessage:', res2.rows.map(r => r.column_name));
  } catch (err) {
    console.error('Error creating chat tables:', err);
  } finally {
    await pool.end();
  }
}

run();

