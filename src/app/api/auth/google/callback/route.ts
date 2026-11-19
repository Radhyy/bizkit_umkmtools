import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

function getBaseUrl(req: Request) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const baseUrl = getBaseUrl(req);
  const { searchParams } = new URL(req.url);

  const errorParam = searchParams.get('error');
  if (errorParam) {
    console.warn('Google OAuth error callback:', errorParam);
    return NextResponse.redirect(`${baseUrl}/login?error=GoogleAuthDibatalkan`);
  }

  const code = searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=GoogleKodeTidakValid`);
  }

  let redirectAfter = '/dashboard';
  try {
    const stateParam = searchParams.get('state');
    if (stateParam) {
      const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8'));
      if (decoded.redirectAfter) {
        redirectAfter = decoded.redirectAfter;
      }
    }
  } catch (e) {
    // Abaikan error decoding state
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/login?error=GoogleConfigError`);
    }

    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    // 1. Tukar authorization code dengan access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Error fetching Google token:', tokenData);
      return NextResponse.redirect(`${baseUrl}/login?error=GagalOtentikasiGoogle`);
    }

    // 2. Ambil data profil dari Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await profileResponse.json();
    if (!profileResponse.ok || !googleUser.email) {
      console.error('Error fetching Google profile:', googleUser);
      return NextResponse.redirect(`${baseUrl}/login?error=GagalMengambilDataGoogle`);
    }

    const email = googleUser.email.toLowerCase().trim();
    const name = googleUser.name || 'Pengguna Bizkit';
    const avatarUrl = googleUser.picture || null;

    // 3. Cek apakah user sudah terdaftar di database
    const userQuery = await pool.query(
      `SELECT u.*, bp."namaUsaha"
       FROM "User" u
       LEFT JOIN "BusinessProfile" bp ON bp."userId" = u.id
       WHERE LOWER(u.email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    let user = userQuery.rows[0];
    let isNewUser = false;

    if (!user) {
      // User baru: Daftarkan otomatis dan berikan masa trial 7 hari
      isNewUser = true;
      const newUserId = uuidv4();
      const randomPassword = await bcrypt.hash(uuidv4(), 10);
      const trialDays = 7;
      const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
      const initialRole = (email === 'radiaakbarradia@gmail.com') ? 'admin' : 'trial';

      await pool.query(
        `INSERT INTO "User" (
          id, email, name, password, "isVerified", role, "avatarUrl", "trialEndsAt", "trialGrantedDays", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, true, $5, $6, $7, $8, NOW(), NOW())`,
        [
          newUserId,
          email,
          name,
          randomPassword,
          initialRole,
          avatarUrl,
          trialEndsAt,
          trialDays,
        ]
      );

      // Inisialisasi profil usaha awal
      try {
        await pool.query(
          `INSERT INTO "BusinessProfile" (id, "userId", "namaUsaha", "updatedAt")
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT DO NOTHING`,
          [uuidv4(), newUserId, `Usaha ${name}`]
        );
      } catch (bpErr) {
        console.error('Error initializing BusinessProfile for Google user:', bpErr);
      }

      // Ambil kembali data user yang baru dibuat
      const newUserQuery = await pool.query(
        `SELECT u.*, bp."namaUsaha"
         FROM "User" u
         LEFT JOIN "BusinessProfile" bp ON bp."userId" = u.id
         WHERE u.id = $1
         LIMIT 1`,
        [newUserId]
      );
      user = newUserQuery.rows[0];
    } else {
      // User sudah ada: Pastikan status terverifikasi dan update foto profil jika ada
      await pool.query(
        `UPDATE "User"
         SET "isVerified" = true,
             "avatarUrl" = COALESCE("avatarUrl", $1),
             "updatedAt" = NOW()
         WHERE id = $2`,
        [avatarUrl, user.id]
      );
    }

    // 4. Hitung role dan masa trial
    let userRole = (user.email?.toLowerCase() === 'radiaakbarradia@gmail.com') ? 'admin' : (user.role || 'free');
    let isTrialActive = false;
    let daysLeft = 0;

    if (user.trialEndsAt) {
      const now = new Date();
      const trialEnds = new Date(user.trialEndsAt);
      const diffMs = trialEnds.getTime() - now.getTime();
      daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffMs > 0 && !user.isLocked) {
        isTrialActive = true;
        if (userRole !== 'admin' && userRole !== 'premium') {
          userRole = 'trial';
        }
      }
    }

    if (user.isLocked) {
      return NextResponse.redirect(`${baseUrl}/login?error=AkunDinonaktifkan`);
    }

    const sessionUser = {
      id: user.id,
      name: user.name || name,
      email: user.email,
      role: userRole,
      avatarUrl: user.avatarUrl || avatarUrl,
      daysLeft: daysLeft,
      trialEndsAt: user.trialEndsAt || null,
      namaUsaha: user.namaUsaha || null,
    };

    const finalRedirect = userRole === 'admin' 
      ? '/admin' 
      : (userRole === 'premium' || userRole === 'trial' ? '/dashboard' : '/');

    // 5. Render halaman transisi HTML untuk menyimpan session ke localStorage
    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Login Google Berhasil - Bizkit</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #F8F9FA;
            color: #18181B;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .card {
            background: white;
            border-radius: 28px;
            padding: 36px 32px;
            text-align: center;
            max-width: 380px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.06);
            border: 1px solid #E4E4E7;
          }
          .spinner {
            width: 36px;
            height: 36px;
            border: 3.5px solid #F4F4F5;
            border-top-color: #2563EB;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 18px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          h2 {
            font-size: 19px;
            font-weight: 700;
            margin: 0 0 8px;
            color: #0F172A;
          }
          p {
            font-size: 13px;
            color: #64748B;
            margin: 0;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h2>Login Berhasil!</h2>
          <p>Menghubungkan akun Google Anda dan membuka dashboard Bizkit...</p>
        </div>
        <script>
          try {
            const userData = ${JSON.stringify(sessionUser)};
            localStorage.setItem('user', JSON.stringify(userData));
            setTimeout(() => {
              window.location.replace(${JSON.stringify(finalRedirect)});
            }, 300);
          } catch (err) {
            console.error('Failed to set session:', err);
            window.location.replace('/login');
          }
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error: any) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.redirect(`${baseUrl}/login?error=TerjadiKesalahanServer`);
  }
}
