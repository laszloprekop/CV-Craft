/**
 * Shared Section Renderer
 *
 * Converts parsed CV sections into semantic HTML with classes.
 * Used by both web preview and PDF generator for consistent rendering.
 */

import type { CVSection, CVFrontmatter } from '../types'

export interface RenderOptions {
  /** Whether to include pagination classes (for PDF) */
  pagination?: boolean
  /** CSS class prefix for scoping */
  classPrefix?: string
}

/**
 * Render sections to semantic HTML
 */
export function renderSections(sections: CVSection[], options: RenderOptions = {}): string {
  const { pagination = false, classPrefix = '' } = options

  return sections.map(section => renderSection(section, pagination, classPrefix)).join('\n')
}

/**
 * Render a single section
 *
 * Note: Sections themselves don't have keep-together; individual entries handle
 * pagination with smart groupings (entry-start, entry-bullet-bridge).
 */
function renderSection(section: CVSection, pagination: boolean, prefix: string): string {
  const sectionClass = `${prefix}cv-section`

  return `
<section class="${sectionClass}" data-type="${section.type}">
  <h2 class="${prefix}section-header">${escapeHtml(section.title || '')}</h2>
  <div class="${prefix}section-content">
    ${renderSectionContent(section, pagination, prefix)}
  </div>
</section>`.trim()
}

/**
 * Render section content based on type
 */
function renderSectionContent(section: CVSection, pagination: boolean, prefix: string): string {
  const { type, content } = section

  // Handle string content
  if (typeof content === 'string') {
    return `<p class="${prefix}content-text">${escapeHtml(content)}</p>`
  }

  // Handle array content
  if (!Array.isArray(content)) {
    return ''
  }

  // Structured sections (experience, education, projects)
  if (type === 'experience' || type === 'education' || type === 'projects') {
    return content.map(entry => renderEntry(entry, pagination, prefix)).join('\n')
  }

  // Skills section
  if (type === 'skills') {
    return renderSkills(content, prefix)
  }

  // Simple list sections (languages, interests, etc.)
  return content.map(item => {
    if (typeof item === 'string') {
      return `<p class="${prefix}content-text">${escapeHtml(item)}</p>`
    }
    return ''
  }).join('\n')
}

/**
 * Render an entry (job, education, project)
 *
 * For pagination mode, creates smart groupings to prevent awkward breaks:
 * - entry-start: keeps header + first 2 paragraphs together (prevents orphaned headers)
 * - entry-bullet-bridge: keeps last description paragraph + first bullet together
 */
function renderEntry(entry: any, pagination: boolean, prefix: string): string {
  if (typeof entry !== 'object') {
    return `<p class="${prefix}content-text">${escapeHtml(String(entry))}</p>`
  }

  const entryClass = `${prefix}entry`

  // For non-pagination mode, use simple structure
  if (!pagination) {
    return `
<article class="${entryClass}">
  ${entry.title ? `
  <div class="${prefix}entry-header">
    <h3 class="${prefix}entry-title">${escapeHtml(entry.title)}</h3>
    ${renderEntryMeta(entry, prefix)}
  </div>` : ''}
  ${entry.description ? `
  <div class="${prefix}entry-description">
    ${renderDescription(entry.description, prefix)}
  </div>` : ''}
  ${entry.bullets && entry.bullets.length > 0 ? `
  <ul class="${prefix}entry-bullets">
    ${entry.bullets.map((bullet: any) =>
      `<li>${escapeHtml(typeof bullet === 'string' ? bullet : bullet.text || '')}</li>`
    ).join('\n    ')}
  </ul>` : ''}
</article>`.trim()
  }

  // For pagination mode, create smart groupings
  return renderEntryWithPagination(entry, prefix)
}

/**
 * Render entry with smart pagination groupings
 *
 * Structure:
 * - entry-start: header + first 2 description paragraphs (keep together)
 * - entry-description-continue: middle paragraphs (can break)
 * - entry-bullet-bridge: last description paragraph + first bullet (keep together)
 * - entry-bullets-continue: remaining bullets (can break)
 */
function renderEntryWithPagination(entry: any, prefix: string): string {
  const entryClass = `${prefix}entry`

  // Parse description into paragraphs
  const descParagraphs = entry.description
    ? entry.description.split('\n\n').filter((p: string) => p.trim())
    : []

  // Parse bullets
  const bullets = entry.bullets || []
  const hasBullets = bullets.length > 0

  // Determine which paragraphs go where
  const startParagraphs = descParagraphs.slice(0, 2) // First 2 paragraphs in entry-start
  const middleParagraphs = descParagraphs.length > 3 ? descParagraphs.slice(2, -1) : [] // Middle paragraphs
  const lastParagraph = descParagraphs.length > 2 ? descParagraphs[descParagraphs.length - 1] : null // Last paragraph for bridge

  // If only 1-2 paragraphs, they all go in entry-start, no bridge needed for description
  const needsBridge = hasBullets && (descParagraphs.length > 2 || descParagraphs.length > 0)
  const bridgeParagraph = needsBridge
    ? (lastParagraph || (descParagraphs.length <= 2 && descParagraphs.length > 0 ? descParagraphs[descParagraphs.length - 1] : null))
    : null

  // First bullet goes in bridge (if we have bullets)
  const firstBullet = hasBullets ? bullets[0] : null
  const remainingBullets = hasBullets ? bullets.slice(1) : []

  let html = `<article class="${entryClass}">\n`

  // Group 1: Entry Start (header + first 2 paragraphs) - KEEP TOGETHER
  html += `  <div class="${prefix}entry-start">\n`

  if (entry.title) {
    html += `    <div class="${prefix}entry-header">
      <h3 class="${prefix}entry-title">${escapeHtml(entry.title)}</h3>
      ${renderEntryMeta(entry, prefix)}
    </div>\n`
  }

  if (startParagraphs.length > 0) {
    // If we don't need a bridge (no bullets or description is short), include all desc here
    const paragraphsForStart = needsBridge && descParagraphs.length > 2
      ? startParagraphs
      : (needsBridge ? descParagraphs.slice(0, -1) : descParagraphs) // Leave last for bridge if needed

    if (paragraphsForStart.length > 0) {
      html += `    <div class="${prefix}entry-description">\n`
      paragraphsForStart.forEach((p: string) => {
        html += `      <p>${escapeHtml(p)}</p>\n`
      })
      html += `    </div>\n`
    }
  }

  html += `  </div>\n` // Close entry-start

  // Middle paragraphs (can break freely)
  if (middleParagraphs.length > 0) {
    html += `  <div class="${prefix}entry-description ${prefix}entry-description-continue">\n`
    middleParagraphs.forEach((p: string) => {
      html += `    <p>${escapeHtml(p)}</p>\n`
    })
    html += `  </div>\n`
  }

  // Group 2: Bullet Bridge (last paragraph + first bullet) - KEEP TOGETHER
  if (hasBullets) {
    html += `  <div class="${prefix}entry-bullet-bridge">\n`

    // Include last paragraph in bridge if we have multiple paragraphs
    if (bridgeParagraph && descParagraphs.length > 2) {
      html += `    <p class="${prefix}entry-description-last">${escapeHtml(bridgeParagraph)}</p>\n`
    }

    // First bullet
    html += `    <ul class="${prefix}entry-bullets">\n`
    html += `      <li>${escapeHtml(typeof firstBullet === 'string' ? firstBullet : firstBullet.text || '')}</li>\n`
    html += `    </ul>\n`

    html += `  </div>\n` // Close entry-bullet-bridge
  }

  // Remaining bullets (can break freely)
  if (remainingBullets.length > 0) {
    html += `  <ul class="${prefix}entry-bullets ${prefix}entry-bullets-continue">\n`
    remainingBullets.forEach((bullet: any) => {
      html += `    <li>${escapeHtml(typeof bullet === 'string' ? bullet : bullet.text || '')}</li>\n`
    })
    html += `  </ul>\n`
  }

  html += `</article>`

  return html.trim()
}

/**
 * Render entry metadata (company, date, location)
 */
function renderEntryMeta(entry: any, prefix: string): string {
  const parts: string[] = []

  if (entry.company) {
    parts.push(`<span class="${prefix}entry-company">${escapeHtml(entry.company)}</span>`)
  }

  if (entry.date) {
    parts.push(`<span class="${prefix}entry-date">${escapeHtml(entry.date)}</span>`)
  }

  if (entry.location) {
    parts.push(`<span class="${prefix}entry-location">${escapeHtml(entry.location)}</span>`)
  }

  if (parts.length === 0) return ''

  return `<p class="${prefix}entry-meta">${parts.join(' | ')}</p>`
}

/**
 * Render description with paragraph breaks
 */
function renderDescription(description: string, prefix: string): string {
  if (!description) return ''

  // Split on double newlines for paragraphs
  const paragraphs = description.split('\n\n').filter(p => p.trim())

  if (paragraphs.length === 1) {
    return `<p>${escapeHtml(paragraphs[0])}</p>`
  }

  return paragraphs.map(para =>
    `<p>${escapeHtml(para)}</p>`
  ).join('\n')
}

/**
 * Render skills section
 */
function renderSkills(skills: any[], prefix: string): string {
  return skills.map(skill => {
    if (typeof skill === 'string') {
      return `<p class="${prefix}skill-item">${escapeHtml(skill)}</p>`
    }

    if (typeof skill === 'object' && skill.category) {
      return `
<div class="${prefix}skill-category">
  <strong class="${prefix}skill-category-name">${escapeHtml(skill.category)}:</strong>
  <span class="${prefix}skill-list">${skill.skills.map((s: string) => escapeHtml(s)).join(', ')}</span>
</div>`.trim()
    }

    return ''
  }).join('\n')
}

/**
 * Render frontmatter header
 */
export function renderHeader(frontmatter: CVFrontmatter, prefix: string = ''): string {
  return `
<header class="${prefix}cv-header">
  <h1 class="${prefix}cv-name">${escapeHtml(frontmatter.name || '')}</h1>
  ${frontmatter.title ? `<p class="${prefix}cv-title">${escapeHtml(frontmatter.title)}</p>` : ''}
  <div class="${prefix}cv-contact">
    ${frontmatter.email ? `<a href="mailto:${escapeHtml(frontmatter.email)}" class="${prefix}contact-email">${escapeHtml(frontmatter.email)}</a>` : ''}
    ${frontmatter.phone ? `<span class="${prefix}contact-phone">${escapeHtml(frontmatter.phone)}</span>` : ''}
    ${frontmatter.location ? `<span class="${prefix}contact-location">${escapeHtml(frontmatter.location)}</span>` : ''}
    ${frontmatter.linkedin ? `<a href="${escapeHtml(frontmatter.linkedin)}" class="${prefix}contact-linkedin">LinkedIn</a>` : ''}
    ${frontmatter.github ? `<a href="${escapeHtml(frontmatter.github)}" class="${prefix}contact-github">GitHub</a>` : ''}
  </div>
</header>`.trim()
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
