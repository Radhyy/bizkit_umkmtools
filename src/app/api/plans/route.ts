import { NextResponse } from 'next/server';
import { getPlanConfigs, getPlanCacheMetrics } from '@/lib/planCache';

// Cache responses with s-maxage or hit ultra-fast in-memory cache
export async function GET() {
  try {
    const plans = await getPlanConfigs();
    const cacheMetrics = getPlanCacheMetrics();

    return NextResponse.json(
      {
        success: true,
        plans,
        cacheMetrics,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    console.error('Error fetching plans:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat konfigurasi paket.' },
      { status: 500 }
    );
  }
}
