import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

const ALLOWED_TYPES = [
  'image/webp',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/avif',
];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB per file
const MAX_FILES = 8;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const userId = (formData.get('userId') as string) || null;
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada file yang diunggah.' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_FILES} foto produk per sesi.` },
        { status: 400 }
      );
    }

    const results: Array<{
      id: string;
      url: string;
      name: string;
      title: string;
      description: string;
    }> = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Format ${file.name} tidak didukung. Harap gunakan format gambar (WebP, JPG, PNG).`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Ukuran ${file.name} melebihi batas maksimal 8MB.` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || 'image/webp';
      const base64Data = buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Data}`;

      const id = 'prod_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const publicUrl = `/api/catalog/image/${id}`;

      // Simpan langsung ke database PostgreSQL tabel CatalogProduct
      await pool.query(
        `INSERT INTO "CatalogProduct" 
         ("id", "userId", "title", "description", "imageUrl", "mimeType", "fileSize", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [id, userId, title, description, dataUri, mimeType, file.size]
      );

      results.push({
        id,
        url: publicUrl,
        name: file.name,
        title,
        description,
      });
    }

    return NextResponse.json({
      success: true,
      files: results,
      message: 'Foto produk berhasil disimpan ke database.',
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : 'Terjadi kesalahan saat mengunggah foto ke database.';
    console.error('[Upload Catalog DB] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      id: string;
      title?: string;
      description?: string;
    };

    if (!body?.id) {
      return NextResponse.json(
        { error: 'ID produk wajib disertakan.' },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE "CatalogProduct" 
       SET "title" = COALESCE($2, "title"), 
           "description" = COALESCE($3, "description"), 
           "updatedAt" = NOW() 
       WHERE "id" = $1`,
      [body.id, body.title ?? null, body.description ?? null]
    );

    return NextResponse.json({ success: true, message: 'Detail produk diperbarui.' });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Gagal memperbarui produk.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID produk wajib disertakan.' }, { status: 400 });
    }

    await pool.query(`DELETE FROM "CatalogProduct" WHERE "id" = $1`, [id]);
    return NextResponse.json({ success: true, message: 'Produk berhasil dihapus.' });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Gagal menghapus produk.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
