import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getBaseUrl(req: Request) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'GOOGLE_CLIENT_ID belum dikonfigurasi di server (.env).' },
        { status: 500 }
      );
    }

    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const { searchParams } = new URL(req.url);
    const redirectAfter = searchParams.get('redirect') || '/dashboard';

    // Simpan state untuk redirect pasca login
    const state = Buffer.from(JSON.stringify({ redirectAfter })).toString('base64url');

    const googleAuthUrl =
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
        state,
      }).toString();

    return NextResponse.redirect(googleAuthUrl);
  } catch (error: any) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { error: 'Gagal mengarahkan ke layanan Google.' },
      { status: 500 }
    );
  }
}
