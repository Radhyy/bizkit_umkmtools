import { NextResponse } from 'next/server';
import { uploadToS3, deleteFromS3 } from '@/lib/s3';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const folder = (formData.get('folder') as string) || 'logos';
    const uploadType = (formData.get('type') as string) || (folder === 'avatars' ? 'avatar' : 'logo');

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada berkas yang diunggah.' }, { status: 400 });
    }

    // Validasi tipe berkas
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format berkas tidak didukung. Harap unggah gambar JPG, PNG, WEBP, atau SVG.' },
        { status: 400 }
      );
    }

    // Validasi ukuran berkas (Maksimal 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran berkas melebihi batas maksimal 5MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Unggah ke KilatStorage S3
    const uploadResult = await uploadToS3(buffer, file.name, file.type, folder);

    // Jika userId / email disertakan, simpan ke database sesuai tipe upload
    if (userId) {
      try {
        if (uploadType === 'avatar') {
          await pool.query(
            `UPDATE "User" 
             SET "avatarUrl" = $1, "updatedAt" = NOW() 
             WHERE id = $2 OR email = $2`,
            [uploadResult.url, userId]
          );
        } else {
          await pool.query(
            `UPDATE "BusinessProfile" 
             SET "logoUrl" = $1, "updatedAt" = NOW() 
             WHERE "userId" = $2`,
            [uploadResult.url, userId]
          );
        }
      } catch (dbErr) {
        console.error('Failed to update database with S3 URL:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
      message: 'Foto berhasil disimpan ke KilatStorage S3.',
    });
  } catch (error: any) {
    console.error('Error in /api/upload:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan saat mengunggah berkas ke S3.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get('url');
    const userId = searchParams.get('userId');

    if (!fileUrl) {
      return NextResponse.json({ error: 'URL berkas wajib disertakan.' }, { status: 400 });
    }

    await deleteFromS3(fileUrl);

    if (userId) {
      await pool.query(
        `UPDATE "BusinessProfile" SET "logoUrl" = NULL, "updatedAt" = NOW() WHERE "userId" = $1`,
        [userId]
      );
    }

    return NextResponse.json({ success: true, message: 'Berkas berhasil dihapus dari S3.' });
  } catch (error: any) {
    console.error('Error deleting from S3:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus berkas dari S3.' },
      { status: 500 }
    );
  }
}
