/**
 * Inject Shared Semantic CSS
 *
 * Injects the shared semantic CSS into the document head.
 * This ensures both web preview and PDF use the same CSS rules.
 */

import { getSemanticCSS, getTwoColumnHeaderCSS } from '../../../shared/utils/semanticCSS'

let injected = false

/**
 * Inject the shared semantic CSS into the document head.
 * Safe to call multiple times - only injects once.
 */
export function injectSemanticCSS(): void {
  if (injected || typeof document === 'undefined') return

  const css = `
${getSemanticCSS()}
${getTwoColumnHeaderCSS()}
`

  const style = document.createElement('style')
  style.id = 'shared-semantic-css'
  style.textContent = css
  document.head.appendChild(style)

  injected = true
}
