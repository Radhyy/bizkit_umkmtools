import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

// GET: Ambil daftar transaksi milik akun yang sedang login
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan untuk mengakses data keuangan.' }, { status: 400 });
    }

    // Pastikan user valid
    const userCheck = await pool.query('SELECT id FROM "User" WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Ambil transaksi hanya milik akun tersebut
    const result = await pool.query(
      `SELECT id, "userId", tipe, kategori, deskripsi, jumlah, tanggal, "createdAt", "updatedAt"
       FROM "Transaction"
       WHERE "userId" = $1
       ORDER BY tanggal DESC, "createdAt" DESC`,
      [userId]
    );

    const transactions = result.rows;

    // Hitung ringkasan statistik
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    for (const trx of transactions) {
      const amt = Number(trx.jumlah) || 0;
      if (trx.tipe === 'masuk') {
        totalPemasukan += amt;
      } else if (trx.tipe === 'keluar') {
        totalPengeluaran += amt;
      }
    }

    const saldo = totalPemasukan - totalPengeluaran;

    return NextResponse.json({
      transactions,
      summary: {
        totalPemasukan,
        totalPengeluaran,
        saldo,
        totalTransaksi: transactions.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Gagal mengambil data keuangan.' }, { status: 500 });
  }
}

// POST: Tambah transaksi baru untuk akun yang sedang login
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, tipe, kategori, deskripsi, jumlah, tanggal } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    if (!tipe || !['masuk', 'keluar', 'PEMASUKAN', 'PENGELUARAN'].includes(tipe)) {
      return NextResponse.json({ error: 'Tipe transaksi harus masuk (pemasukan) atau keluar (pengeluaran).' }, { status: 400 });
    }

    if (!kategori || !kategori.trim()) {
      return NextResponse.json({ error: 'Kategori transaksi wajib diisi.' }, { status: 400 });
    }

    if (!deskripsi || !deskripsi.trim()) {
      return NextResponse.json({ error: 'Deskripsi / keterangan transaksi wajib diisi.' }, { status: 400 });
    }

    const parsedJumlah = parseFloat(jumlah);
    if (isNaN(parsedJumlah) || parsedJumlah <= 0) {
      return NextResponse.json({ error: 'Jumlah nominal transaksi harus lebih dari 0.' }, { status: 400 });
    }

    // Normalisasi tipe ke 'masuk' atau 'keluar'
    const normalizedTipe = (tipe.toLowerCase() === 'pemasukan' || tipe.toLowerCase() === 'masuk') ? 'masuk' : 'keluar';

    // Normalisasi tanggal
    let trxDate = new Date();
    if (tanggal) {
      const parsedDate = new Date(tanggal);
      if (!isNaN(parsedDate.getTime())) {
        trxDate = parsedDate;
      }
    }

    // Verifikasi kepemilikan akun
    const userCheck = await pool.query('SELECT id FROM "User" WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const id = crypto.randomUUID();

    const insertResult = await pool.query(
      `INSERT INTO "Transaction" ("id", "userId", "tipe", "kategori", "deskripsi", "jumlah", "tanggal", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, "userId", tipe, kategori, deskripsi, jumlah, tanggal, "createdAt", "updatedAt"`,
      [id, userId, normalizedTipe, kategori.trim(), deskripsi.trim(), parsedJumlah, trxDate]
    );

    // Otomatis buat notifikasi realtime ke database
    try {
      const notifId = 'notif_trx_' + id.replace(/-/g, '').substring(0, 14);
      const isMasuk = normalizedTipe === 'masuk';
      const nominalFormatted = 'Rp ' + Number(parsedJumlah).toLocaleString('id-ID');
      await pool.query(
        `INSERT INTO "Notification" ("id", "userId", "title", "message", "category", "type", "read", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
        [
          notifId,
          userId,
          isMasuk ? 'Pemasukan Kas Tercatat' : 'Pengeluaran Kas Dicatat',
          isMasuk 
            ? `Pembayaran pesanan / omzet ${kategori.trim()} sebesar ${nominalFormatted} (${deskripsi.trim()}) telah berhasil ditambahkan ke kas masuk.`
            : `Pengeluaran ${kategori.trim()} sebesar ${nominalFormatted} (${deskripsi.trim()}) telah dicatat ke pembukuan.`,
          'keuangan',
          isMasuk ? 'success' : 'alert'
        ]
      );
    } catch (notifErr) {
      console.warn('Gagal menyimpan notifikasi transaksi:', notifErr);
    }

    return NextResponse.json({
      message: 'Transaksi keuangan berhasil disimpan.',
      transaction: insertResult.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Gagal menyimpan transaksi keuangan.' }, { status: 500 });
  }
}
