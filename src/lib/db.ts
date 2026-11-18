import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const isRemoteDb = connectionString?.includes('neon.tech') || connectionString?.includes('sslmode=require');

const pool = new Pool({
  connectionString,
  ...(isRemoteDb ? { ssl: { rejectUnauthorized: false } } : {}),
});

export default pool;
