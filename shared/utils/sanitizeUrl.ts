/**
 * URL Sanitization Utility
 *
 * Prevents XSS via dangerous URL protocols (javascript:, vbscript:, data:).
 * Used by both frontend and backend renderers.
 */

const BLOCKED_PROTOCOLS = /^\s*(javascript|vbscript|data)\s*:/i

const ALLOWED_PROTOCOLS = /^(https?:|mailto:|tel:)/i

/**
 * Sanitize a URL by blocking dangerous protocols.
 * Returns '#' for blocked URLs, the original URL otherwise.
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '#'

  const trimmed = url.trim()

  if (BLOCKED_PROTOCOLS.test(trimmed)) {
    return '#'
  }

  // Allow known safe protocols and relative URLs
  if (ALLOWED_PROTOCOLS.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('.')) {
    return trimmed
  }

  // URLs without protocol prefix - allow if they don't match blocked patterns
  // (e.g. "example.com", "path/to/page")
  if (!trimmed.includes(':')) {
    return trimmed
  }

  // Unknown protocol - block it
  return '#'
}
