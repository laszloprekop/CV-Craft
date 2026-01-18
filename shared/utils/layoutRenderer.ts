/**
 * Layout Renderer
 *
 * Unified HTML generator for CV documents.
 * Single source of truth for both web preview and PDF export.
 *
 * The ONLY difference between web and PDF is:
 * - Web: columnBreaks = 'css' (CSS handles columns via flexbox)
 * - PDF: columnBreaks = 'actual' (separate column PDFs merged)
 */

import type { CVFrontmatter, CVSection, ParsedCVContent, TemplateConfig } from '../types'
import { generateCSSVariables, generateGoogleFontsURL } from './cssVariableGenerator'
import { renderSections, renderHeader } from './sectionRenderer'
import {
  getBaseCSS,
  getPhotoCSS,
  getContactCSS,
  getNameHeaderCSS,
  getSemanticCSS,
  getTwoColumnHeaderCSS,
  getTwoColumnLayoutCSS,
  getFixedBackgroundCSS
} from './semanticCSS'
import { getAllPaginationCSS } from './paginationCSS'
import { renderContactInfo, CONTACT_ICONS } from './contactRenderer'
import { renderProfilePhoto } from './photoRenderer'

/**
 * Options for generating CV document HTML
 */
export interface CVDocumentOptions {
  /** 'web' for preview, 'pdf' for export */
  mode: 'web' | 'pdf'
  /** Whether to include pagination CSS classes */
  pagination: boolean
  /** How to handle column rendering */
  columnBreaks: 'css' | 'actual'
  /** Whether to generate a complete HTML document (with <html>, <head>, etc.) */
  fullDocument: boolean
  /** Photo data URI (base64) - takes precedence over frontmatter.photo */
  photoDataUri?: string | null
  /** Google Fonts URL for loading custom fonts */
  fontsURL?: string
}

/**
 * Options for rendering a single column (sidebar or main)
 * Used by PDF generator for overlay technique
 */
export interface ColumnRenderOptions {
  column: 'sidebar' | 'main'
  frontmatter: CVFrontmatter
  sections: CVSection[]
  config: TemplateConfig
  photoDataUri?: string | null
  fontsURL?: string
  marginTop?: string
  marginBottom?: string
  marginHorizontal?: string
}

/**
 * Result from document generation
 */
export interface CVDocumentResult {
  /** Generated HTML */
  html: string
  /** Generated CSS (for injection or separate file) */
  css: string
  /** CSS variables as key-value pairs */
  cssVariables: Record<string, string>
}

/**
 * Known sidebar section types (go in left column)
 */
const SIDEBAR_SECTION_TYPES = [
  'skills',
  'languages',
  'interests',
  'tools',
  'certifications',
]

/**
 * Check if a section belongs in the sidebar
 */
export function isSidebarSection(section: CVSection): boolean {
  return SIDEBAR_SECTION_TYPES.some(type =>
    section.title?.toLowerCase().includes(type) || section.type === type
  )
}

/**
 * Split sections into sidebar and main content
 */
export function splitSections(sections: CVSection[]): {
  sidebarSections: CVSection[]
  mainSections: CVSection[]
} {
  const sidebarSections = sections.filter(s => isSidebarSection(s))
  const mainSections = sections.filter(s => !isSidebarSection(s))
  return { sidebarSections, mainSections }
}

/**
 * Render skills section with pill-style tags
 * Handles configurable tag styles (pill vs inline)
 */
export function renderSkillsSection(
  section: CVSection,
  config: TemplateConfig
): string {
  const tagStyle = config?.components?.tags?.style || 'pill'
  const separator = config?.components?.tags?.separator || '·'

  let skillsHTML = ''

  if (Array.isArray(section.content)) {
    // Flatten content: split multi-line strings into individual lines
    const items: any[] = []
    section.content.forEach((item: any) => {
      if (typeof item === 'string' && item.includes('\n')) {
        item.split('\n').forEach((line: string) => {
          if (line.trim()) items.push(line.trim())
        })
      } else {
        items.push(item)
      }
    })

    items.forEach((item: any) => {
      let categoryName: string | null = null
      let skills: string[] = []

      if (typeof item === 'object' && item.category) {
        // Already parsed skill category
        categoryName = item.category
        skills = (item.skills || []).map((skill: any) =>
          typeof skill === 'string'
            ? skill
            : skill.name || skill.text || String(skill)
        )
      } else if (typeof item === 'string') {
        // Try to parse "Category: skill1, skill2" format
        const parsed = parseSkillString(item)
        if (parsed) {
          categoryName = parsed.category
          skills = parsed.skills
        } else {
          // Plain text skill without category
          skillsHTML += `<p class="skill-item">${escapeHtml(item)}</p>`
          return
        }
      }

      if (categoryName && skills.length > 0) {
        if (tagStyle === 'pill') {
          // Pill style: rounded background tags
          const skillTags = skills
            .map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
            .join('')

          skillsHTML += `
          <div class="skill-category-block">
            <h4 class="skill-category-title">${escapeHtml(categoryName)}</h4>
            <div class="skill-tags">${skillTags}</div>
          </div>`
        } else {
          // Inline style: separated text
          const skillList = skills.map(s => escapeHtml(s)).join(
            separator === 'none' ? ' ' : ` ${separator} `
          )

          skillsHTML += `
          <div class="skill-category-block">
            <h4 class="skill-category-title">${escapeHtml(categoryName)}</h4>
            <div class="skill-inline">${skillList}</div>
          </div>`
        }
      }
    })
  }

  return `
  <section class="cv-section sidebar-section" data-type="skills">
    <h2 class="section-header">${escapeHtml(section.title || 'Skills')}</h2>
    <div class="section-content">
      ${skillsHTML}
    </div>
  </section>`
}

/**
 * Parse skill string in format "**Category:** skill1, skill2, skill3"
 */
function parseSkillString(text: string): { category: string; skills: string[] } | null {
  const match = text.match(/^\*{0,2}([^:*]+)\*{0,2}:\s*(.+)$/)
  if (match) {
    const category = match[1].trim()
    const skillsText = match[2].trim()
    const skills = skillsText
      .split(/,\s*/)
      .map(s => s.replace(/\*{2}/g, '').trim())
      .filter(s => s.length > 0)
    return { category, skills }
  }
  return null
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
 * Render sidebar sections with special handling for skills
 */
function renderSidebarSections(
  sections: CVSection[],
  config: TemplateConfig,
  pagination: boolean
): string {
  return sections
    .map(section => {
      const isSkillsSection =
        section.type === 'skills' ||
        section.title?.toLowerCase().includes('skill') ||
        section.title?.toLowerCase().includes('programming')

      if (isSkillsSection) {
        return renderSkillsSection(section, config)
      }
      return renderSections([section], { pagination })
    })
    .join('\n')
}

/**
 * Generate CSS for CV document
 */
export function generateCVCSS(
  config: TemplateConfig,
  options: {
    includeTwoColumn?: boolean
    sidebarColor?: string
    mainColor?: string
    includePageMarkers?: boolean
    marginTop?: string
    marginBottom?: string
  } = {}
): string {
  const {
    includeTwoColumn = true,
    sidebarColor,
    mainColor,
    includePageMarkers = false,
    marginTop,
    marginBottom
  } = options

  const cssVariables = generateCSSVariables(config)
  const cssVars = Object.entries(cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ')

  // Resolve colors from config if not provided
  const resolvedSidebarColor = sidebarColor ||
    cssVariables['--surface-color'] ||
    config.colors.secondary ||
    '#f5f0e8'
  const resolvedMainColor = mainColor ||
    cssVariables['--background-color'] ||
    config.colors.background ||
    '#ffffff'

  let css = `
:root {
  ${cssVars}
}
`
  css += getBaseCSS()
  css += getPhotoCSS()
  css += getContactCSS()
  css += getNameHeaderCSS()
  css += getSemanticCSS()
  css += getAllPaginationCSS({
    includePageMarkers,
    marginTop: marginTop || cssVariables['--page-margin-top'],
    marginBottom: marginBottom || cssVariables['--page-margin-bottom']
  })

  if (includeTwoColumn) {
    css += getTwoColumnHeaderCSS()
    css += getTwoColumnLayoutCSS()
    css += getFixedBackgroundCSS(resolvedSidebarColor, resolvedMainColor)
  }

  return css
}

/**
 * Generate two-column layout body HTML
 * Used by both web preview and PDF export
 */
export function generateTwoColumnBody(
  frontmatter: CVFrontmatter,
  sidebarSections: CVSection[],
  mainSections: CVSection[],
  config: TemplateConfig,
  options: {
    photoDataUri?: string | null
    pagination?: boolean
  } = {}
): string {
  const { photoDataUri, pagination = false } = options

  // Photo
  const photoHTML = renderProfilePhoto(photoDataUri, frontmatter.photo)

  // Contact info
  const contactHTML = renderContactInfo(frontmatter, {
    layout: 'vertical',
    showIcons: true,
    linkable: true
  })

  // Sidebar sections
  const sidebarHTML = renderSidebarSections(sidebarSections, config, pagination)

  // Main sections
  const mainHTML = renderSections(mainSections, { pagination })

  return `
<div class="cv-content">
  <div class="sidebar-container sidebar">
    ${photoHTML}
    ${contactHTML}
    ${sidebarHTML}
  </div>
  <div class="main-content">
    <h1>${escapeHtml(frontmatter.name || 'Your Name')}</h1>
    ${frontmatter.title ? `<p class="job-title">${escapeHtml(frontmatter.title)}</p>` : ''}
    ${mainHTML}
  </div>
</div>`
}

/**
 * Generate single-column layout body HTML
 * Used for minimal/clean templates
 */
export function generateSingleColumnBody(
  frontmatter: CVFrontmatter,
  sections: CVSection[],
  config: TemplateConfig,
  options: {
    pagination?: boolean
  } = {}
): string {
  const { pagination = false } = options

  const headerHTML = renderHeader(frontmatter)
  const contentHTML = renderSections(sections, { pagination })

  return `
<div class="cv-content single-column-layout">
  ${headerHTML}
  ${contentHTML}
</div>`
}

/**
 * Generate complete CV HTML document
 *
 * @param content - Parsed CV content (frontmatter + sections)
 * @param config - Template configuration
 * @param options - Document generation options
 * @returns Complete HTML document string
 */
export function generateCVDocument(
  content: ParsedCVContent,
  config: TemplateConfig,
  options: CVDocumentOptions
): CVDocumentResult {
  const {
    mode,
    pagination,
    columnBreaks,
    fullDocument,
    photoDataUri,
    fontsURL = ''
  } = options

  const cssVariables = generateCSSVariables(config)
  const { frontmatter, sections } = content

  // Determine layout type (could be from template name or config)
  const useTwoColumn = true // Default to two-column for now

  // Resolve background colors
  const sidebarColor = cssVariables['--surface-color'] || config.colors.secondary || '#f5f0e8'
  const mainColor = cssVariables['--background-color'] || config.colors.background || '#ffffff'

  // Generate CSS
  const css = generateCVCSS(config, {
    includeTwoColumn: useTwoColumn,
    sidebarColor,
    mainColor,
    includePageMarkers: mode === 'web' && pagination
  })

  // Generate body HTML
  let bodyHTML: string
  if (useTwoColumn) {
    const { sidebarSections, mainSections } = splitSections(sections)
    bodyHTML = generateTwoColumnBody(
      frontmatter,
      sidebarSections,
      mainSections,
      config,
      { photoDataUri, pagination }
    )

    // Add fixed background divs for two-column layout
    if (columnBreaks === 'css') {
      bodyHTML = `
<div class="bg-sidebar"></div>
<div class="bg-main"></div>
${bodyHTML}`
    }
  } else {
    bodyHTML = generateSingleColumnBody(frontmatter, sections, config, { pagination })
  }

  // Return body-only if not full document
  if (!fullDocument) {
    return {
      html: bodyHTML,
      css,
      cssVariables
    }
  }

  // Generate full HTML document
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(frontmatter.name || 'CV')}</title>
  ${fontsURL ? `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsURL}" rel="stylesheet">` : ''}
  <style>
${css}
  </style>
</head>
<body>
  ${bodyHTML}
  <script>
    document.fonts.ready.then(function() {
      document.body.classList.add('fonts-loaded');
    });
  </script>
</body>
</html>`

  return {
    html,
    css,
    cssVariables
  }
}

/**
 * Generate HTML for a single column (for PDF overlay technique)
 * This renders just one column (sidebar or main) for separate PDF generation
 */
export function generateColumnHTML(options: ColumnRenderOptions): string {
  const {
    column,
    frontmatter,
    sections,
    config,
    photoDataUri,
    fontsURL = '',
    marginTop = '20mm',
    marginBottom = '20mm',
    marginHorizontal = '6mm'
  } = options

  const cssVariables = generateCSSVariables(config)
  const cssVars = Object.entries(cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n      ')

  // Column-specific dimensions
  const columnWidth = column === 'sidebar' ? '84mm' : '126mm'
  const columnLeft = column === 'sidebar' ? '0' : '84mm'
  const innerPadding = column === 'sidebar'
    ? `0 6mm 0 ${marginHorizontal}`
    : `0 ${marginHorizontal} 0 8mm`

  // Generate content
  let contentHTML = ''
  if (column === 'sidebar') {
    // Photo
    contentHTML += renderProfilePhoto(photoDataUri, frontmatter.photo)

    // Contact info
    contentHTML += renderContactInfo(frontmatter, {
      layout: 'vertical',
      showIcons: true,
      linkable: true
    })

    // Sidebar sections
    contentHTML += renderSidebarSections(sections, config, true)
  } else {
    // Main column
    contentHTML += `<h1>${escapeHtml(frontmatter.name || 'Your Name')}</h1>`
    if (frontmatter.title) {
      contentHTML += `<p class="job-title">${escapeHtml(frontmatter.title)}</p>`
    }
    contentHTML += renderSections(sections, { pagination: true })
  }

  // Full CSS for column
  let css = getBaseCSS()
  css += getPhotoCSS()
  css += getContactCSS()
  css += getNameHeaderCSS()
  css += getSemanticCSS()
  css += getTwoColumnHeaderCSS()

  const bgColor = column === 'sidebar'
    ? (cssVariables['--surface-color'] || config.colors.secondary || '#f5f0e8')
    : (cssVariables['--background-color'] || config.colors.background || '#ffffff')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CV - ${column}</title>
  ${fontsURL ? `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsURL}" rel="stylesheet">` : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root { ${cssVars} }

    @page {
      size: 210mm 297mm;
      margin: ${marginTop} 0 ${marginBottom} 0;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      font-family: var(--font-family), 'IBM Plex Sans', -apple-system, sans-serif;
      font-size: var(--body-font-size);
      color: var(--text-color);
      line-height: 1.5;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .column-container {
      position: absolute;
      left: ${columnLeft};
      top: 0;
      width: ${columnWidth};
      min-height: 100%;
      background: transparent;
    }

    .column-content {
      padding: ${innerPadding};
      color: ${column === 'sidebar' ? 'var(--on-secondary-color, #4a3d2a)' : 'var(--text-color)'};
    }

    ${css}
  </style>
</head>
<body>
  <div class="column-container">
    <div class="column-content ${column === 'main' ? 'main-content' : 'sidebar'}">
      ${contentHTML}
    </div>
  </div>
  <script>
    document.fonts.ready.then(() => document.body.classList.add('fonts-loaded'));
  </script>
</body>
</html>`
}

/**
 * Generate background-only PDF HTML (two-column colors)
 */
export function generateBackgroundHTML(sidebarColor: string, mainColor: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; }
    @page { size: 210mm 297mm; margin: 0; }
    html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; }
    .bg { display: flex; width: 210mm; height: 297mm; }
    .sidebar-bg { width: 84mm; height: 297mm; background: ${sidebarColor}; }
    .main-bg { width: 126mm; height: 297mm; background: ${mainColor}; }
  </style>
</head>
<body>
  <div class="bg">
    <div class="sidebar-bg"></div>
    <div class="main-bg"></div>
  </div>
</body>
</html>`
}

// Re-export icons for convenience
export { CONTACT_ICONS }
