const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Radhiyya1512@localhost:5432/toolsumkm?schema=public'
  });

  try {
    await client.connect();
    console.log('✅ Berhasil terkoneksi ke database "toolsumkm" di PostgreSQL!');
    const res = await client.query('SELECT NOW()');
    console.log('🕒 Waktu server database saat ini:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Gagal terkoneksi ke database:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();
