/** Per-key hit times, kept per warm server instance (same trade-off as the
 *  Spotify token cache — a restart forgets, and that's fine at this scale).
 *  Returns a check that records the hit unless the key is already over. */
export function createRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, number[]>();
  return function isRateLimited(key: string): boolean {
    const now = Date.now();
    const times = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (times.length >= max) return true;
    times.push(now);
    hits.set(key, times);
    return false;
  };
}

/** Last hop only: that entry is appended by our own proxy, while earlier
 *  ones arrive client-supplied and would let a sender rotate rate buckets. */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
    "local"
  );
}
