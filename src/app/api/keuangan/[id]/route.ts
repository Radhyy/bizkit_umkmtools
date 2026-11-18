import { NextResponse } from 'next/server';
import pool from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PUT / PATCH: Ubah data transaksi milik akun yang login
export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { userId, tipe, kategori, deskripsi, jumlah, tanggal } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID transaksi wajib disertakan.' }, { status: 400 });
    }

    // Pastikan transaksi ada dan milik user yang bersangkutan
    const checkResult = await pool.query(
      `SELECT id, "userId" FROM "Transaction" WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan.' }, { status: 404 });
    }

    if (checkResult.rows[0].userId !== userId) {
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki hak untuk mengubah transaksi ini.' }, { status: 403 });
    }

    // Validasi data baru
    if (tipe && !['masuk', 'keluar', 'PEMASUKAN', 'PENGELUARAN'].includes(tipe)) {
      return NextResponse.json({ error: 'Tipe transaksi harus masuk atau keluar.' }, { status: 400 });
    }

    const normalizedTipe = tipe 
      ? ((tipe.toLowerCase() === 'pemasukan' || tipe.toLowerCase() === 'masuk') ? 'masuk' : 'keluar')
      : undefined;

    const parsedJumlah = jumlah !== undefined ? parseFloat(jumlah) : undefined;
    if (parsedJumlah !== undefined && (isNaN(parsedJumlah) || parsedJumlah <= 0)) {
      return NextResponse.json({ error: 'Jumlah nominal transaksi harus lebih dari 0.' }, { status: 400 });
    }

    let trxDate: Date | undefined = undefined;
    if (tanggal) {
      const parsedDate = new Date(tanggal);
      if (!isNaN(parsedDate.getTime())) {
        trxDate = parsedDate;
      }
    }

    // Update transaksi
    const updateResult = await pool.query(
      `UPDATE "Transaction"
       SET 
         tipe = COALESCE($1, tipe),
         kategori = COALESCE($2, kategori),
         deskripsi = COALESCE($3, deskripsi),
         jumlah = COALESCE($4, jumlah),
         tanggal = COALESCE($5, tanggal),
         "updatedAt" = NOW()
       WHERE id = $6 AND "userId" = $7
       RETURNING id, "userId", tipe, kategori, deskripsi, jumlah, tanggal, "createdAt", "updatedAt"`,
      [
        normalizedTipe || null,
        kategori ? kategori.trim() : null,
        deskripsi ? deskripsi.trim() : null,
        parsedJumlah !== undefined ? parsedJumlah : null,
        trxDate || null,
        id,
        userId
      ]
    );

    return NextResponse.json({
      message: 'Transaksi berhasil diperbarui.',
      transaction: updateResult.rows[0]
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Gagal memperbarui transaksi.' }, { status: 500 });
  }
}

// DELETE: Hapus transaksi milik akun yang login
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || req.headers.get('x-user-id');

    if (!id) {
      return NextResponse.json({ error: 'ID transaksi wajib disertakan.' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan untuk verifikasi kepemilikan akun.' }, { status: 400 });
    }

    // Cek kepemilikan transaksi
    const checkResult = await pool.query(
      `SELECT id, "userId" FROM "Transaction" WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan.' }, { status: 404 });
    }

    if (checkResult.rows[0].userId !== userId) {
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki hak untuk menghapus transaksi ini.' }, { status: 403 });
    }

    // Eksekusi penghapusan
    await pool.query(
      `DELETE FROM "Transaction" WHERE id = $1 AND "userId" = $2`,
      [id, userId]
    );

    return NextResponse.json({
      message: 'Transaksi berhasil dihapus.'
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Gagal menghapus transaksi.' }, { status: 500 });
  }
}
