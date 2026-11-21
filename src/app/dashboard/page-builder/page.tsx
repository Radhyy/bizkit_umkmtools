'use client';
import React, { useState, useRef, useCallback } from 'react';
import {
  IconCheck,
  IconDeviceDesktop,
  IconPlus,
  IconSparkles,
  IconX,
  IconUpload,
  IconPhoto,
  IconDownload,
  IconTrash,
  IconAlertCircle,
  IconLayoutGrid,
  IconCloudUpload,
  IconBuildingStore,
} from '@tabler/icons-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductSlot {
  id: string;
  file: File | null;
  previewUrl: string | null;
  uploadedUrl: string | null;
  uploadedKey: string | null;
  title: string;
  description: string;
  uploading: boolean;
  error: string | null;
}

export interface CatalogTheme {
  headerBg: string;
  headerText: string;
  accentColor: string;
  cardBg: string;
  canvasBg: string;
}

interface CatalogProductData {
  imageUrl: string;
  title: string;
  description: string;
  flavorNotes?: string;
  isFeatured?: boolean;
  tagline?: string;
  highlight: string;
  badge: string;
  imageEnhancePrompt?: string;
}

interface CatalogData {
  shopName: string;
  tagline: string;
  layout: string;
  headerSubtitle: string;
  footerCta?: string;
  fullPosterPrompt?: string;
  theme?: CatalogTheme;
  brandLogoUrl?: string | null;
  products: CatalogProductData[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Kompresi dan konversi foto produk ke format WebP secara client-side.
 * Menghasilkan file yang sangat ringan (~30-70KB) dan sustainable untuk database & server.
 */
function compressToWebP(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas tidak dapat diinisialisasi'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengompresi gambar ke WebP'));
              return;
            }
            const dataUrl = canvas.toDataURL('image/webp', quality);
            resolve({ blob, dataUrl });
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Gagal memproses file gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

function emptySlot(): ProductSlot {
  return {
    id: uid(),
    file: null,
    previewUrl: null,
    uploadedUrl: null,
    uploadedKey: null,
    title: '',
    description: '',
    uploading: false,
    error: null,
  };
}

// ─── Canvas Catalog Renderer ─────────────────────────────────────────────────

async function renderCatalogToCanvas(
  catalog: CatalogData,
  canvasRef: HTMLCanvasElement
): Promise<void> {
  // Tunggu kesiapan font Google Fonts jika tersedia di browser
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  const W = 1200;
  const H = 1600;
  const ctx = canvasRef.getContext('2d')!;
  canvasRef.width = W;
  canvasRef.height = H;

  // Terapkan skema warna Theme dinamis dari AI / JSON
  const theme = catalog.theme || {
    headerBg: '#1C1917',
    headerText: '#FAF8F5',
    accentColor: '#B45309',
    cardBg: '#FFFFFF',
    canvasBg: '#F5F2EB',
  };

  const CANVAS_BG = theme.canvasBg || '#F5F2EB';
  const CARD_BG = theme.cardBg || '#FFFFFF';
  const HEADER_BG = theme.headerBg || '#1C1917';
  const HEADER_TEXT = theme.headerText || '#FAF8F5';
  const ACCENT_COLOR = theme.accentColor || '#B45309';
  const TEXT_DARK = '#1C1917';
  const TEXT_MUTED = '#57534E';
  const CARD_BORDER = '#E7E5E4';

  async function loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  function roundRect(
    x: number, y: number, w: number, h: number, r: number,
    fill?: string, stroke?: string
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  // Muat Logo Brand jika ada
  const logoImg = catalog.brandLogoUrl ? await loadImage(catalog.brandLogoUrl) : null;
  const headerH = logoImg ? 220 : 185;

  // 1. Background Canvas
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, W, H);

  // 2. Header Band
  ctx.fillStyle = HEADER_BG;
  ctx.fillRect(0, 0, W, headerH);

  // Accent Strip tipis di bawah Header
  ctx.fillStyle = ACCENT_COLOR;
  ctx.fillRect(0, headerH, W, 5);

  if (logoImg) {
    // Render Logo Brand di Tengah Header
    const maxLogoH = 48;
    const maxLogoW = 160;
    const ratio = Math.min(maxLogoW / logoImg.width, maxLogoH / logoImg.height);
    const logoW = logoImg.width * ratio;
    const logoH = logoImg.height * ratio;
    ctx.drawImage(logoImg, (W - logoW) / 2, 22, logoW, logoH);

    // Header: Nama Toko / Brand (Font Editorial Serif Modern)
    ctx.fillStyle = HEADER_TEXT;
    ctx.font = `bold 48px "DM Serif Display", "Playfair Display", Georgia, serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(catalog.shopName || 'Katalog Produk', W / 2, 22 + logoH + 34);

    // Header: Subtitle / Tagline (Font Sans-Serif Bersih)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.80)';
    ctx.font = `500 18px "Plus Jakarta Sans", -apple-system, sans-serif`;
    ctx.fillText(catalog.headerSubtitle || catalog.tagline || '', W / 2, 22 + logoH + 72);
  } else {
    // Header: Nama Toko / Brand
    ctx.fillStyle = HEADER_TEXT;
    ctx.font = `bold 54px "DM Serif Display", "Playfair Display", Georgia, serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(catalog.shopName || 'Katalog Produk', W / 2, 74);

    // Header: Subtitle / Tagline
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.font = `500 20px "Plus Jakarta Sans", -apple-system, sans-serif`;
    ctx.fillText(catalog.headerSubtitle || catalog.tagline || '', W / 2, 134);
  }

  const products = catalog.products;
  const count = products.length;

  // ── Layout Engine ─────────────────────────────────────────────────────────
  const CONTENT_TOP = headerH + 5 + 30;
  const CONTENT_BOTTOM = H - 68;
  const CONTENT_H = CONTENT_BOTTOM - CONTENT_TOP;
  const PAD = 36;
  const INNER_W = W - PAD * 2;
  const GAP = 24;
  const RADIUS = 18;

  // ── Card Drawing: Horizontal Hero Showcase Card ──────────────────────────
  function drawHeroHorizontalCard(
    x: number, y: number, w: number, h: number,
    product: CatalogProductData,
    img: HTMLImageElement | null
  ) {
    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    roundRect(x, y, w, h, RADIUS, CARD_BG, CARD_BORDER);
    ctx.restore();

    // Sisi Kiri: Foto Produk Hero (52% lebar kartu)
    const imgW = Math.round(w * 0.52);
    ctx.save();
    // Clip sisi kiri kartu
    ctx.beginPath();
    ctx.moveTo(x + RADIUS, y);
    ctx.lineTo(x + imgW, y);
    ctx.lineTo(x + imgW, y + h);
    ctx.lineTo(x + RADIUS, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - RADIUS);
    ctx.lineTo(x, y + RADIUS);
    ctx.quadraticCurveTo(x, y, x + RADIUS, y);
    ctx.closePath();
    ctx.clip();

    if (img) {
      const scale = Math.max(imgW / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = x + (imgW - dw) / 2;
      const dy = y + (h - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = '#E7E5E4';
      ctx.fillRect(x, y, imgW, h);
      ctx.fillStyle = '#78716C';
      ctx.font = `500 16px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Hero Showcase', x + imgW / 2, y + h / 2);
    }
    ctx.restore();

    // Badge pada foto Hero
    if (product.badge) {
      const badgeX = x + 18;
      const badgeY = y + 18;
      ctx.font = `700 12px "Plus Jakarta Sans", sans-serif`;
      const badgeText = product.badge.toUpperCase();
      const bW = ctx.measureText(badgeText).width + 20;
      const bH = 26;
      roundRect(badgeX, badgeY, bW, bH, 6, ACCENT_COLOR);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, badgeX + bW / 2, badgeY + bH / 2);
    }

    // Sisi Kanan: Area Teks Editorial Lega
    const infoLeft = x + imgW + 28;
    const infoRight = x + w - 28;
    const infoW = infoRight - infoLeft;
    let cy = y + 36;

    // Eyebrow tag
    ctx.fillStyle = ACCENT_COLOR;
    ctx.font = `700 12px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('FEATURED HIGHLIGHT', infoLeft, cy);
    cy += 20;

    // Judul Produk dari respons AI
    const titleFontSize = 26;
    ctx.font = `bold ${titleFontSize}px "DM Serif Display", "Playfair Display", Georgia, serif`;
    ctx.fillStyle = TEXT_DARK;
    const titleText = product.title || product.tagline || 'Produk Unggulan';
    const titleLines = wrapText(ctx, titleText, infoW);
    titleLines.slice(0, 2).forEach((line) => {
      ctx.fillText(line, infoLeft, cy);
      cy += titleFontSize * 1.25;
    });

    // Sub-title / Flavor notes dari respons AI
    if (product.flavorNotes) {
      cy += 6;
      ctx.font = `600 13px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = ACCENT_COLOR;
      ctx.fillText(product.flavorNotes.toUpperCase(), infoLeft, cy);
      cy += 18;
    }

    // Garis aksen pemisah
    cy += 4;
    ctx.fillStyle = ACCENT_COLOR;
    ctx.fillRect(infoLeft, cy, 36, 2.5);
    cy += 14;

    // Deskripsi highlight lengkap dari respons AI
    if (product.highlight) {
      const hlFontSize = 14.5;
      ctx.font = `400 ${hlFontSize}px "Plus Jakarta Sans", -apple-system, sans-serif`;
      ctx.fillStyle = TEXT_MUTED;
      const hlLines = wrapText(ctx, product.highlight, infoW);
      hlLines.slice(0, 4).forEach((line) => {
        ctx.fillText(line, infoLeft, cy);
        cy += hlFontSize * 1.45;
      });
    }
  }

  // ── Card Drawing: Standard Product Card ──────────────────────────────────
  function drawProductCard(
    x: number, y: number, w: number, h: number,
    product: CatalogProductData,
    img: HTMLImageElement | null,
    featured = false
  ) {
    // Soft Card Drop Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    roundRect(x, y, w, h, RADIUS, CARD_BG, CARD_BORDER);
    ctx.restore();

    // Balanced Image Ratio (4:5 / 1:1, max 47% tinggi kartu) agar teks memiliki ruang lega
    const imgH = Math.min(Math.round(h * 0.47), Math.round(w * 0.92));
    ctx.save();
    roundRect(x, y, w, imgH + RADIUS, RADIUS);
    ctx.clip();

    if (img) {
      const scale = Math.max(w / img.width, imgH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = x + (w - dw) / 2;
      const dy = y + (imgH - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = '#E7E5E4';
      ctx.fillRect(x, y, w, imgH);
      ctx.fillStyle = '#78716C';
      ctx.font = `500 16px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Foto Produk', x + w / 2, y + imgH / 2);
    }

    // Gradient overlay lembut di bagian bawah foto
    const grad = ctx.createLinearGradient(x, y + imgH - 50, x, y + imgH);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y + imgH - 50, w, 50);

    ctx.restore();

    // Badge promosi
    if (product.badge) {
      const badgeX = x + 16;
      const badgeY = y + 16;
      ctx.font = `700 12px "Plus Jakarta Sans", sans-serif`;
      const badgeText = product.badge.toUpperCase();
      const bW = ctx.measureText(badgeText).width + 20;
      const bH = 26;
      roundRect(badgeX, badgeY, bW, bH, 6, ACCENT_COLOR);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, badgeX + bW / 2, badgeY + bH / 2);
    }

    // Area teks dengan padding lega (22px)
    const padX = 22;
    const infoLeft = x + padX;
    const infoRight = x + w - padX;
    const infoW = infoRight - infoLeft;
    let cy = y + imgH + 20;

    ctx.textAlign = 'left';

    // Judul Produk dari respons AI
    const titleFontSize = featured ? 24 : 20;
    ctx.font = `bold ${titleFontSize}px "DM Serif Display", "Playfair Display", Georgia, serif`;
    ctx.fillStyle = TEXT_DARK;
    ctx.textBaseline = 'top';

    const titleText = product.title || product.tagline || 'Produk';
    const titleLines = wrapText(ctx, titleText, infoW);
    titleLines.slice(0, 2).forEach((line) => {
      ctx.fillText(line, infoLeft, cy);
      cy += titleFontSize * 1.25;
    });

    // Sub-title / Flavor notes jika ada
    if (product.flavorNotes) {
      cy += 3;
      ctx.font = `600 11.5px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = ACCENT_COLOR;
      ctx.fillText(product.flavorNotes.toUpperCase(), infoLeft, cy);
      cy += 14;
    }

    // Garis aksen pemisah tipis yang elegan di bawah judul
    cy += 5;
    ctx.fillStyle = ACCENT_COLOR;
    ctx.fillRect(infoLeft, cy, 30, 2);
    cy += 11;

    // Highlight / deskripsi produk dari respons AI
    if (product.highlight) {
      const hlFontSize = featured ? 14.5 : 13;
      ctx.font = `400 ${hlFontSize}px "Plus Jakarta Sans", -apple-system, sans-serif`;
      ctx.fillStyle = TEXT_MUTED;
      const hlLines = wrapText(ctx, product.highlight, infoW);
      hlLines.slice(0, 3).forEach((line) => {
        ctx.fillText(line, infoLeft, cy);
        cy += hlFontSize * 1.45;
      });
    }
  }

  // ── Load all images in parallel ─────────────────────────────────────────
  const imgs = await Promise.all(
    products.map((p) => (p.imageUrl ? loadImage(p.imageUrl) : Promise.resolve(null)))
  );

  // ── Draw layout secara proporsional sesuai jumlah produk ────────────────
  const isHero2Col = catalog.layout === 'hero+2col' || count === 3;

  if (count === 1) {
    // Single: 1 Large Horizontal Showcase Card
    const cardH = Math.min(CONTENT_H - 40, 680);
    const cy = CONTENT_TOP + (CONTENT_H - cardH) / 2;
    drawHeroHorizontalCard(PAD, cy, INNER_W, cardH, products[0], imgs[0]);

  } else if (count === 2) {
    // 2-col equal
    const cardW = (INNER_W - GAP) / 2;
    const cardH = CONTENT_H - 24;
    [0, 1].forEach((i) => {
      drawProductCard(PAD + i * (cardW + GAP), CONTENT_TOP, cardW, cardH, products[i], imgs[i]);
    });

  } else if (isHero2Col && count === 3) {
    // HERO+2COL: 1 Horizontal Hero Card di atas + 2 Kartu seimbang di bawah
    const heroH = Math.round(CONTENT_H * 0.44); // ~550px
    drawHeroHorizontalCard(PAD, CONTENT_TOP, INNER_W, heroH, products[0], imgs[0]);

    const bottomTop = CONTENT_TOP + heroH + GAP;
    const bottomH = CONTENT_BOTTOM - bottomTop;
    const cardW = (INNER_W - GAP) / 2;

    drawProductCard(PAD, bottomTop, cardW, bottomH, products[1], imgs[1]);
    drawProductCard(PAD + cardW + GAP, bottomTop, cardW, bottomH, products[2], imgs[2]);

  } else if (count === 4) {
    // 2x2 Grid: 4 Kartu seimbang dalam 2 baris
    const rowH = (CONTENT_H - GAP) / 2;
    const colW = (INNER_W - GAP) / 2;
    [0, 1, 2, 3].forEach((i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      drawProductCard(
        PAD + col * (colW + GAP),
        CONTENT_TOP + row * (rowH + GAP),
        colW,
        rowH,
        products[i],
        imgs[i]
      );
    });

  } else if (count <= 6) {
    // Hero top + sisa produk dalam grid 2 kolom di bawah
    const heroH = Math.round(CONTENT_H * 0.40);
    drawHeroHorizontalCard(PAD, CONTENT_TOP, INNER_W, heroH, products[0], imgs[0]);

    const rowTop = CONTENT_TOP + heroH + GAP;
    const remaining = count - 1;
    const rowCount = Math.ceil(remaining / 2);
    const rowH = (CONTENT_BOTTOM - rowTop - GAP * (rowCount - 1)) / rowCount;
    const colW = (INNER_W - GAP) / 2;

    for (let i = 0; i < remaining; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      drawProductCard(
        PAD + col * (colW + GAP),
        rowTop + row * (rowH + GAP),
        colW,
        rowH,
        products[i + 1],
        imgs[i + 1]
      );
    }

  } else {
    // 7–8: hero banner di atas + 2 baris produk di bawah
    const heroH = Math.round(CONTENT_H * 0.32);
    drawHeroHorizontalCard(PAD, CONTENT_TOP, INNER_W, heroH, products[0], imgs[0]);

    const rowTop = CONTENT_TOP + heroH + GAP;
    const remaining = products.slice(1);
    const rowCount = Math.ceil(remaining.length / 2);
    const rowH = (CONTENT_BOTTOM - rowTop - GAP * (rowCount - 1)) / rowCount;
    const colW = (INNER_W - GAP) / 2;

    remaining.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      drawProductCard(
        PAD + col * (colW + GAP),
        rowTop + row * (rowH + GAP),
        colW,
        rowH,
        p,
        imgs[i + 1]
      );
    });
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footerY = H - 64;
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, footerY, W, 64);
  ctx.fillStyle = '#D6D3D1';
  ctx.fillRect(PAD, footerY, INNER_W, 1);

  ctx.fillStyle = TEXT_DARK;
  ctx.font = `600 13.5px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const ctaText = catalog.footerCta || 'Tersedia untuk dine-in & delivery • Pesan sekarang sebelum kehabisan';
  ctx.fillText(ctaText, W / 2, footerY + 23);

  ctx.fillStyle = TEXT_MUTED;
  ctx.font = `400 11.5px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(`© ${catalog.shopName} · Modern Editorial Showcase · Dibuat dengan Bizkit`, W / 2, footerY + 44);
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function PageBuilder() {
  const [prompt, setPrompt] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [s3PosterUrl, setS3PosterUrl] = useState<string | null>(null);
  const [isSavingS3, setIsSavingS3] = useState(false);
  const [productSlots, setProductSlots] = useState<ProductSlot[]>([emptySlot()]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [brandLogo, setBrandLogo] = useState<{
    file: File | null;
    previewUrl: string | null;
    uploadedUrl: string | null;
    uploading: boolean;
    error: string | null;
  }>({ file: null, previewUrl: null, uploadedUrl: null, uploading: false, error: null });
  const [isLogoDragOver, setIsLogoDragOver] = useState(false);

  const PROMPT_SUGGESTIONS = [
    { label: 'Kuliner & Minuman', text: 'Modern Clean Showcase dengan nuansa segar dan appetizing, tonjolkan visual produk utama dengan pencahayaan elegan.' },
    { label: 'Fashion & Aksesoris', text: 'Editorial style, earth tone minimalis, foto produk terlihat mewah dan elegan dengan background bersih.' },
    { label: 'Camilan & Snack', text: 'Vibrant dan cheerful, catalog yang eye-catching dengan produk terlihat renyah dan menggoda.' },
  ];

  function showToast(text: string, type: 'success' | 'error' = 'success') {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  }

  // ─── Slot management ──────────────────────────────────────────────────────

  function addSlot() {
    if (productSlots.length >= 8) {
      showToast('Maksimal 8 produk per katalog.', 'error');
      return;
    }
    setProductSlots((prev) => [...prev, emptySlot()]);
  }

  function removeSlot(id: string) {
    const slot = productSlots.find((s) => s.id === id);
    if (slot?.uploadedKey) {
      fetch(`/api/upload/catalog?id=${encodeURIComponent(slot.uploadedKey)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }
    setProductSlots((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSlot(id: string, patch: Partial<ProductSlot>) {
    setProductSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  const saveDebounceMap = useRef<Record<string, NodeJS.Timeout>>({});

  function handleSlotTitleChange(slotId: string, title: string) {
    updateSlot(slotId, { title });
    const slot = productSlots.find((s) => s.id === slotId);
    if (slot?.uploadedKey) {
      if (saveDebounceMap.current[slotId]) {
        clearTimeout(saveDebounceMap.current[slotId]);
      }
      saveDebounceMap.current[slotId] = setTimeout(() => {
        fetch('/api/upload/catalog', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: slot.uploadedKey, title }),
        }).catch(() => {});
      }, 600);
    }
  }

  function handleSlotDescChange(slotId: string, description: string) {
    updateSlot(slotId, { description });
    const slot = productSlots.find((s) => s.id === slotId);
    if (slot?.uploadedKey) {
      if (saveDebounceMap.current[slotId]) {
        clearTimeout(saveDebounceMap.current[slotId]);
      }
      saveDebounceMap.current[slotId] = setTimeout(() => {
        fetch('/api/upload/catalog', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: slot.uploadedKey, description }),
        }).catch(() => {});
      }, 600);
    }
  }

  // ─── File selection & upload ───────────────────────────────────────────────

  const handleFileSelect = useCallback(
    async (slotId: string, file: File) => {
      const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
      if (!ALLOWED.includes(file.type)) {
        updateSlot(slotId, { error: 'Format tidak didukung. Gunakan JPG, PNG, atau WEBP.' });
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        updateSlot(slotId, { error: 'Ukuran file maks 12 MB.' });
        return;
      }

      updateSlot(slotId, { uploading: true, error: null });

      try {
        // Kompresi foto menjadi format WebP efisien & terstandardisasi
        const { blob, dataUrl } = await compressToWebP(file, 1200, 0.82);
        const webpFile = new File(
          [blob],
          file.name.replace(/\.[^/.]+$/, '') + '.webp',
          { type: 'image/webp' }
        );

        updateSlot(slotId, { file: webpFile, previewUrl: dataUrl });

        const fd = new FormData();
        fd.append('files', webpFile);
        const res = await fetch('/api/upload/catalog', { method: 'POST', body: fd });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Upload gagal.');
        }

        const uploaded = data.files[0];
        updateSlot(slotId, {
          uploadedUrl: uploaded.url,
          uploadedKey: uploaded.id,
          uploading: false,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload gagal.';
        updateSlot(slotId, { uploading: false, error: msg });
      }
    },
    []
  );

  function onDrop(slotId: string, e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(slotId, file);
  }

  // ─── Logo upload ──────────────────────────────────────────────────────────

  const handleLogoSelect = useCallback(async (file: File) => {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!ALLOWED.includes(file.type)) {
      setBrandLogo((prev) => ({ ...prev, error: 'Format tidak didukung. Gunakan JPG, PNG, WEBP, atau SVG.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBrandLogo((prev) => ({ ...prev, error: 'Ukuran logo maks 5 MB.' }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setBrandLogo({ file, previewUrl, uploadedUrl: null, uploading: true, error: null });

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'logos');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload logo gagal.');
      setBrandLogo((prev) => ({ ...prev, uploadedUrl: data.url, uploading: false }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload logo gagal.';
      setBrandLogo((prev) => ({ ...prev, uploading: false, error: msg }));
    }
  }, []);

  const handleLogoDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsLogoDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleLogoSelect(file);
    },
    [handleLogoSelect]
  );

  // ─── Generate catalog ─────────────────────────────────────────────────────

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    if (!shopName.trim()) {
      showToast('Harap masukkan nama toko atau brand Anda.', 'error');
      return;
    }

    const readySlots = productSlots.filter((s) => s.uploadedUrl);
    if (readySlots.length === 0) {
      showToast('Upload minimal 1 foto produk terlebih dahulu.', 'error');
      return;
    }

    const stillUploading = productSlots.some((s) => s.uploading);
    if (stillUploading) {
      showToast('Tunggu hingga semua foto selesai diunggah.', 'error');
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Get AI catalog layout data
      const aiRes = await fetch('/api/ai/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: readySlots.map((s, idx) => ({
            id: s.uploadedKey,
            imageUrl: s.uploadedUrl,
            title: s.title.trim() || `Produk ${idx + 1}`,
            description: s.description.trim() || '',
          })),
          shopName,
          tagline: shopDesc,
          prompt,
          brandLogoUrl: brandLogo.uploadedUrl || brandLogo.previewUrl || null,
        }),
      });

      const aiData = await aiRes.json();
      if (!aiRes.ok || !aiData.success) {
        throw new Error(aiData.error || 'Gagal memproses AI.');
      }

      const aiImageUrl = aiData.imageUrl || aiData.imageBase64 || aiData.catalogData?.imageUrl;
      let dataUrl: string;

      if (aiImageUrl) {
        dataUrl = aiImageUrl;
      } else {
        const catalogData: CatalogData = {
          ...aiData.catalogData,
          brandLogoUrl: brandLogo.uploadedUrl ?? null,
        };

        // 2. Render to canvas (fallback)
        if (!canvasRef.current) throw new Error('Canvas tidak tersedia.');
        await renderCatalogToCanvas(catalogData, canvasRef.current);

        // 3. Export to JPG data URL
        dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      }

      setDownloadUrl(dataUrl);
      setS3PosterUrl(null);
      setIsPreviewModalOpen(true);

      // 4. Otomatis upload file gambar poster (.jpg) ke Cloud S3 Storage
      setIsSavingS3(true);
      fetch('/api/catalog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          shopName,
          folder: 'catalog-posters',
        }),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && resData.url) {
            setS3PosterUrl(resData.url);
          }
        })
        .catch((s3Err) => {
          console.warn('[Auto Upload S3] Gagal menyimpan ke S3:', s3Err);
        })
        .finally(() => {
          setIsSavingS3(false);
        });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat katalog.';
      showToast(msg, 'error');
    } finally {
      setIsGenerating(false);
    }
  }

  async function downloadCatalog() {
    if (!downloadUrl) return;
    try {
      const filename = `katalog-${shopName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
      if (downloadUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        a.click();
      } else {
        const res = await fetch(downloadUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }
    } catch {
      window.open(downloadUrl, '_blank');
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const uploadedCount = productSlots.filter((s) => s.uploadedUrl).length;
  const totalSlots = productSlots.length;

  return (
    <div className="p-5 sm:p-8 max-w-[1280px] mx-auto space-y-6 font-jakarta">

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-semibold animate-fade-in ${
            toastMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <IconAlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          ) : (
            <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
          >
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            AI Page Builder
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Buat poster katalog produk siap cetak atau bagikan dalam hitungan detik.
          </p>
        </div>

        {uploadedCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200/80 rounded-xl text-blue-700 text-xs font-semibold">
            <IconLayoutGrid className="w-3.5 h-3.5" />
            <span>{uploadedCount} dari {totalSlots} produk siap</span>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Left Column: Form ── */}
        <div className="lg:col-span-7 space-y-5">

          {/* Product Photo Upload Section */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Foto Produk</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Upload foto, beri judul &amp; deskripsi singkat tiap produk
                </p>
              </div>
              <button
                type="button"
                onClick={addSlot}
                disabled={productSlots.length >= 8}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/70 rounded-xl text-zinc-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <IconPlus className="w-3.5 h-3.5" />
                Tambah Produk
              </button>
            </div>

            <div className="space-y-3">
              {productSlots.map((slot, idx) => (
                <ProductSlotCard
                  key={slot.id}
                  slot={slot}
                  index={idx}
                  onFileSelect={(file) => handleFileSelect(slot.id, file)}
                  onDrop={(e) => onDrop(slot.id, e)}
                  onTitleChange={(v) => handleSlotTitleChange(slot.id, v)}
                  onDescChange={(v) => handleSlotDescChange(slot.id, v)}
                  onRemove={productSlots.length > 1 ? () => removeSlot(slot.id) : undefined}
                />
              ))}
            </div>

            {productSlots.length < 8 && (
              <button
                type="button"
                onClick={addSlot}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-zinc-200 hover:border-zinc-300 rounded-xl text-zinc-400 hover:text-zinc-600 text-xs font-medium transition-colors cursor-pointer"
              >
                <IconPlus className="w-3.5 h-3.5" />
                Tambah produk lagi (maks 8)
              </button>
            )}
          </div>

          {/* Store Info + AI Form */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-base font-bold text-zinc-900">Informasi Toko &amp; Instruksi AI</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Lengkapi detail toko dan arahkan gaya desain katalog</p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">

              {/* Brand Logo Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Logo Brand <span className="text-zinc-400 font-normal">(Opsional)</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">Drag & drop atau pilih file</span>
                </div>
                <div
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isLogoDragOver
                      ? 'border-blue-400 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-zinc-50 border-zinc-200/90'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!brandLogo.uploading) setIsLogoDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsLogoDragOver(false);
                  }}
                  onDrop={handleLogoDrop}
                >
                  {/* Logo thumbnail / upload trigger */}
                  <div
                    className={`w-16 h-16 shrink-0 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden relative transition-colors ${
                      brandLogo.uploading
                        ? 'border-blue-300 bg-blue-50'
                        : isLogoDragOver
                        ? 'border-blue-500 bg-blue-100/60'
                        : brandLogo.previewUrl
                        ? 'border-zinc-200 bg-white'
                        : 'border-zinc-200 hover:border-zinc-400 bg-white'
                    }`}
                    onClick={() => !brandLogo.uploading && logoInputRef.current?.click()}
                    title="Upload atau drop logo brand"
                  >
                    {brandLogo.uploading ? (
                      <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                    ) : isLogoDragOver ? (
                      <IconUpload className="w-6 h-6 text-blue-600 animate-bounce" />
                    ) : brandLogo.previewUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={brandLogo.previewUrl} alt="Logo preview" className="w-full h-full object-contain p-1" />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                          <IconUpload className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <IconBuildingStore className="w-6 h-6 text-zinc-300" />
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleLogoSelect(f);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {brandLogo.error ? (
                      <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mb-1">
                        <IconAlertCircle className="w-3 h-3 shrink-0" />
                        {brandLogo.error}
                      </p>
                    ) : null}
                    {isLogoDragOver ? (
                      <p className="text-[11px] text-blue-600 font-semibold mb-1">
                        Lepaskan file untuk mengunggah logo...
                      </p>
                    ) : brandLogo.uploadedUrl ? (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <IconCheck className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold truncate">Logo berhasil diunggah</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 mb-1">
                        Tarik &amp; lepas logo ke sini atau klik pilih file.
                      </p>
                    )}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => !brandLogo.uploading && logoInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-[11px] text-zinc-600 font-semibold transition-colors cursor-pointer"
                      >
                        {brandLogo.previewUrl ? 'Ganti Logo' : 'Pilih Logo'}
                      </button>
                      {brandLogo.previewUrl && (
                        <button
                          type="button"
                          onClick={() => setBrandLogo({ file: null, previewUrl: null, uploadedUrl: null, uploading: false, error: null })}
                          className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus logo"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">JPG, PNG, WEBP, SVG · Maks 5 MB</p>
                  </div>
                </div>
              </div>

              {/* Prompt AI */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Instruksi Desain AI
                  </label>
                  <span className="text-[10px] text-zinc-400">Opsional — jelaskan gaya visual</span>
                </div>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Contoh: Nuansa elegan premium, foto produk terlihat mewah dengan pencahayaan studio bersih..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all resize-none shadow-2xs"
                />
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] text-zinc-400 shrink-0">Contoh:</span>
                  {PROMPT_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(item.text)}
                      className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/70 rounded-lg text-[11px] text-zinc-600 whitespace-nowrap transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shop Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Nama Toko / Brand Usaha <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Misal: Dapur Mama Ria / Segar Bar Fruit"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Tagline / Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  value={shopDesc}
                  onChange={(e) => setShopDesc(e.target.value)}
                  placeholder="Teks sub-judul yang tampil di bawah nama toko pada katalog..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all resize-none shadow-2xs"
                />
              </div>

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition-all border-b-4 border-[#1e40af] active:border-b-0 active:translate-y-1 text-xs sm:text-sm cursor-pointer disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <IconSparkles
                        className="w-4 h-4 shrink-0"
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                      <span>AI Sedang Merancang Katalog...</span>
                    </>
                  ) : (
                    <>
                      <IconSparkles className="w-4 h-4 shrink-0" />
                      <span>Buat Halaman Sekarang</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-zinc-400 mt-2">
                  Proses berlangsung 10–30 detik tergantung jumlah produk.
                </p>
              </div>

            </form>
          </div>
        </div>

        {/* ── Right Column: Template Preview ── */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Gaya Katalog</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Template yang digunakan untuk katalog Anda</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-[11px] font-semibold border border-zinc-200/60">
                <IconDeviceDesktop className="w-3.5 h-3.5 text-zinc-500" />
                Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Template 1: Active */}
              <div className={`group relative cursor-default rounded-2xl border-2 overflow-hidden border-[#2563eb] shadow-md ring-2 ring-blue-500/10`}>
                <div className="aspect-square bg-zinc-100 w-full relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/TemplateProduct/Template1.jpeg"
                    alt="Modern Clean Showcase"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-[#2563eb] text-white rounded-full p-1 shadow-md">
                    <IconCheck className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
                <div className="p-3.5 bg-blue-50/20 border-t border-blue-100">
                  <h3 className="font-bold text-zinc-900 text-xs">Modern Clean Showcase</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                    Cocok untuk semua kategori produk UMKM.
                  </p>
                </div>
              </div>

              {/* Coming soon */}
              <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/60 flex flex-col items-center justify-center text-center p-4 aspect-square">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xs text-zinc-400 mb-2 border border-zinc-200/80">
                  <IconPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-zinc-700 text-xs">Template Lainnya</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Segera Hadir</p>
              </div>

            </div>
          </div>

          {/* Info row */}
          <div className="pt-4 border-t border-zinc-100 mt-5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Format output</span>
              <span className="font-semibold text-zinc-700">JPG 1200 × 1600 px</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Produk per katalog</span>
              <span className="font-semibold text-zinc-700">1 — 8 foto produk</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Siap cetak / bagikan</span>
              <span className="font-semibold text-zinc-700">Instagram, WhatsApp, Print</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Download Modal ── */}
      {isPreviewModalOpen && downloadUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in font-jakarta">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Katalog Siap Diunduh</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  File JPG beresolusi tinggi siap cetak &amp; bagikan
                </p>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Preview thumbnail */}
            <div className="rounded-xl overflow-hidden border border-zinc-200/80 mb-4 bg-zinc-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={downloadUrl}
                alt="Katalog produk"
                className="w-full max-h-72 object-contain"
              />
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <IconPhoto className="w-5 h-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-900 truncate">
                  katalog-{shopName.toLowerCase().replace(/\s+/g, '-')}.jpg
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-zinc-400">1200 × 1600 px · High Quality JPEG</span>
                  {s3PosterUrl && (
                    <a
                      href={s3PosterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-600 hover:text-blue-700 underline truncate max-w-[140px]"
                      title={s3PosterUrl}
                    >
                      Buka di Cloud S3
                    </a>
                  )}
                </div>
              </div>
              {isSavingS3 ? (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-full border border-blue-100 shrink-0 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Upload S3...
                </span>
              ) : s3PosterUrl ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-100 shrink-0 flex items-center gap-1" title="Tersimpan di KilatStorage S3">
                  <IconCloudUpload className="w-3 h-3 text-emerald-600" />
                  S3 Cloud
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-100 shrink-0">
                  Siap
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-800 font-medium rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={downloadCatalog}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all border-b-4 border-[#1e40af] active:border-b-0 active:translate-y-1 cursor-pointer"
              >
                <IconDownload className="w-4 h-4" />
                <span>Unduh Katalog (.jpg)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Product Slot Card Component ──────────────────────────────────────────────

function ProductSlotCard({
  slot,
  index,
  onFileSelect,
  onDrop,
  onTitleChange,
  onDescChange,
  onRemove,
}: {
  slot: ProductSlot;
  index: number;
  onFileSelect: (file: File) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onTitleChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onRemove?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="border border-zinc-200/80 rounded-xl overflow-hidden bg-zinc-50/40">
      <div className="flex items-center gap-3 p-3 bg-white border-b border-zinc-100">
        <span className="w-5 h-5 rounded-md bg-zinc-100 border border-zinc-200/70 flex items-center justify-center text-[11px] font-bold text-zinc-500 shrink-0">
          {index + 1}
        </span>
        <span className="text-xs font-semibold text-zinc-700 flex-1 truncate">
          {slot.title || `Produk ${index + 1}`}
        </span>
        <div className="flex items-center gap-1.5">
          {slot.uploading && (
            <span className="text-[10px] text-blue-600 font-medium animate-pulse">Mengunggah...</span>
          )}
          {slot.uploadedUrl && !slot.uploading && (
            <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <IconCheck className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
            </span>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              title="Hapus produk ini"
            >
              <IconTrash className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 flex gap-3">
        {/* Upload area */}
        <div
          className={`w-28 h-28 shrink-0 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : slot.uploadedUrl
              ? 'border-zinc-200 bg-zinc-50'
              : 'border-zinc-200 hover:border-zinc-400 bg-white hover:bg-zinc-50'
          }`}
          onClick={() => !slot.uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => { setIsDragOver(false); }}
          onDrop={(e) => { setIsDragOver(false); onDrop(e); }}
        >
          {slot.uploading ? (
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
              <span className="text-[10px] text-blue-500 font-medium">Upload...</span>
            </div>
          ) : slot.previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slot.previewUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <IconUpload className="w-5 h-5 text-white" />
              </div>
            </>
          ) : (
            <>
              <IconPhoto className="w-6 h-6 text-zinc-300 mb-1" />
              <span className="text-[10px] text-zinc-400 text-center px-1">Klik atau drop foto</span>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileSelect(f);
              e.target.value = '';
            }}
          />
        </div>

        {/* Fields */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {slot.error && (
            <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
              <IconAlertCircle className="w-3 h-3 shrink-0" />
              {slot.error}
            </p>
          )}
          <input
            type="text"
            value={slot.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Judul produk (maks 40 karakter)"
            maxLength={40}
            className="w-full px-3 py-2 bg-white border border-zinc-200/90 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
          />
          <textarea
            rows={3}
            value={slot.description}
            onChange={(e) => onDescChange(e.target.value)}
            placeholder="Deskripsi singkat — keunggulan, harga, promo, ukuran, dsb."
            maxLength={120}
            className="w-full px-3 py-2 bg-white border border-zinc-200/90 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}
