// Groq AI Client with Round-Robin Load Balancer & Auto-Failover

interface KeyState {
  key: string;
  id: number;
  failureCount: number;
  cooldownUntil: number;
  successCount: number;
}

// Inisialisasi pool API key dari environment variables
function initGroqKeyPool(): KeyState[] {
  let raw = process.env.GROQ_API_KEYS || process.env.GROQ_WA_API_KEYS || '';
  raw = raw.trim();
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1);
  }
  const rawKeys = raw.split(',').map(k => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  const fallbackSingleKey = process.env.GROQ_API_KEY?.trim()?.replace(/^["']|["']$/g, '');
  const allKeys = rawKeys.length > 0 ? rawKeys : (fallbackSingleKey ? [fallbackSingleKey] : []);

  return allKeys.map((key, index) => ({
    key,
    id: index + 1,
    failureCount: 0,
    cooldownUntil: 0,
    successCount: 0,
  }));
}

let keyPool: KeyState[] = initGroqKeyPool();
let currentPointer = 0;

/**
 * Mengambil key berikutnya yang sehat menggunakan Round-Robin.
 * Mengabaikan key yang sedang dalam masa cooldown akibat error sebelumnya.
 */
function getNextHealthyKey(): KeyState | null {
  if (keyPool.length === 0) {
    keyPool = initGroqKeyPool();
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

  // Jika semua key sedang cooldown, pilih key dengan waktu cooldown tercepat
  let fastestRecovery = keyPool[0];
  for (const k of keyPool) {
    if (k.cooldownUntil < fastestRecovery.cooldownUntil) {
      fastestRecovery = k;
    }
  }
  return fastestRecovery;
}

export interface ChatMessageParam {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

/**
 * Menjalankan Chat Completion ke Groq dengan fitur:
 * 1. Load Balancing Round-Robin antar key aktif
 * 2. Auto-Failover instan jika 1 key error (429 Rate Limit, 5xx, atau timeout)
 * 3. Log detail peralihan failover
 */
export async function groqChatCompletion(
  messages: ChatMessageParam[],
  options: GroqCompletionOptions = {}
): Promise<{ text: string; keyUsed: number; model: string }> {
  if (keyPool.length === 0) {
    throw new Error('Tidak ada Groq API Key yang terkonfigurasi di GROQ_API_KEYS');
  }

  const defaultModel = process.env.GROQ_DEFAULT_MODEL || 'qwen/qwen3.8-27b';
  const model = options.model || defaultModel;
  const maxAttempts = keyPool.length;
  let attempts = 0;
  let lastError: any = null;

  while (attempts < maxAttempts) {
    const activeKeyObj = getNextHealthyKey();
    if (!activeKeyObj) {
      break;
    }

    attempts++;
    const masked = activeKeyObj.key.substring(0, 8) + '...' + activeKeyObj.key.substring(activeKeyObj.key.length - 4);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKeyObj.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 800,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const status = response.status;

        // Jika terkena 429 (Rate Limit) atau 5xx (Server Error), kenakan cooldown pada key ini
        if (status === 429) {
          activeKeyObj.cooldownUntil = Date.now() + 60 * 1000; // 60 detik cooldown
          console.warn(`[Groq LoadBalancer] ⚠️ Key #${activeKeyObj.id} (${masked}) terkena Rate Limit 429. Mengalihkan (failover) ke API key lain...`);
        } else if (status >= 500) {
          activeKeyObj.cooldownUntil = Date.now() + 30 * 1000; // 30 detik cooldown
          console.warn(`[Groq LoadBalancer] ⚠️ Key #${activeKeyObj.id} (${masked}) menerima Server Error ${status}. Mengalihkan (failover)...`);
        } else {
          activeKeyObj.cooldownUntil = Date.now() + 15 * 1000;
          console.warn(`[Groq LoadBalancer] ⚠️ Key #${activeKeyObj.id} (${masked}) error HTTP ${status}: ${errorBody}. Mencoba key berikutnya...`);
        }

        activeKeyObj.failureCount++;
        lastError = new Error(`Groq API Error ${status}: ${errorBody}`);
        continue; // Lanjut mencoba key berikutnya (Auto-Failover)
      }

      // Berhasil
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      activeKeyObj.successCount++;
      activeKeyObj.failureCount = 0; // reset failure count saat sukses

      return {
        text: text.trim(),
        keyUsed: activeKeyObj.id,
        model,
      };

    } catch (networkError: any) {
      console.warn(`[Groq LoadBalancer] ❌ Network timeout/error pada Key #${activeKeyObj.id}: ${networkError.message}. Mengalihkan ke key lain...`);
      activeKeyObj.cooldownUntil = Date.now() + 20 * 1000;
      activeKeyObj.failureCount++;
      lastError = networkError;
      continue; // Lanjut coba key lain
    }
  }

  throw new Error(`Seluruh (${maxAttempts}) Groq API Key gagal merespons. Detail error terakhir: ${lastError?.message || 'Unknown error'}`);
}

