/**
 * Contact Information Renderer
 *
 * Generates HTML for contact information with icons.
 * Used by both web preview and PDF export for consistent rendering.
 */

import type { CVFrontmatter } from '../types'

// SVG Icons for contact information
// Source: @phosphor-icons/react v2.1.10 — regular weight
// Extracted from node_modules/@phosphor-icons/react/dist/defs/*.es.js
// To update: check the "regular" entry in each icon's defs file
export const CONTACT_ICONS = {
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46ZM176,208A128.14,128.14,0,0,1,48,80,40.2,40.2,0,0,1,82.87,40a.61.61,0,0,0,0,.12l21,47L83.2,111.86a6.13,6.13,0,0,0-.57.77,16,16,0,0,0-1,15.7c9.06,18.53,27.73,37.06,46.46,46.11a16,16,0,0,0,15.75-1.14,8.44,8.44,0,0,0,.74-.56L168.89,152l47,21.05h0s.08,0,.11,0A40.21,40.21,0,0,1,176,208Z"></path></svg>`,
  email: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-96,85.15L52.57,64H203.43ZM98.71,128,40,181.81V74.19Zm11.84,10.85,12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128,216,74.18V181.82Z"></path></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24Zm0,192H40V40H216V216ZM96,112v64a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm88,28v36a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140ZM100,84A12,12,0,1,1,88,72,12,12,0,0,1,100,84Z"></path></svg>`,
  github: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M208.31,75.68A59.78,59.78,0,0,0,202.93,28,8,8,0,0,0,196,24a59.75,59.75,0,0,0-48,24H124A59.75,59.75,0,0,0,76,24a8,8,0,0,0-6.93,4,59.78,59.78,0,0,0-5.38,47.68A58.14,58.14,0,0,0,56,104v8a56.06,56.06,0,0,0,48.44,55.47A39.8,39.8,0,0,0,96,192v8H72a24,24,0,0,1-24-24A40,40,0,0,0,8,136a8,8,0,0,0,0,16,24,24,0,0,1,24,24,40,40,0,0,0,40,40H96v16a8,8,0,0,0,16,0V192a24,24,0,0,1,48,0v40a8,8,0,0,0,16,0V192a39.8,39.8,0,0,0-8.44-24.53A56.06,56.06,0,0,0,216,112v-8A58.14,58.14,0,0,0,208.31,75.68ZM200,112a40,40,0,0,1-40,40H112a40,40,0,0,1-40-40v-8a41.74,41.74,0,0,1,6.9-22.48A8,8,0,0,0,80,73.83a43.81,43.81,0,0,1,.79-33.58,43.88,43.88,0,0,1,32.32,20.06A8,8,0,0,0,119.82,64h32.35a8,8,0,0,0,6.74-3.69,43.87,43.87,0,0,1,32.32-20.06A43.81,43.81,0,0,1,192,73.83a8.09,8.09,0,0,0,1,7.65A41.72,41.72,0,0,1,200,104Z"></path></svg>`,
  globe: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24h0A104,104,0,1,0,232,128,104.12,104.12,0,0,0,128,24Zm88,104a87.61,87.61,0,0,1-3.33,24H174.16a157.44,157.44,0,0,0,0-48h38.51A87.61,87.61,0,0,1,216,128ZM102,168H154a115.11,115.11,0,0,1-26,45A115.27,115.27,0,0,1,102,168Zm-3.9-16a140.84,140.84,0,0,1,0-48h59.88a140.84,140.84,0,0,1,0,48ZM40,128a87.61,87.61,0,0,1,3.33-24H81.84a157.44,157.44,0,0,0,0,48H43.33A87.61,87.61,0,0,1,40,128ZM154,88H102a115.11,115.11,0,0,1,26-45A115.27,115.27,0,0,1,154,88Zm52.33,0H170.71a135.28,135.28,0,0,0-22.3-45.6A88.29,88.29,0,0,1,206.37,88ZM107.59,42.4A135.28,135.28,0,0,0,85.29,88H49.63A88.29,88.29,0,0,1,107.59,42.4ZM49.63,168H85.29a135.28,135.28,0,0,0,22.3,45.6A88.29,88.29,0,0,1,49.63,168Zm98.78,45.6a135.28,135.28,0,0,0,22.3-45.6h35.66A88.29,88.29,0,0,1,148.41,213.6Z"></path></svg>`,
  location: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path></svg>`,
}

export interface ContactRenderOptions {
  /** Layout direction: 'vertical' for sidebar, 'horizontal' for header */
  layout?: 'vertical' | 'horizontal'
  /** Whether to show icons */
  showIcons?: boolean
  /** Whether to make links clickable */
  linkable?: boolean
  /** Additional CSS classes for the container */
  className?: string
}

/**
 * Contact info field definition
 */
interface ContactField {
  key: keyof typeof CONTACT_ICONS
  value: string | undefined
  urlPrefix?: string
  displayTransform?: (value: string) => string
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
 * Strip URL protocol for display
 */
function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

/**
 * Render contact information as HTML
 *
 * @param frontmatter - CV frontmatter containing contact fields
 * @param options - Rendering options
 * @returns HTML string of contact information
 */
export function renderContactInfo(
  frontmatter: CVFrontmatter,
  options: ContactRenderOptions = {}
): string {
  const {
    layout = 'vertical',
    showIcons = true,
    linkable = true,
    className = ''
  } = options

  // Define contact fields in display order
  const fields: ContactField[] = [
    { key: 'phone', value: frontmatter.phone },
    { key: 'email', value: frontmatter.email, urlPrefix: 'mailto:' },
    { key: 'linkedin', value: frontmatter.linkedin, urlPrefix: '', displayTransform: stripProtocol },
    { key: 'github', value: frontmatter.github, urlPrefix: '', displayTransform: stripProtocol },
    { key: 'globe', value: frontmatter.website, urlPrefix: '', displayTransform: stripProtocol },
    { key: 'location', value: frontmatter.location },
  ]

  // Filter to only fields with values
  const activeFields = fields.filter(f => f.value && f.value.trim())

  if (activeFields.length === 0) {
    return ''
  }

  const containerClass = `contact-info${layout === 'horizontal' ? ' horizontal' : ''}${className ? ' ' + className : ''}`

  const items = activeFields.map(field => {
    const icon = showIcons ? CONTACT_ICONS[field.key] : ''
    const displayValue = field.displayTransform
      ? field.displayTransform(field.value!)
      : field.value!

    const escapedValue = escapeHtml(displayValue)

    // Determine if this should be a link
    const isLink = linkable && (
      field.urlPrefix !== undefined ||
      field.key === 'linkedin' ||
      field.key === 'github' ||
      field.key === 'globe'
    )

    let content: string
    if (isLink) {
      const href = field.urlPrefix !== undefined
        ? field.urlPrefix + field.value!
        : field.value!
      // For URLs that might need break-all for wrapping
      const needsBreakAll = field.key === 'email' || field.key === 'linkedin' || field.key === 'github' || field.key === 'globe'
      content = `<a href="${escapeHtml(href)}"${needsBreakAll ? ' class="break-all"' : ''}>${escapedValue}</a>`
    } else {
      content = `<span>${escapedValue}</span>`
    }

    return `<div class="contact-item">${icon}${content}</div>`
  })

  return `<div class="${containerClass}">${items.join('')}</div>`
}

/**
 * Get just the icons object (for compatibility with existing code)
 */
export function getContactIcons() {
  return CONTACT_ICONS
}
