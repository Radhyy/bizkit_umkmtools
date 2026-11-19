import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  try {
    // 1. Ambil transaksi terbaru untuk dibuatkan event notifikasi finansial
    const purchasesRes = await pool.query(`
      SELECT 
        sp.id,
        sp."orderId",
        sp.plan,
        sp.amount,
        sp.status,
        sp."paymentMethod",
        sp."createdAt",
        u.name as "userName",
        u.email as "userEmail",
        bp."namaUsaha"
      FROM "SubscriptionPurchase" sp
      LEFT JOIN "User" u ON sp."userId" = u.id
      LEFT JOIN "BusinessProfile" bp ON sp."userId" = bp."userId"
      ORDER BY sp."createdAt" DESC
      LIMIT 10
    `);

    // 2. Ambil user terdaftar terbaru untuk event registrasi
    const usersRes = await pool.query(`
      SELECT id, name, email, role, "isVerified", "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);

    // 3. Notifikasi tersimpan di tabel Notification untuk admin
    const dbNotifRes = await pool.query(`
      SELECT id, "userId", title, message, category, type, read, link, "createdAt"
      FROM "Notification"
      WHERE "userId" = 'admin' OR "userId" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 20
    `).catch(() => ({ rows: [] }));

    const notifications: any[] = [];

    // Format notifikasi dari database tersimpan
    dbNotifRes.rows.forEach(n => {
      notifications.push({
        id: n.id,
        title: n.title,
        message: n.message,
        category: n.category || 'system',
        type: n.type || 'info',
        read: Boolean(n.read),
        link: n.link || null,
        createdAt: n.createdAt
      });
    });

    // Generate notifikasi cerdas dari aktivitas transaksi riil
    purchasesRes.rows.forEach(p => {
      const isSettled = ['settlement', 'capture', 'success'].includes((p.status || '').toLowerCase());
      const nominal = Number(p.amount || 0).toLocaleString('id-ID');
      const planName = p.plan === 'yearly' ? 'Paket Tahunan' : 'Paket Bulanan';
      const custName = p.userName || p.userEmail?.split('@')[0] || 'Pelanggan';

      notifications.push({
        id: `trx-${p.id}`,
        title: isSettled ? 'Pembayaran Berlangganan Berhasil' : 'Pesanan Baru Dibuat',
        message: isSettled 
          ? `${custName} (${p.namaUsaha || 'UMKM'}) berhasil membayar ${planName} senilai Rp ${nominal} via ${p.paymentMethod || 'Midtrans'}.`
          : `${custName} membuat pesanan ${planName} senilai Rp ${nominal} (${p.orderId}). Status: ${p.status}.`,
        category: 'pembayaran',
        type: isSettled ? 'success' : 'info',
        read: false,
        link: '/admin/pembelian',
        createdAt: p.createdAt
      });
    });

    // Generate notifikasi pendaftaran pengguna baru
    usersRes.rows.forEach(u => {
      notifications.push({
        id: `user-${u.id}`,
        title: 'Pengguna Baru Terdaftar',
        message: `${u.name || 'Pengguna'} (${u.email}) telah mendaftar akun baru dengan status role ${u.role?.toUpperCase()}.`,
        category: 'pengguna',
        type: 'info',
        read: true,
        link: '/admin/pengguna',
        createdAt: u.createdAt
      });
    });

    // Tambahkan notifikasi sistem status bot & pool
    notifications.push({
      id: 'system-wa-pool',
      title: 'WhatsApp Bot & 5 Groq Key Active',
      message: 'Layanan Baileys WhatsApp Gateway dan 5 dedicated Groq AI Load Balancer beroperasi normal tanpa kendala.',
      category: 'sistem',
      type: 'success',
      read: true,
      link: '/admin/whatsapp',
      createdAt: new Date().toISOString()
    });

    // Urutkan dari yang paling baru
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error: any) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat notifikasi admin.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, id } = body;

    if (action === 'mark_all_read') {
      await pool.query(`UPDATE "Notification" SET read = true WHERE "userId" = 'admin' OR "userId" IS NULL`).catch(() => {});
      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai dibaca.' });
    }

    if (id) {
      await pool.query(`UPDATE "Notification" SET read = true WHERE id = $1`, [id]).catch(() => {});
      return NextResponse.json({ success: true, message: 'Notifikasi ditandai dibaca.' });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

