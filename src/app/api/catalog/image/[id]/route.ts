import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse('ID tidak ditemukan', { status: 400 });
    }

    const res = await pool.query(
      `SELECT "imageUrl", "mimeType" FROM "CatalogProduct" WHERE "id" = $1 LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) {
      return new NextResponse('Gambar tidak ditemukan', { status: 404 });
    }

    const item = res.rows[0];
    const dataUrl: string = item.imageUrl;

    // If it's a data URL, decode and serve as binary with cache headers
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      const match = parts[0].match(/:(.*?);/);
      const mime = match ? match[1] : item.mimeType || 'image/webp';
      const buffer = Buffer.from(parts[1], 'base64');

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mime,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // If it's an external URL, redirect
    return NextResponse.redirect(dataUrl);
  } catch (error: unknown) {
    console.error('[Catalog Image Serve] Error:', error);
    return new NextResponse('Gagal memuat gambar', { status: 500 });
  }
}
