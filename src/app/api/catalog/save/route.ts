import { NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      imageBase64: string;
      shopName?: string;
      folder?: string;
    };

    const { imageBase64, shopName = 'katalog', folder = 'catalog-posters' } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Data gambar tidak ditemukan.' },
        { status: 400 }
      );
    }

    // Ekstrak base64 buffer & mime type
    let buffer: Buffer;
    let mimeType = 'image/jpeg';
    let ext = 'jpg';

    if (imageBase64.startsWith('data:')) {
      const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json(
          { error: 'Format base64 gambar tidak valid.' },
          { status: 400 }
        );
      }
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
    } else {
      buffer = Buffer.from(imageBase64, 'base64');
    }

    const cleanName = (shopName || 'katalog')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);

    const filename = `${cleanName}-${Date.now()}.${ext}`;

    // Upload langsung ke KilatStorage S3
    const uploadResult = await uploadToS3(buffer, filename, mimeType, folder);

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
      message: 'Poster katalog berhasil disimpan ke cloud S3 storage.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengunggah ke S3.';
    console.error('[Save Catalog S3] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
