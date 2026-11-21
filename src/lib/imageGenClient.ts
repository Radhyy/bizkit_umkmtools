// Image Generation Client with Key Rotation, Auto-Failover & Reference Image Support

interface ImageGenKeyState {
  key: string;
  id: number;
  failureCount: number;
  cooldownUntil: number;
  successCount: number;
}

// Inisialisasi pool API key dari environment variables
function initImageGenKeyPool(): ImageGenKeyState[] {
  let raw =
    process.env.IMAGE_GEN_KEYS ||
    process.env.IMAGE_GEN_KEY ||
    process.env.IMAGE_GENERATION_KEYS ||
    process.env.IMAGE_GENERATION_KEY ||
    process.env.IMAGE_GEN_API_KEY ||
    '';

  raw = raw.trim();
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1);
  }

  const rawKeys = raw
    .split(',')
    .map((k) => k.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);

  return rawKeys.map((key, index) => ({
    key,
    id: index + 1,
    failureCount: 0,
    cooldownUntil: 0,
    successCount: 0,
  }));
}

let keyPool: ImageGenKeyState[] = initImageGenKeyPool();
let currentPointer = 0;

/**
 * Mengambil key berikutnya yang sehat menggunakan Round-Robin.
 */
function getNextHealthyKey(): ImageGenKeyState | null {
  if (keyPool.length === 0) {
    keyPool = initImageGenKeyPool();
    if (keyPool.length === 0) return null;
  }

  const now = Date.now();
  for (let i = 0; i < keyPool.length; i++) {
    const candidateIndex = (currentPointer + i) % keyPool.length;
    const candidate = keyPool[candidateIndex];

    if (candidate.cooldownUntil <= now) {
      currentPointer = (candidateIndex + 1) % keyPool.length;
      return candidate;
    }
  }

  // Jika semua key sedang cooldown, pilih key dengan waktu pemulihan tercepat
  let fastestRecovery = keyPool[0];
  for (const k of keyPool) {
    if (k.cooldownUntil < fastestRecovery.cooldownUntil) {
      fastestRecovery = k;
    }
  }
  return fastestRecovery;
}

export interface GenerateImageOptions {
  model?: string;
  prompt: string;
  aspect_ratio?: string;
  size?: string;
  images?: string[];
  timeoutMs?: number;
}

export interface GenerateImageResult {
  imageUrl: string;
  imageBase64?: string;
  model: string;
  keyUsed: number;
  revisedPrompt?: string;
}

/**
 * Menghasilkan gambar menggunakan Image Generation API (default dwiai)
 * Mendukung aspect_ratio 3:4 dan multi reference images.
 */
export async function generateCatalogImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  if (keyPool.length === 0) {
    keyPool = initImageGenKeyPool();
  }

  if (keyPool.length === 0) {
    throw new Error(
      'IMAGE_GEN_KEYS tidak ditemukan di file .env. Pastikan konfigurasi API key image generation sudah diset.'
    );
  }

  const defaultModel =
    process.env.IMAGE_GEN_MODEL ||
    process.env.IMAGE_GENERATION_MODEL ||
    'ag/gemini-3.1-flash-image';
  const model = options.model || defaultModel;
  const endpoint =
    process.env.IMAGE_GEN_ENDPOINT || 'https://r.dwiai.web.id/v1/images/generations';

  const maxAttempts = Math.max(1, keyPool.length);
  let attempts = 0;
  let lastError: unknown = null;

  const aspectRatio = options.aspect_ratio || '3:4';
  const size = options.size || '1024x1365';
  const referenceImages = options.images?.filter(Boolean) || [];

  while (attempts < maxAttempts) {
    const activeKey = getNextHealthyKey();
    if (!activeKey) {
      break;
    }

    attempts++;

    try {
      const payload: Record<string, unknown> = {
        model,
        prompt: options.prompt,
        aspect_ratio: aspectRatio,
        size,
      };

      if (referenceImages.length > 0) {
        payload.images = referenceImages;
        payload.image_urls = referenceImages;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeoutMs || 90000 // 90 seconds timeout for high-res image generation
      );

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeKey.key}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let errMsg = `HTTP ${response.status}: ${errText}`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) errMsg = parsed.error.message;
        } catch {
          // gunakan errText biasa
        }

        if (response.status === 429) {
          activeKey.failureCount++;
          activeKey.cooldownUntil = Date.now() + 60 * 1000;
          console.warn(
            `[ImageGen] Key #${activeKey.id} terkena 429 Rate Limit. Cooldown 60s. Beralih ke key lain...`
          );
          lastError = new Error(`Rate limit (429): ${errMsg}`);
          continue;
        }

        if (response.status >= 500) {
          activeKey.failureCount++;
          activeKey.cooldownUntil = Date.now() + 30 * 1000;
          console.warn(
            `[ImageGen] Key #${activeKey.id} Server Error ${response.status}. Cooldown 30s. Beralih...`
          );
          lastError = new Error(`Server error (${response.status}): ${errMsg}`);
          continue;
        }

        throw new Error(errMsg);
      }

      const resData = (await response.json()) as {
        created?: number;
        data?: Array<{
          b64_json?: string;
          url?: string;
          revised_prompt?: string;
        }>;
      };

      if (!resData.data || resData.data.length === 0) {
        throw new Error('API Image Generation tidak mengembalikan data gambar.');
      }

      const firstItem = resData.data[0];
      let imageUrl = '';
      let imageBase64: string | undefined = undefined;

      if (firstItem.b64_json) {
        const rawB64 = firstItem.b64_json;
        imageBase64 = rawB64.startsWith('data:')
          ? rawB64
          : `data:image/jpeg;base64,${rawB64}`;
        imageUrl = imageBase64;
      } else if (firstItem.url) {
        imageUrl = firstItem.url;
      } else {
        throw new Error('Format respon gambar tidak dikenali (tidak ada url atau b64_json).');
      }

      activeKey.successCount++;
      activeKey.failureCount = 0;

      return {
        imageUrl,
        imageBase64,
        model,
        keyUsed: activeKey.id,
        revisedPrompt: firstItem.revised_prompt,
      };
    } catch (err: unknown) {
      lastError = err;
      activeKey.failureCount++;
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const msg = err instanceof Error ? err.message : String(err);

      if (isAbort) {
        activeKey.cooldownUntil = Date.now() + 15 * 1000;
        console.warn(`[ImageGen] Key #${activeKey.id} timeout (90s). Beralih ke key berikutnya...`);
      } else {
        console.warn(`[ImageGen] Key #${activeKey.id} gagal: ${msg}. Mencoba key berikutnya...`);
      }
    }
  }

  throw new Error(
    `Semua API Key Image Generation (${keyPool.length} key) gagal diproses. Penyebab terakhir: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}
