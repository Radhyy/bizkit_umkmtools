import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Helper: Hitung status trial user
function calculateTrialInfo(user: any) {
  const isSuperAdmin = user.email?.toLowerCase() === 'radiaakbarradia@gmail.com';
  const role = isSuperAdmin ? 'admin' : (user.role || 'free');

  let trialStatus: 'none' | 'active' | 'expired' = 'none';
  let daysLeft = 0;

  // Trial hanya aktif jika role pengguna memang 'trial'
  if (role === 'trial' && user.trialEndsAt) {
    const now = new Date();
    const trialDate = new Date(user.trialEndsAt);
    const diffMs = trialDate.getTime() - now.getTime();
    daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs > 0) {
      trialStatus = 'active';
      daysLeft = Math.max(1, daysLeft);
    } else {
      trialStatus = 'expired';
      daysLeft = 0;
    }
  }

  // Apakah user punya akses aktif ke dashboard
  const hasDashboardAccess = !user.isLocked && (
    role === 'admin' || 
    role === 'premium' || 
    (role === 'trial' && trialStatus === 'active')
  );

  return {
    role,
    trialStatus,
    daysLeft,
    hasDashboardAccess,
    isSuperAdmin
  };
}

// GET: Ambil daftar pengguna lengkap dengan data profil bisnis dan statistik
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u."isVerified", 
        u."isLocked",
        u."trialEndsAt",
        u."trialGrantedDays",
        u."createdAt", 
        u."updatedAt",
        bp."namaUsaha",
        bp."kategoriBisnis",
        bp."kotaLokasi"
      FROM "User" u
      LEFT JOIN "BusinessProfile" bp ON bp."userId" = u.id
      ORDER BY u."createdAt" DESC
    `);

    const users = result.rows.map(row => {
      const trialInfo = calculateTrialInfo(row);
      return {
        ...row,
        role: trialInfo.role,
        trialStatus: trialInfo.trialStatus,
        daysLeft: trialInfo.daysLeft,
        hasDashboardAccess: trialInfo.hasDashboardAccess,
        isSuperAdmin: trialInfo.isSuperAdmin,
      };
    });

    const stats = {
      total: users.length,
      premium: users.filter(u => u.role === 'premium').length,
      trialActive: users.filter(u => u.trialStatus === 'active').length,
      free: users.filter(u => u.role === 'free' && u.trialStatus !== 'active').length,
      admin: users.filter(u => u.role === 'admin').length,
      lockedOrExpired: users.filter(u => u.isLocked || u.trialStatus === 'expired').length,
    };

    return NextResponse.json({ users, stats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pengguna.' }, { status: 500 });
  }
}

// POST: Tambah pengguna baru oleh Super Admin
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role = 'free', trialDays = 0, isVerified = true } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    // Cek apakah email sudah terdaftar
    const existing = await pool.query('SELECT id FROM "User" WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar di sistem.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    let trialEndsAt: Date | null = null;
    let assignedRole = role;
    const parsedDays = parseInt(trialDays, 10) || 0;

    if (assignedRole === 'trial' || parsedDays > 0) {
      assignedRole = 'trial';
      const days = parsedDays > 0 ? parsedDays : 7;
      trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    const insertResult = await pool.query(`
      INSERT INTO "User" (
        id, 
        name, 
        email, 
        password, 
        role, 
        "isVerified", 
        "isLocked",
        "trialEndsAt",
        "trialGrantedDays",
        "createdAt", 
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, NOW(), NOW())
      RETURNING id, name, email, role, "isVerified", "isLocked", "trialEndsAt", "createdAt"
    `, [
      userId,
      name?.trim() || null,
      email.trim().toLowerCase(),
      hashedPassword,
      assignedRole,
      isVerified,
      trialEndsAt,
      parsedDays
    ]);

    const newUser = insertResult.rows[0];

    // Tambahkan notifikasi selamat datang
    try {
      await pool.query(`
        INSERT INTO "Notification" (id, "userId", title, message, category, type, read, "createdAt")
        VALUES ($1, $2, $3, $4, 'keuangan', 'info', false, NOW())
      `, [
        uuidv4(),
        userId,
        'Selamat Datang di Bizkit!',
        trialEndsAt 
          ? `Akun Anda telah diaktifkan dengan masa trial ${parsedDays || 7} hari. Selamat menjelajahi fitur Bizkit!`
          : 'Akun Anda berhasil didaftarkan oleh administrator.'
      ]);
    } catch (e) {
      // notif optional
    }

    return NextResponse.json({
      message: 'Pengguna baru berhasil ditambahkan.',
      user: newUser
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user by admin:', error);
    return NextResponse.json({ error: 'Gagal menambahkan pengguna baru.' }, { status: 500 });
  }
}

// PATCH: Kelola pengguna (Beri Trial, Toggle Kunci, Ubah Role, Edit Data)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    // 1. Aksi: Berikan atau Perpanjang Masa Trial
    if (action === 'give_trial') {
      const days = parseInt(body.days, 10);
      if (isNaN(days) || days <= 0) {
        return NextResponse.json({ error: 'Jumlah hari trial harus berupa angka positif.' }, { status: 400 });
      }

      // Hitung tanggal trial berakhir
      const trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const updateResult = await pool.query(`
        UPDATE "User"
        SET 
          role = 'trial',
          "trialEndsAt" = $1,
          "trialGrantedDays" = $2,
          "isLocked" = false,
          "updatedAt" = NOW()
        WHERE id = $3
        RETURNING id, name, email, role, "trialEndsAt", "isLocked"
      `, [trialEndsAt, days, userId]);

      if (updateResult.rowCount === 0) {
        return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
      }

      // Kirim notifikasi realtime ke user
      try {
        await pool.query(`
          INSERT INTO "Notification" (id, "userId", title, message, category, type, read, "createdAt")
          VALUES ($1, $2, $3, $4, 'keuangan', 'info', false, NOW())
        `, [
          uuidv4(),
          userId,
          `Masa Trial Aktif: ${days} Hari`,
          `Super Administrator telah mengaktifkan akses trial selama ${days} hari untuk akun Anda. Seluruh fitur dashboard kini dapat Anda gunakan!`
        ]);
      } catch (e) {}

      return NextResponse.json({
        message: `Masa trial berhasil diberikan selama ${days} hari.`,
        user: updateResult.rows[0]
      }, { status: 200 });
    }

    // 2. Aksi: Kunci atau Buka Kunci Akses Pengguna
    if (action === 'toggle_lock') {
      const isLocked = Boolean(body.isLocked);

      // Lindungi akun Super Admin utama
      const checkAdmin = await pool.query('SELECT email FROM "User" WHERE id = $1', [userId]);
      if (checkAdmin.rows[0]?.email?.toLowerCase() === 'radiaakbarradia@gmail.com') {
        return NextResponse.json({ error: 'Akun Super Administrator utama tidak dapat dikunci.' }, { status: 403 });
      }

      const updateResult = await pool.query(`
        UPDATE "User"
        SET "isLocked" = $1, "updatedAt" = NOW()
        WHERE id = $2
        RETURNING id, name, email, "isLocked"
      `, [isLocked, userId]);

      if (updateResult.rowCount === 0) {
        return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
      }

      return NextResponse.json({
        message: isLocked ? 'Akses dashboard pengguna berhasil dikunci.' : 'Akses pengguna berhasil dibuka kembali.',
        user: updateResult.rows[0]
      }, { status: 200 });
    }

    // 3. Aksi: Ubah Role Pengguna (free, trial, premium, admin)
    if (action === 'change_role' || (!action && body.newRole)) {
      const newRole = body.newRole;
      if (!['free', 'trial', 'premium', 'admin'].includes(newRole)) {
        return NextResponse.json({ error: 'Pilihan role tidak valid.' }, { status: 400 });
      }

      let updateResult;

      if (newRole === 'trial') {
        const days = parseInt(body.trialDays, 10) || 7;
        const trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        updateResult = await pool.query(`
          UPDATE "User"
          SET 
            role = $1,
            "trialEndsAt" = $2,
            "trialGrantedDays" = $3,
            "isLocked" = false,
            "updatedAt" = NOW()
          WHERE id = $4
          RETURNING id, name, email, role, "isLocked", "trialEndsAt"
        `, [newRole, trialEndsAt, days, userId]);
      } else if (newRole === 'premium') {
        updateResult = await pool.query(`
          UPDATE "User"
          SET 
            role = $1,
            "trialEndsAt" = NULL,
            "trialGrantedDays" = 0,
            "isLocked" = false,
            "updatedAt" = NOW()
          WHERE id = $2
          RETURNING id, name, email, role, "isLocked", "trialEndsAt"
        `, [newRole, userId]);
      } else {
        // newRole === 'free' atau 'admin': bersihkan masa trial
        updateResult = await pool.query(`
          UPDATE "User"
          SET 
            role = $1,
            "trialEndsAt" = NULL,
            "trialGrantedDays" = 0,
            "updatedAt" = NOW()
          WHERE id = $2
          RETURNING id, name, email, role, "isLocked", "trialEndsAt"
        `, [newRole, userId]);
      }

      if (updateResult.rowCount === 0) {
        return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
      }

      return NextResponse.json({
        message: `Role pengguna berhasil diubah menjadi ${newRole}.`,
        user: updateResult.rows[0]
      }, { status: 200 });
    }

    // 4. Aksi: Edit Data Pengguna (Nama, Email, Password)
    if (action === 'edit_user') {
      const { name, email, password } = body;

      if (!email) {
        return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 });
      }

      // Cek apakah email bentrok dengan user lain
      const existing = await pool.query('SELECT id FROM "User" WHERE LOWER(email) = LOWER($1) AND id != $2', [email.trim(), userId]);
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Email sudah digunakan oleh akun lain.' }, { status: 409 });
      }

      let query = `UPDATE "User" SET name = $1, email = $2, "updatedAt" = NOW()`;
      const params: any[] = [name?.trim() || null, email.trim().toLowerCase()];

      if (password && password.trim().length >= 6) {
        const hashedPassword = await bcrypt.hash(password.trim(), 10);
        query += `, password = $3 WHERE id = $4 RETURNING id, name, email, role`;
        params.push(hashedPassword, userId);
      } else {
        query += ` WHERE id = $3 RETURNING id, name, email, role`;
        params.push(userId);
      }

      const updateResult = await pool.query(query, params);
      if (updateResult.rowCount === 0) {
        return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Data pengguna berhasil diperbarui.',
        user: updateResult.rows[0]
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user by admin:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data pengguna.' }, { status: 500 });
  }
}

// DELETE: Hapus pengguna beserta seluruh data terkait
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    // Lindungi akun Super Admin utama
    const checkUser = await pool.query('SELECT email FROM "User" WHERE id = $1', [userId]);
    if (checkUser.rows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    if (checkUser.rows[0]?.email?.toLowerCase() === 'radiaakbarradia@gmail.com') {
      return NextResponse.json({ error: 'Akun Super Administrator utama tidak dapat dihapus.' }, { status: 403 });
    }

    // Bersihkan data terkait terlebih dahulu secara terurut
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM "AiInfluencerCache" WHERE "userId" = $1', [userId]);
      await client.query('DELETE FROM "AiInsightCache" WHERE "userId" = $1', [userId]);
      await client.query('DELETE FROM "ExportHistory" WHERE "userId" = $1', [userId]);
      await client.query('DELETE FROM "Notification" WHERE "userId" = $1', [userId]);
      await client.query('DELETE FROM "ChatMessage" WHERE "userId" = $1', [userId]);
      await client.query('DELETE FROM "ChatSession" WHERE "userId" = $1', [userId]);
      await client.query('DELETE FROM "Transaction" WHERE "userId" = $1', [userId]);
      await client.query('DELETE FROM "BusinessProfile" WHERE "userId" = $1', [userId]);
      await client.query('DELETE FROM "User" WHERE id = $1', [userId]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({ message: 'Pengguna dan seluruh data terkait berhasil dihapus.' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user by admin:', error);
    return NextResponse.json({ error: 'Gagal menghapus pengguna.' }, { status: 500 });
  }
}
