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
      query = `SELECT u.id, u.name, u.email, u.role, u."isVerified", u."isLocked", u."trialEndsAt", u."trialGrantedDays", u."createdAt", u."waToken", u."waPhoneNumber", u."isWaConnected", bp."namaUsaha" 
               FROM "User" u 
               LEFT JOIN "BusinessProfile" bp ON bp."userId" = u.id 
               WHERE u.id = $1 LIMIT 1`;
      params = [userId];
    } else {
      query = `SELECT u.id, u.name, u.email, u.role, u."isVerified", u."isLocked", u."trialEndsAt", u."trialGrantedDays", u."createdAt", u."waToken", u."waPhoneNumber", u."isWaConnected", bp."namaUsaha" 
               FROM "User" u 
               LEFT JOIN "BusinessProfile" bp ON bp."userId" = u.id 
               WHERE LOWER(u.email) = LOWER($1) LIMIT 1`;
      params = [email];
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return NextResponse.json({ authorized: false, reason: 'user_not_found', message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const user = result.rows[0];
    const userRole = (user.email?.toLowerCase() === 'radiaakbarradia@gmail.com') ? 'admin' : (user.role || 'free');

    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
      namaUsaha: user.namaUsaha || null,
      waToken: user.waToken,
      waPhoneNumber: user.waPhoneNumber,
      isWaConnected: !!user.isWaConnected,
    };

    // 1. Cek apakah akun dikunci manual oleh Super Admin
    if (user.isLocked) {
      return NextResponse.json({
        authorized: false,
        reason: 'locked',
        role: userRole,
        message: 'Akses dashboard Anda telah dinonaktifkan sementara oleh Administrator.',
        user: userPayload,
        waToken: user.waToken,
        isWaConnected: !!user.isWaConnected,
      });
    }

    // 2. Admin selalu memiliki akses penuh
    if (userRole === 'admin') {
      return NextResponse.json({
        authorized: true,
        role: 'admin',
        namaUsaha: user.namaUsaha || null,
        user: userPayload,
        waToken: user.waToken,
        isWaConnected: !!user.isWaConnected,
      });
    }

    // 3. Premium selalu memiliki akses penuh
    if (userRole === 'premium') {
      return NextResponse.json({
        authorized: true,
        role: 'premium',
        namaUsaha: user.namaUsaha || null,
        user: userPayload,
        waToken: user.waToken,
        isWaConnected: !!user.isWaConnected,
      });
    }

    // 4. Role Trial: periksa sisa masa trial aktif
    if (userRole === 'trial' && user.trialEndsAt) {
      const now = new Date();
      const trialEnds = new Date(user.trialEndsAt);
      const diffMs = trialEnds.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffMs > 0) {
        return NextResponse.json({
          authorized: true,
          role: 'trial',
          namaUsaha: user.namaUsaha || null,
          daysLeft: Math.max(1, daysLeft),
          trialEndsAt: user.trialEndsAt,
          user: { ...userPayload, daysLeft, trialEndsAt: user.trialEndsAt },
          waToken: user.waToken,
          isWaConnected: !!user.isWaConnected,
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
          user: { ...userPayload, isExpired: true },
          waToken: user.waToken,
          isWaConnected: !!user.isWaConnected,
        });
      }
    }

    // 5. Akun Free tanpa masa trial
    return NextResponse.json({
      authorized: false,
      reason: 'free_plan',
      role: 'free',
      message: 'Akun Anda saat ini menggunakan Free Plan. Dashboard UMKM hanya dapat diakses melalui masa trial atau langganan paket.',
      user: userPayload,
      waToken: user.waToken,
      isWaConnected: !!user.isWaConnected,
    });

  } catch (error) {
    console.error('Error in check-status route:', error);
    return NextResponse.json({ error: 'Gagal memverifikasi status akun.' }, { status: 500 });
  }
}

