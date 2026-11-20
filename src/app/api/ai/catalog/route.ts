import { NextResponse } from 'next/server';
import { groqChatCompletion } from '@/lib/groqClient';

export const runtime = 'nodejs';

export const buildImageEnhancementPrompt = (
  productTitle: string,
  specificEnhanceNote: string,
  designStyle?: string
) => `
Professional commercial studio product photography enhancement of ${productTitle}. 
Keep the exact product shape, packaging, ingredients, and core structure from the original uploaded image, do not hallucinate or replace the main item. 
Upgrade the lighting to soft, diffused natural daylight with subtle warm highlights and clean soft shadows. 
Remove any distracting background clutter, harsh glare, low-res noise, or accidental text watermarks. 
Place the product in a clean, minimalist, aesthetic commercial setting matching the style: "${designStyle || 'Modern Clean Showcase, warm minimalist editorial'}". 
Specific art direction: ${specificEnhanceNote}. 
Shot on 85mm lens, f/2.8, crisp focus on product texture, color-graded for a cohesive high-end print catalog, 8k resolution, photorealistic.
`.trim();

export interface CatalogTheme {
  headerBg: string;
  headerText: string;
  accentColor: string;
  cardBg: string;
  canvasBg: string;
}

interface ProductItem {
  id?: string;
  imageUrl: string;
  title: string;
  description: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      products: ProductItem[];
      shopName: string;
      tagline?: string;
      prompt?: string;
    };

    const { products, shopName, tagline = '', prompt = '' } = body;

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada foto produk yang disertakan.' },
        { status: 400 }
      );
    }

    if (!shopName?.trim()) {
      return NextResponse.json(
        { error: 'Nama toko atau brand usaha wajib diisi.' },
        { status: 400 }
      );
    }

    const count = products.length;

    // Default layout rule based on count
    const defaultLayout =
      count === 1
        ? 'single'
        : count === 2
        ? '2col'
        : count === 3
        ? '3col'
        : count <= 6
        ? 'featured+grid'
        : 'hero+2col';

    const productList = products
      .map(
        (p, i) =>
          `Produk #${i + 1}:\n- Judul: ${p.title || 'Produk ' + (i + 1)}\n- Deskripsi Asli: ${p.description || 'Produk pilihan berkualitas'}`
      )
      .join('\n\n');

    // Dedicated prompt for "Modern Clean Showcase" catalog style
    const systemPrompt = `Kamu adalah Senior Brand Designer & Creative Art Director spesialis desain katalog cetak, menu editorial, dan materi promosi visual kelas atas untuk brand UMKM.

    Tugasmu adalah mengubah data mentah produk menjadi konsep katalog "Modern Clean Showcase" yang kohesif, estetik, proporsional, dan jauh dari kesan template kaku.

    Prinsip Utama Desain & Copywriting:
    1. ANTI-SLOP COPYWRITING: Jangan pernah menyalin mentah input user yang terlalu singkat atau kasual (misal: "enak banget", "creamy bangett"). Ubah menjadi bahasa editorial yang menggugah selera, elegan, dan profesional.
    2. KEPADATAN TEKS PROPORSIONAL: Pastikan setiap deskripsi produk (highlight) memiliki panjang yang seragam antar-kartu (sekitar 14-20 kata / 2-3 baris teks) agar tidak ada ruang kosong yang jomplang di dalam kartu katalog.
    3. HARMONI WARNA (COLOR DIRECTION): Tentukan skema warna hex yang harmonis dan relevan dengan kategori produk (misal: nuansa warm cream, espresso, & sage untuk kafe; atau terracotta & sand untuk kuliner), bukan hitam/biru default yang kaku.
    4. ARAHAN VISUAL FOTO: Buat prompt spesifik untuk memoles foto produk mentah agar memiliki pencahayaan studio yang bersih, tajam, dan seragam tanpa mengubah bentuk asli produk.

    Kembalikan respon HANYA dalam bentuk JSON valid murni tanpa markdown, tanpa blok kode \`\`\`json, dan tanpa teks pengantar.`;

    const userPrompt = `Konteks Brand:
    - Nama Toko / Brand: ${shopName}
    - Tagline Awal: ${tagline || 'Tidak ada'}
    - Preferensi / Instruksi Desain Penjual: ${prompt || 'Modern Clean Showcase, bersih, hangat, dan elegan'}
    - Total Produk: ${count}
        
    Data Produk Mentah:
    ${productList}
        
    Instruksi Pengerjaan:
    1. Pilih layout paling proporsional untuk ${count} produk dari opsi: ["single", "2col", "3col", "featured+grid", "hero+2col"].
    2. Tentukan palet warna katalog (theme) dalam format HEX yang sangat estetik dan sesuai dengan karakter produk.
    3. Poles headerSubtitle agar terasa seperti tajuk majalah/katalog profesional (maksimal 10 kata, hindari tanda seru berlebihan).
    4. Untuk setiap produk (indeks 0 hingga ${count - 1}):
       - title: Nama produk yang rapi, kapitalisasi tepat, dan terdengar premium (maksimal 5 kata).
       - highlight: Deskripsi penggugah selera yang menjelaskan rasa, tekstur, atau bahan utama. Wajib 14–20 kata agar tata letak kartu penuh secara proporsional.
       - badge: Label singkat 1-2 kata yang relevan (contoh: "Signature", "Best Seller", "Barista Pick", "Favorit", "Freshly Made") atau string kosong "" jika tidak semua kartu butuh badge agar tidak monoton.
       - imageEnhancePrompt: Prompt bahasa Inggris singkat untuk model Image-to-Image agar foto produk ini dipoles pencahayaannya, dibersihkan noise/watermark-nya, dan diselaraskan tone-nya dengan produk lain tanpa mengubah bentuk produk aslinya.
        
    Format JSON Wajib:
    {
      "layout": "${defaultLayout}",
      "theme": {
        "headerBg": "#1C1917",
        "headerText": "#FAF8F5",
        "accentColor": "#B45309",
        "cardBg": "#FFFFFF",
        "canvasBg": "#F5F2EB"
      },
      "headerSubtitle": "...",
      "products": [
        {
          "index": 0,
          "title": "...",
          "highlight": "...",
          "badge": "...",
          "imageEnhancePrompt": "..."
        }
      ]
    }`;

    const defaultTheme: CatalogTheme = {
      headerBg: '#1C1917',
      headerText: '#FAF8F5',
      accentColor: '#B45309',
      cardBg: '#FFFFFF',
      canvasBg: '#F5F2EB',
    };

    let layoutData: {
      layout: string;
      headerSubtitle: string;
      theme: CatalogTheme;
      products: Array<{
        index: number;
        title: string;
        highlight: string;
        badge: string;
        imageEnhancePrompt: string;
      }>;
    } = {
      layout: defaultLayout,
      headerSubtitle: tagline || 'Katalog Pilihan Terbaik',
      theme: defaultTheme,
      products: products.map((p, i) => {
        const title = p.title || `Produk Pilihan ${i + 1}`;
        return {
          index: i,
          title,
          highlight: p.description || 'Kualitas premium dengan cita rasa dan pengerjaan terbaik.',
          badge: i === 0 ? 'Best Seller' : i === 1 ? 'Favorit' : '',
          imageEnhancePrompt: buildImageEnhancementPrompt(
            title,
            'Clean commercial studio lighting with soft diffused shadows and crisp product focus',
            prompt
          ),
        };
      }),
    };

    try {
      const aiRes = await groqChatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.6,
          max_tokens: 1200,
        }
      );

      let raw = aiRes.text.trim();
      if (raw.startsWith('```')) {
        raw = raw
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim();
      }

      const parsed = JSON.parse(raw) as {
        layout?: string;
        theme?: {
          headerBg?: string;
          headerText?: string;
          accentColor?: string;
          cardBg?: string;
          canvasBg?: string;
        };
        headerSubtitle?: string;
        products?: Array<{
          index?: number;
          title?: string;
          tagline?: string;
          highlight?: string;
          badge?: string;
          imageEnhancePrompt?: string;
        }>;
      };

      if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
        const activeTheme: CatalogTheme = {
          headerBg: parsed.theme?.headerBg || defaultTheme.headerBg,
          headerText: parsed.theme?.headerText || defaultTheme.headerText,
          accentColor: parsed.theme?.accentColor || defaultTheme.accentColor,
          cardBg: parsed.theme?.cardBg || defaultTheme.cardBg,
          canvasBg: parsed.theme?.canvasBg || defaultTheme.canvasBg,
        };

        layoutData = {
          layout: parsed.layout || defaultLayout,
          headerSubtitle: parsed.headerSubtitle || tagline || 'Katalog Pilihan Terbaik',
          theme: activeTheme,
          products: products.map((p, i) => {
            const matched = parsed.products?.find((item) => item.index === i) || parsed.products?.[i];
            const title = matched?.title?.trim() || matched?.tagline?.trim() || p.title || `Produk ${i + 1}`;
            const specificEnhance = matched?.imageEnhancePrompt?.trim() || 'Soft natural studio illumination, crisp textures, premium pedestal';
            return {
              index: i,
              title,
              highlight: matched?.highlight?.trim() || p.description || 'Pilihan berkualitas tinggi dengan rasa dan kualitas unggulan.',
              badge: matched?.badge?.trim() || (i === 0 ? 'Best Seller' : ''),
              imageEnhancePrompt: buildImageEnhancementPrompt(title, specificEnhance, prompt),
            };
          }),
        };
      }
    } catch (aiErr) {
      console.warn('[Catalog AI] Fallback digunakan karena AI response error:', aiErr);
    }

    return NextResponse.json({
      success: true,
      catalogData: {
        shopName,
        tagline: layoutData.headerSubtitle || tagline,
        layout: layoutData.layout,
        headerSubtitle: layoutData.headerSubtitle,
        theme: layoutData.theme,
        products: products.map((p, i) => {
          const item = layoutData.products[i];
          const title = item?.title || p.title || `Produk ${i + 1}`;
          return {
            ...p,
            title,
            tagline: title,
            highlight: item?.highlight || p.description || 'Kualitas premium dengan pengerjaan terbaik.',
            badge: item?.badge || (i === 0 ? 'Best Seller' : ''),
            imageEnhancePrompt: item?.imageEnhancePrompt || '',
          };
        }),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memproses katalog AI.';
    console.error('[Catalog Generate] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
