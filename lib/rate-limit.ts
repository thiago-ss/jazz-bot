import "server-only";

type RateLimitOptions = {
  intervalMs: number;
  key: string;
  limit: number;
};

type RateLimitResult = {
  limit: number;
  remaining: number;
  resetAt: number;
  success: boolean;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function takeRateLimit({
  intervalMs,
  key,
  limit,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  if (buckets.size > 5000) {
    pruneExpiredBuckets(now);
  }

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + intervalMs;
    buckets.set(key, { count: 1, resetAt });

    return {
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt,
      success: true,
    };
  }

  if (existing.count >= limit) {
    return {
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      success: false,
    };
  }

  existing.count += 1;

  return {
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    success: true,
  };
}
