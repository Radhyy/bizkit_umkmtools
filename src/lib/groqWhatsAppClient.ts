// WhatsApp AI Chatbot - Dedicated Groq Load Balancer & Auto-Failover Client

export interface WAKeyState {
  id: number;
  key: string;
  maskedKey: string;
  failureCount: number;
  successCount: number;
  cooldownUntil: number;
  lastLatencyMs: number;
  lastUsedAt: number | null;
  status: 'healthy' | 'cooling_down' | 'error';
}

export interface WAChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface WAGroqOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// Inisialisasi pool khusus WhatsApp dari GROQ_WA_API_KEYS atau fallback ke GROQ_API_KEYS
function initKeyPool(): WAKeyState[] {
  let raw = process.env.GROQ_WA_API_KEYS || process.env.GROQ_API_KEYS || '';
  raw = raw.trim();
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1);
  }
  const keys = raw.split(',').map(k => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);

  return keys.map((key, index) => {
    const masked = key.length > 12 
      ? `${key.slice(0, 8)}...${key.slice(-4)}`
      : '***';

    return {
      id: index + 1,
      key,
      maskedKey: masked,
      failureCount: 0,
      successCount: 0,
      cooldownUntil: 0,
      lastLatencyMs: 0,
      lastUsedAt: null,
      status: 'healthy',
    };
  });
}

// Global in-memory pool state across server requests
let waKeyPool: WAKeyState[] = initKeyPool();
let waPointer = 0;

/**
 * Reset seluruh status key pool (membersihkan cooldown & failure count)
 */
export function resetWhatsAppKeyPool() {
  waKeyPool = initKeyPool();
  return getWhatsAppKeyPoolStatus();
}

/**
 * Mendapatkan status seluruh pool key WhatsApp untuk Admin Dashboard
 */
export function getWhatsAppKeyPoolStatus() {
  // Re-sync jika sebelumnya belum diinisialisasi
  if (waKeyPool.length === 0) {
    waKeyPool = initKeyPool();
  }

  const now = Date.now();
  return waKeyPool.map(k => {
    const isCooling = k.cooldownUntil > now;
    if (!isCooling && k.cooldownUntil > 0) {
      k.failureCount = 0;
      k.cooldownUntil = 0;
      k.status = 'healthy';
    }
    return {
      id: k.id,
      maskedKey: k.maskedKey,
      status: isCooling ? 'cooling_down' : (k.failureCount > 3 ? 'error' : 'healthy'),
      successCount: k.successCount,
      failureCount: k.failureCount,
      cooldownRemainingSec: Math.max(0, Math.ceil((k.cooldownUntil - now) / 1000)),
      lastLatencyMs: k.lastLatencyMs,
      lastUsedAt: k.lastUsedAt,
    };
  });
}

/**
 * Mengambil key sehat berikutnya menggunakan Round-Robin
 */
function getNextHealthyWAKey(): WAKeyState | null {
  if (waKeyPool.length === 0) {
    waKeyPool = initKeyPool();
    if (waKeyPool.length === 0) return null;
  }

  const now = Date.now();
  for (let i = 0; i < waKeyPool.length; i++) {
    const candidateIdx = (waPointer + i) % waKeyPool.length;
    const candidate = waKeyPool[candidateIdx];

    if (candidate.cooldownUntil <= now) {
      waPointer = (candidateIdx + 1) % waKeyPool.length;
      return candidate;
    }
  }

  // Jika semua sedang cooldown, pilih yang waktu cooldown-nya paling cepat selesai
  let fastestRecovery = waKeyPool[0];
  for (const k of waKeyPool) {
    if (k.cooldownUntil < fastestRecovery.cooldownUntil) {
      fastestRecovery = k;
    }
  }
  return fastestRecovery;
}

/**
 * Eksekusi chat completion untuk WhatsApp Assistant dengan Load Balancing & Failover
 */
export async function chatWhatsAppGroq(
  messages: WAChatMessage[],
  options: WAGroqOptions = {}
): Promise<{ text: string; keyId: number; latencyMs: number; model: string }> {
  if (waKeyPool.length === 0) {
    waKeyPool = initKeyPool();
  }

  if (waKeyPool.length === 0) {
    throw new Error('Konfigurasi GROQ_WA_API_KEYS belum diatur di file .env');
  }

  const defaultModel = process.env.GROQ_WA_MODEL || 'qwen/qwen3.8-27b';
  const model = options.model || defaultModel;
  const maxAttempts = waKeyPool.length;
  let attempts = 0;
  let lastError: any = null;

  while (attempts < maxAttempts) {
    const activeKey = getNextHealthyWAKey();
    if (!activeKey) break;

    attempts++;
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.max_tokens ?? 250,
        }),
      });

      const elapsed = Date.now() - startTime;
      activeKey.lastLatencyMs = elapsed;
      activeKey.lastUsedAt = Date.now();

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';

        activeKey.successCount++;
        activeKey.failureCount = 0;
        activeKey.cooldownUntil = 0;
        activeKey.status = 'healthy';

        return {
          text,
          keyId: activeKey.id,
          latencyMs: elapsed,
          model,
        };
      }

      // Handle Rate Limit (429) atau Server Error (5xx)
      const errBody = await response.text();
      let parsedErr: any = null;
      try { parsedErr = JSON.parse(errBody); } catch {}

      const isRateLimit = response.status === 429;
      const cooldownSec = isRateLimit ? 30 : 15;

      activeKey.failureCount++;
      activeKey.cooldownUntil = Date.now() + cooldownSec * 1000;
      activeKey.status = 'cooling_down';

      console.warn(`[WA-Groq-Balancer] Key #${activeKey.id} (${activeKey.maskedKey}) gagal: Status ${response.status}. Cooldown ${cooldownSec}s. Failover ke key berikutnya...`);
      lastError = new Error(`Groq API Error ${response.status}: ${parsedErr?.error?.message || errBody}`);
    } catch (err: any) {
      activeKey.failureCount++;
      activeKey.cooldownUntil = Date.now() + 15000;
      activeKey.status = 'cooling_down';
      console.warn(`[WA-Groq-Balancer] Network error pada Key #${activeKey.id}: ${err.message}. Failover...`);
      lastError = err;
    }
  }

  throw new Error(`Semua (${waKeyPool.length}) API Key WhatsApp Groq sedang cooldown atau sibuk. Error terakhir: ${lastError?.message || 'Unknown'}`);
}

