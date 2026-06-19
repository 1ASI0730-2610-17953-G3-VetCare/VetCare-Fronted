import { API_BASE_URL } from './api-base-url.js';

export function resolveAvatarUrl(avatarUrl, cacheKey = null) {
  if (!avatarUrl) return null;
  const base = avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE_URL}${avatarUrl}`;
  return cacheKey ? `${base}?v=${cacheKey}` : base;
}
