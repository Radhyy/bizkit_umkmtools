import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json({ error: 'Parameter userId atau email wajib disertakan.' }, { status: 400 });
    }

    let query = '';
    let params: any[] = [];
    if (userId) {
      query = `SELECT id, name, email, role, "isVerified", "isLocked", "trialEndsAt", "trialGrantedDays", "createdAt" FROM "User" WHERE id = $1 LIMIT 1`;
      params = [userId];
    } else {
      query = `SELECT id, name, email, role, "isVerified", "isLocked", "trialEndsAt", "trialGrantedDays", "createdAt" FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1`;
      params = [email];
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return NextResponse.json({ authorized: false, reason: 'user_not_found', message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const user = result.rows[0];
    const userRole = (user.email?.toLowerCase() === 'radiaakbarradia@gmail.com') ? 'admin' : (user.role || 'free');

    // 1. Cek apakah akun dikunci manual oleh Super Admin
    if (user.isLocked) {
      return NextResponse.json({
        authorized: false,
        reason: 'locked',
        role: userRole,
        message: 'Akses dashboard Anda telah dinonaktifkan sementara oleh Administrator.',
        user: { id: user.id, email: user.email, name: user.name, role: userRole }
      });
    }

    // 2. Admin selalu memiliki akses penuh
    if (userRole === 'admin') {
      return NextResponse.json({
        authorized: true,
        role: 'admin',
        user: { id: user.id, email: user.email, name: user.name, role: 'admin' }
      });
    }

    // 3. Premium selalu memiliki akses penuh
    if (userRole === 'premium') {
      return NextResponse.json({
        authorized: true,
        role: 'premium',
        user: { id: user.id, email: user.email, name: user.name, role: 'premium' }
      });
    }

    // 4. Role Trial atau memiliki masa trial aktif
    if (user.trialEndsAt) {
      const now = new Date();
      const trialEnds = new Date(user.trialEndsAt);
      const diffMs = trialEnds.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffMs > 0) {
        return NextResponse.json({
          authorized: true,
          role: 'trial',
          daysLeft: Math.max(1, daysLeft),
          trialEndsAt: user.trialEndsAt,
          user: { id: user.id, email: user.email, name: user.name, role: 'trial', daysLeft, trialEndsAt: user.trialEndsAt }
        });
      } else {
        // Trial telah kedaluwarsa
        return NextResponse.json({
          authorized: false,
          reason: 'trial_expired',
          role: 'trial',
          daysLeft: 0,
          trialEndsAt: user.trialEndsAt,
          message: 'Masa trial gratis Anda telah berakhir. Hubungi Super Admin atau upgrade ke paket Premium untuk melanjutkan akses.',
          user: { id: user.id, email: user.email, name: user.name, role: 'trial', isExpired: true }
        });
      }
    }

    // 5. Akun Free tanpa masa trial
    return NextResponse.json({
      authorized: false,
      reason: 'free_plan',
      role: 'free',
      message: 'Akun Anda saat ini menggunakan Free Plan. Dashboard UMKM hanya dapat diakses melalui masa trial atau langganan paket.',
      user: { id: user.id, email: user.email, name: user.name, role: 'free' }
    });

  } catch (error) {
    console.error('Error in check-status route:', error);
    return NextResponse.json({ error: 'Gagal memverifikasi status akun.' }, { status: 500 });
  }
}

