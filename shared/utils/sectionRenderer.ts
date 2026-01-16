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
 */
function renderSection(section: CVSection, pagination: boolean, prefix: string): string {
  const pagClass = pagination ? ' keep-together' : ''
  const sectionClass = `${prefix}cv-section${pagClass}`.trim()

  return `
<section class="${sectionClass}" data-type="${section.type}"${pagination ? ' style="break-inside: avoid;"' : ''}>
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
 */
function renderEntry(entry: any, pagination: boolean, prefix: string): string {
  if (typeof entry !== 'object') {
    return `<p class="${prefix}content-text">${escapeHtml(String(entry))}</p>`
  }

  const pagClass = pagination ? ' keep-together' : ''
  const entryClass = `${prefix}entry${pagClass}`.trim()

  return `
<article class="${entryClass}"${pagination ? ' style="break-inside: avoid;"' : ''}>
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
