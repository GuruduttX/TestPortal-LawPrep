/**
 * In-memory rate limiter.
 *
 * ⚠️  PRODUCTION NOTE: This uses a per-process Map. On serverless platforms
 * (Vercel, AWS Lambda) each function instance has its own isolated memory,
 * so rate limits are NOT shared across instances. For production with multiple
 * serverless replicas, replace this with a Redis-based solution (e.g. Upstash).
 * For single-server / Railway deployments this works fine.
 */
const buckets = new Map();

// Periodically clean up expired buckets to prevent memory leak in long-running processes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of buckets.entries()) {
      if (val.resetAt <= now) buckets.delete(key);
    }
  }, 60_000);
}

export function consumeRateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }
  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count };
}
