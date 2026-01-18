/**
 * Inject Shared Semantic CSS
 *
 * Injects the shared semantic CSS into the document head.
 * This ensures both web preview and PDF use the same CSS rules.
 */

import {
  getSemanticCSS,
  getTwoColumnHeaderCSS,
  getPhotoCSS,
  getContactCSS,
  getNameHeaderCSS,
  getTwoColumnLayoutCSS
} from '../../../shared/utils/semanticCSS'
import { getPaginationCSS, getPageMarkersCSS } from '../../../shared/utils/paginationCSS'

let injected = false

/**
 * Inject the shared semantic CSS into the document head.
 * Safe to call multiple times - only injects once.
 */
export function injectSemanticCSS(): void {
  if (injected || typeof document === 'undefined') return

  const css = `
/* === Shared Semantic CSS (from shared/utils/) === */
${getSemanticCSS()}
${getTwoColumnHeaderCSS()}
${getPhotoCSS()}
${getContactCSS()}
${getNameHeaderCSS()}
${getTwoColumnLayoutCSS()}
${getPaginationCSS()}
${getPageMarkersCSS()}
`

  const style = document.createElement('style')
  style.id = 'shared-semantic-css'
  style.textContent = css
  document.head.appendChild(style)

  injected = true
}
