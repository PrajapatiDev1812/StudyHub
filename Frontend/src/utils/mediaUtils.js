/**
 * Resolves a backend media path to a fully-qualified URL.
 * Handles:
 *   - Already-absolute URLs (http/https) → returned as-is
 *   - Relative paths starting with /media/ → prepended with API host
 *   - Other relative paths               → prepended with API host + /media/
 *   - null / undefined                   → returns null
 */
const BACKEND_HOST = 'http://127.0.0.1:8000';

export function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${BACKEND_HOST}${path}`;
  return `${BACKEND_HOST}/media/${path}`;
}
