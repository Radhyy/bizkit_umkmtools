import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateCatalogImage } from '@/lib/imageGenClient';

export const runtime = 'nodejs';

export const buildImageEnhancementPrompt = (
  productTitle: string,
  specificEnhanceNote: string,
  designStyle?: string
) => `
Commercial editorial food and beverage photography of "${productTitle}".
FRAMING & COMPOSITION: Medium-wide hero shot, show the ENTIRE glass, cup, or packaging completely from top to bottom with generous breathing room around the edges. Do not crop the top or bottom of the product.
BACKGROUND REPLACEMENT: Completely replace any plain white cutout background or messy surroundings with a cohesive, warm artisanal cafe tabletop setting (textured travertine stone or warm oak wood table, soft warm cream wall in the far background with natural window shadow).
LIGHTING & STYLE: Warm golden morning sunlight streaming from the side, realistic soft shadows, natural condensation and rich textures. Style: "${designStyle || 'Warm Minimalist Editorial Catalog'}".
Specific art direction: ${specificEnhanceNote}.
Preserve the exact shape, layers, and colors of the original product. Shot on 50mm lens, f/2.8, cohesive warm film color grading, 8k photorealistic, no text or watermarks.
`.trim();

export const buildFullCatalogPosterPrompt = (
  shopName: string,
  headerSubtitle: string,
  footerCta: string,
  products: Array<{
    title: string;
    description?: string;
    flavorNotes: string;
    highlight: string;
    badge?: string;
  }>,
  designStyle?: string,
  theme?: {
    headerBg?: string;
    accentColor?: string;
    canvasBg?: string;
    textPrimary?: string;
  },
  logoRefNumber?: number
) => {
  const count = products.length;

  // Dynamic composition rule so the image model never defaults to rigid equal boxes
  const compositionGuide =
    count === 1
      ? 'Single monumental hero product centered on a sculpted pedestal or artisan tabletop, surrounded by generous editorial typography and subtle botanical/ingredient accents.'
      : count === 2
      ? 'Split diagonal or side-by-side editorial showcase: two equally prominent hero products staged on a continuous shared surface with alternating text alignment.'
      : count === 3
      ? 'Asymmetric magazine spread: Product 1 is the large dominant Hero centerpiece in the upper half with angled natural sunlight; Products 2 and 3 sit harmoniously side-by-side in the lower half on a matching tabletop surface.'
      : 'Curated lookbook grid: Product 1 featured as a larger top-left or top-center anchor piece, paired with cleanly aligned smaller editorial vignettes below—NO repetitive identical white boxes.';

  const productBlocks = products
    .map((p, idx) => {
      const role = idx === 0 ? 'HERO CENTERPIECE (Largest visual focus)' : `SUPPORTING ITEM #${idx + 1}`;
      const descLine = p.description?.trim()
        ? `\n- Product Details & Highlights: "${p.description.trim()}"`
        : '';
      return `[Item ${idx + 1} - ${role}]
- Reference Image: Use exact product appearance, shape, container, texture, and colors from uploaded image #${idx + 1}.
- Product Title: "${p.title}"${descLine}
- Micro-Tag / Tasting Note: "${p.flavorNotes}"
- Key Editorial Feature: "${p.highlight}"${p.badge ? `\n- Minimalist Tag / Stamp: "${p.badge}"` : ''}`;
    })
    .join('\n\n');

  const logoDirective = logoRefNumber
    ? `- Brand Logo Integration: Uploaded image #${logoRefNumber} is the official Brand Logo. Prominently place and seamlessly integrate this exact logo emblem/icon at the top masthead directly above or beside "${shopName}". Preserve its precise vector/emblem shape, symbol, and authentic colors without distortion.`
    : `- Brand Title: Refined, high-contrast modern serif typography displaying "${shopName}".`;

  return `
Create a high-craft, print-ready vertical commercial catalog poster (3:4 aspect ratio) for the brand "${shopName}".

1. ART DIRECTION & ANTI-SLOP LAYOUT RULES:
- Aesthetic Direction & User Visual Guidelines: ${designStyle || 'Modern Clean Editorial Showcase, tactile boutique print menu, warm organic minimalism'}.
- Layout Architecture: ${compositionGuide}
- STRICTLY NO WEB-UI WIREFRAMES: Do NOT draw white rounded-rectangle app cards, heavy drop-shadow boxes, or generic e-commerce grid borders. Let the photography and typography breathe directly on the textured background canvas.
- Unified Photography & Lighting: Blend all uploaded reference products into a cohesive, real-world editorial tabletop environment (such as warm travertine stone, brushed oak wood, or textured linen) with consistent golden-hour side lighting, realistic contact shadows, and subtle depth-of-field. Keep every product 100% faithful to its uploaded reference image without distorting logos, labels, or shapes.

2. BRAND MASTHEAD & COLOR PALETTE HIERARCHY:
${logoDirective}
- Brand Title & Masthead: "${shopName}" set in refined, high-contrast modern serif typography (${theme?.textPrimary || '#1C1815'}), paired with a clean spaced-out sans-serif subtitle "${headerSubtitle}".
- Background Canvas: Tactile matte paper finish in ${theme?.canvasBg || '#F4EFE6'} with subtle organic grain and delicate thin editorial hairline dividers (${theme?.accentColor || '#A84A18'}).
- Product Typography: Crisp, uncluttered editorial hierarchy—bold title, small uppercase flavor micro-tag in ${theme?.accentColor || '#A84A18'}, and concise description lines. Never overlap text onto the main product body.

3. FEATURED PRODUCTS TO INTEGRATE:
${productBlocks}

4. FOOTER CALLOUT & CONTACT:
- Subtle, balanced bottom editorial strip featuring clean typography: "${footerCta}".

5. QUALITY & NEGATIVE CONSTRAINTS:
- Studio-grade graphic design, balanced negative space, crisp razor-sharp typography, authentic Indonesian boutique UMKM brand look.
- Avoid: gibberish/misspelled letters, extra hallucinated products, cropped/cut-off cups or packaging, plastic-looking CGI glare, generic stock-photo watermarks, or cluttered clip-art.
`.trim();
};

export interface CatalogTheme {
  headerBg: string;
  headerText: string;
  accentColor: string;
  cardBg: string;
  canvasBg: string;
  borderColor?: string;
  textPrimary?: string;
  textSecondary?: string;
}

interface ProductItem {
  id?: string;
  imageUrl: string;
  title: string;
  description: string;
  flavorNotes?: string;
  badge?: string;
}

async function resolveImageUrl(url: string, prodId?: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  // If it's a relative catalog image URL
  const match = url.match(/\/api\/catalog\/image\/([a-zA-Z0-9_-]+)/);
  const targetId = match ? match[1] : prodId;
  if (targetId) {
    try {
      const dbRes = await pool.query(
        `SELECT "imageUrl" FROM "CatalogProduct" WHERE "id" = $1 LIMIT 1`,
        [targetId]
      );
      if (dbRes.rows.length > 0 && dbRes.rows[0].imageUrl) {
        return dbRes.rows[0].imageUrl;
      }
    } catch (e) {
      console.warn('[Catalog AI] Gagal mencari image di DB:', e);
    }
  }
  return url;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      products: ProductItem[];
      shopName: string;
      tagline?: string;
      prompt?: string;
      brandLogoUrl?: string | null;
    };

    const { products, shopName, tagline = '', prompt = '', brandLogoUrl = null } = body;

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
        ? 'hero+2col'
        : count <= 6
        ? 'featured+grid'
        : 'hero+2col';

    const activeTheme: CatalogTheme = {
      headerBg: '#1C1815',
      headerText: '#F9F6F0',
      accentColor: '#A84A18',
      canvasBg: '#F3EDE2',
      cardBg: 'transparent',
      borderColor: '#D6CEC2',
      textPrimary: '#1C1815',
      textSecondary: '#574E46',
    };

    const headerSubtitle = tagline?.trim() || 'Katalog Pilihan Eksklusif';
    const footerCta = 'Tersedia untuk dine-in & delivery • Hubungi kami untuk pemesanan';

    // Map product data into formatted structure for image generation
    const posterProducts = products.map((p, idx) => {
      const title = p.title?.trim() || `Produk ${idx + 1}`;
      const description = p.description?.trim() || '';
      const highlight =
        description ||
        `Pilihan racikan berkualitas tinggi dengan cita rasa khas dan bahan baku premium.`;
      const flavorNotes =
        p.flavorNotes?.trim() ||
        (idx === 0
          ? 'SIGNATURE • ARTISANAL • EXCLUSIVE'
          : idx === 1
          ? 'BEST SELLER • RICH FLAVOR'
          : 'CURATED SELECTION • HANDCRAFTED');
      const badge =
        p.badge?.trim() ||
        (idx === 0 ? 'BEST SELLER' : idx === 1 ? 'HOUSE FAVORITE' : '');

      return {
        title,
        description,
        flavorNotes,
        highlight,
        badge,
      };
    });

    // 1. Resolve all uploaded product reference images in order (#1, #2, #3, ...)
    const resolvedProductImages = await Promise.all(
      products.map((p) => resolveImageUrl(p.imageUrl, p.id))
    );
    const validProductImages = resolvedProductImages.filter((img): img is string =>
      Boolean(img && img.trim().length > 0)
    );

    // 2. Resolve brand logo reference image if provided
    let validLogoImage: string | null = null;
    if (brandLogoUrl) {
      const resolvedLogo = await resolveImageUrl(brandLogoUrl);
      if (resolvedLogo && resolvedLogo.trim().length > 0) {
        validLogoImage = resolvedLogo;
      }
    }

    // Combine references: products first (#1, #2, ...), logo last (if available)
    const referenceImages: string[] = [...validProductImages];
    let logoRefNumber: number | undefined = undefined;
    if (validLogoImage) {
      referenceImages.push(validLogoImage);
      logoRefNumber = referenceImages.length; // e.g. #[count + 1]
    }

    // 3. Generate Full Catalog Poster prompt including logo, titles, descriptions & custom art direction
    const fullPosterPrompt = buildFullCatalogPosterPrompt(
      shopName,
      headerSubtitle,
      footerCta,
      posterProducts,
      prompt || 'Modern Clean Editorial Showcase, tactile boutique print menu, warm organic minimalism',
      activeTheme,
      logoRefNumber
    );

    // 4. Call Image Generation Model via dwiai endpoint
    const imageGenResult = await generateCatalogImage({
      prompt: fullPosterPrompt,
      aspect_ratio: '3:4',
      size: '1024x1365',
      images: referenceImages,
    });

    return NextResponse.json({
      success: true,
      imageUrl: imageGenResult.imageUrl,
      imageBase64: imageGenResult.imageBase64 || imageGenResult.imageUrl,
      model: imageGenResult.model,
      keyUsed: imageGenResult.keyUsed,
      catalogData: {
        shopName,
        tagline: headerSubtitle,
        layout: defaultLayout,
        headerSubtitle,
        footerCta,
        theme: activeTheme,
        fullPosterPrompt,
        imageUrl: imageGenResult.imageUrl,
        brandLogoUrl: validLogoImage || brandLogoUrl || null,
        products: products.map((p, i) => {
          const item = posterProducts[i];
          return {
            ...p,
            isFeatured: i === 0,
            title: item.title,
            tagline: item.title,
            flavorNotes: item.flavorNotes,
            highlight: item.highlight,
            badge: item.badge,
            imageEnhancePrompt: buildImageEnhancementPrompt(
              item.title,
              item.highlight,
              prompt
            ),
          };
        }),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memproses katalog AI.';
    console.error('[Catalog Generate] Error:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
