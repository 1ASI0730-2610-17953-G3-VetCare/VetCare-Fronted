export const DEFAULT_CACHE_TTL_MS = 60_000;

export function isCacheStale(lastFetchedAt, ttlMs = DEFAULT_CACHE_TTL_MS) {
  if (!lastFetchedAt) return true;
  return Date.now() - lastFetchedAt > ttlMs;
}

export function hasFreshCache(lastFetchedAt, hasData, ttlMs = DEFAULT_CACHE_TTL_MS) {
  return Boolean(hasData) && !isCacheStale(lastFetchedAt, ttlMs);
}
