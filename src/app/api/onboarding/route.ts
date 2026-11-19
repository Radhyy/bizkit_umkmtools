import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT * FROM "BusinessProfile" WHERE "userId" = $1 LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    return NextResponse.json({ profile: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json({ error: 'Gagal mengambil profil bisnis.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      userId, 
      namaUsaha, 
      kategoriBisnis, 
      deskripsiBisnis, 
      targetAudiens, 
      platformFokus, 
      gayaPromosi, 
      budgetPromosi, 
      kotaLokasi,
      logoUrl 
    } = body;

    if (!userId || !namaUsaha || !kategoriBisnis || !targetAudiens || !platformFokus || !gayaPromosi) {
      return NextResponse.json({ error: 'Data survei bisnis wajib dilengkapi.' }, { status: 400 });
    }

    // Cek apakah user valid
    const userCheck = await pool.query('SELECT id, name, email FROM "User" WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Upsert BusinessProfile
    const existing = await pool.query('SELECT id FROM "BusinessProfile" WHERE "userId" = $1', [userId]);

    let savedProfile;
    if (existing.rows.length > 0) {
      const updateRes = await pool.query(
        `UPDATE "BusinessProfile" 
         SET "namaUsaha" = $1, 
             "kategoriBisnis" = $2, 
             "deskripsiBisnis" = $3, 
             "targetAudiens" = $4, 
             "platformFokus" = $5, 
             "gayaPromosi" = $6, 
             "budgetPromosi" = $7, 
             "kotaLokasi" = $8, 
             "logoUrl" = COALESCE($9, "logoUrl"),
             "updatedAt" = NOW()
         WHERE "userId" = $10
         RETURNING *`,
        [
          namaUsaha.trim(),
          kategoriBisnis,
          deskripsiBisnis ? deskripsiBisnis.trim() : null,
          targetAudiens,
          platformFokus,
          gayaPromosi,
          budgetPromosi || null,
          kotaLokasi ? kotaLokasi.trim() : null,
          logoUrl !== undefined ? logoUrl : null,
          userId
        ]
      );
      savedProfile = updateRes.rows[0];
    } else {
      const id = uuidv4();
      const insertRes = await pool.query(
        `INSERT INTO "BusinessProfile" 
         ("id", "userId", "namaUsaha", "kategoriBisnis", "deskripsiBisnis", "targetAudiens", "platformFokus", "gayaPromosi", "budgetPromosi", "kotaLokasi", "logoUrl", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         RETURNING *`,
        [
          id,
          userId,
          namaUsaha.trim(),
          kategoriBisnis,
          deskripsiBisnis ? deskripsiBisnis.trim() : null,
          targetAudiens,
          platformFokus,
          gayaPromosi,
          budgetPromosi || null,
          kotaLokasi ? kotaLokasi.trim() : null,
          logoUrl || null
        ]
      );
      savedProfile = insertRes.rows[0];
    }

    return NextResponse.json({
      message: 'Profil bisnis UMKM berhasil disimpan.',
      profile: savedProfile
    }, { status: 200 });

  } catch (error) {
    console.error('Error saving business profile:', error);
    return NextResponse.json({ error: 'Gagal menyimpan profil bisnis.' }, { status: 500 });
  }
}

