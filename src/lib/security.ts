// In-memory rate limiting (Cocok untuk environment Node.js / VPS, namun untuk serverless Vercel disarankan menggunakan Redis/Upstash)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowData = rateLimitMap.get(ip);

  if (!windowData) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (now - windowData.lastReset > windowMs) {
    // Reset window
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (windowData.count >= limit) {
    return false; // Rate limit exceeded
  }

  windowData.count += 1;
  return true;
}

// Helpers untuk membersihkan memori setiap jam agar tidak bocor
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.lastReset > 60 * 60 * 1000) {
      rateLimitMap.delete(ip);
    }
  }
}, 60 * 60 * 1000);

export function isValidEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
