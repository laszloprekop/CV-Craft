/**
 * Inject Shared Semantic CSS
 *
 * Injects the shared semantic CSS into the document head.
 * This ensures both web preview and PDF use the same CSS rules.
 */

import {
  getBaseCSS,
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

  // Note: getBaseCSS() includes global reset and heading line-height
  // which ensures consistency with PDF rendering
  const css = `
/* === Shared Semantic CSS (from shared/utils/) === */

/* Scope base reset to cv-preview to avoid affecting rest of app */
.cv-preview-content * {
  box-sizing: border-box;
}

.cv-preview-content h1,
.cv-preview-content h2,
.cv-preview-content h3,
.cv-preview-content h4,
.cv-preview-content h5,
.cv-preview-content h6 {
  line-height: var(--heading-line-height, 1.2);
  margin: 0;
}

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
