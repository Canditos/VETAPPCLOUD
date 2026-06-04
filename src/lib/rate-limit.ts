type SlidingWindowEntry = {
  attempts: number;
  windowStart: number;
};

const stores = new Map<string, Map<string, SlidingWindowEntry>>();

export function createRateLimiter(options: { windowMs: number; maxAttempts: number }) {
  const { windowMs, maxAttempts } = options;
  const store = new Map<string, SlidingWindowEntry>();
  const storeKey = `rl_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  stores.set(storeKey, store);

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart > windowMs * 2) store.delete(key);
    }
  }, windowMs * 2).unref();

  return {
    check(key: string): { allowed: boolean; retryAfter: number } {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now - entry.windowStart > windowMs) {
        store.set(key, { attempts: 1, windowStart: now });
        return { allowed: true, retryAfter: 0 };
      }

      if (entry.attempts >= maxAttempts) {
        const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
        return { allowed: false, retryAfter };
      }

      entry.attempts++;
      return { allowed: true, retryAfter: 0 };
    },

    reset(key: string) {
      store.delete(key);
    },
  };
}

export function buildRateLimitKey(ip: string, identifier: string) {
  return `${ip}:${identifier.toLowerCase()}`;
}

export function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
