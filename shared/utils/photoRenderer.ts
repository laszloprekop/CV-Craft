/**
 * Photo Renderer
 *
 * Generates HTML for profile photos.
 * Used by both web preview and PDF export for consistent rendering.
 * Uses CSS variable --profile-photo-size for sizing.
 */

export interface PhotoRenderOptions {
  /** Data URI or URL for the photo */
  src: string | null | undefined
  /** Alt text for accessibility */
  alt?: string
  /** Additional CSS classes */
  className?: string
  /** Placeholder text when no photo */
  placeholderText?: string
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * Render profile photo HTML
 *
 * @param options - Photo rendering options
 * @returns HTML string with photo container
 */
export function renderPhoto(options: PhotoRenderOptions): string {
  const {
    src,
    alt = 'Profile',
    className = '',
    placeholderText = 'Photo'
  } = options

  const containerClass = `photo-container${className ? ' ' + className : ''}`

  if (src) {
    return `<div class="${containerClass}"><img src="${escapeHtml(src)}" class="profile-photo" alt="${escapeHtml(alt)}" /></div>`
  }

  return `<div class="${containerClass}"><div class="profile-photo-placeholder">${escapeHtml(placeholderText)}</div></div>`
}

/**
 * Render profile photo with frontmatter fallback
 * Prefers dataUri over frontmatter.photo URL
 *
 * @param dataUri - Base64 data URI (from backend asset storage)
 * @param frontmatterPhoto - Photo URL from markdown frontmatter
 * @param options - Additional rendering options
 * @returns HTML string
 */
export function renderProfilePhoto(
  dataUri: string | null | undefined,
  frontmatterPhoto: string | undefined,
  options: Omit<PhotoRenderOptions, 'src'> = {}
): string {
  const src = dataUri || frontmatterPhoto || null
  return renderPhoto({ ...options, src })
}
