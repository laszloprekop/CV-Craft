/**
 * Pagination CSS Generator
 *
 * Provides CSS rules for controlling page breaks and content flow
 * in multi-page CV documents. Used by both web preview (for page markers)
 * and PDF export (for actual page breaks).
 *
 * Key principles:
 * - Headers should never be orphaned (stay with following content)
 * - First items in lists should stay with their headers
 * - Allow natural breaks between items for flowing content
 */

/**
 * Generate CSS for @page rule configuration
 */
export function getPageRuleCSS(options?: {
  marginTop?: string
  marginBottom?: string
  marginLeft?: string
  marginRight?: string
}): string {
  const {
    marginTop = '20mm',
    marginBottom = '20mm',
    marginLeft = '0',
    marginRight = '0'
  } = options || {}

  return `
/* ========================================
   Page Configuration
   ======================================== */
@page {
  size: 210mm 297mm;
  margin: ${marginTop} ${marginRight} ${marginBottom} ${marginLeft};
}

@media print {
  html, body {
    width: 210mm;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
}
`
}

/**
 * Generate CSS for pagination control
 * These rules prevent awkward page breaks
 */
export function getPaginationCSS(): string {
  return `
/* ========================================
   Pagination Control Rules
   Prevent orphaned headers and awkward breaks
   ======================================== */

/* Section headers should not be orphaned */
.section-header,
h2.section-header {
  page-break-after: avoid;
  break-after: avoid;
  orphans: 2;
  widows: 2;
}

/* Keep headers with following content */
h1, h2, h3, h4, h5, h6 {
  page-break-after: avoid;
  break-after: avoid;
}

/* Entry start group - header + first content */
.entry-start {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Bridge between description and bullets */
.entry-bullet-bridge {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Sections can break but prefer to stay together */
.cv-section {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Allow long sections to break */
.cv-section.can-break {
  page-break-inside: auto;
  break-inside: auto;
}

/* Individual entries prefer not to break */
.entry {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Allow breaking between bullets after first */
.entry-bullets-continue {
  page-break-inside: auto;
  break-inside: auto;
}

/* Description continuation can break */
.entry-description-continue {
  page-break-inside: auto;
  break-inside: auto;
}

/* Skills should stay together */
.skill-category-block {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Contact info should stay together */
.contact-info {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Photo container should stay together */
.photo-container {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Generic keep-together utility class */
.keep-together {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Orphan and widow control for paragraphs */
p {
  orphans: 2;
  widows: 2;
}

/* Lists control */
ul, ol {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Allow long lists to break */
ul.can-break, ol.can-break {
  page-break-inside: auto;
  break-inside: auto;
}

/* List items prefer not to break */
li {
  page-break-inside: avoid;
  break-inside: avoid;
}
`
}

/**
 * Generate CSS for web preview page markers
 * Visual indicators showing where page breaks would occur
 */
export function getPageMarkersCSS(): string {
  return `
/* ========================================
   Web Preview Page Markers
   Visual indicators for page break positions
   ======================================== */
.page-break-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  z-index: 1000;
  pointer-events: none;
}

.page-break-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 2px dashed #ef4444;
  opacity: 0.7;
}

.page-break-label {
  position: absolute;
  right: 0;
  top: 0;
  transform: translateY(-50%);
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 2px;
  font-family: system-ui, -apple-system, sans-serif;
}
`
}

/**
 * Generate CSS for column break handling (two-column layouts)
 * Handles how content flows between sidebar and main columns
 */
export function getColumnBreakCSS(): string {
  return `
/* ========================================
   Column Break Handling
   For two-column layout content flow
   ======================================== */

/* Sidebar column break behavior */
.sidebar {
  break-after: avoid;
}

/* Main content allows natural breaks */
.main-content {
  break-inside: auto;
}

/* Force column break between sidebar and main */
.column-break {
  break-after: column;
}
`
}

/**
 * Generate CSS for page numbers using CSS @page margin boxes
 * Used for single-column PDF generation via Puppeteer
 */
export function getPageNumberCSS(config?: {
  enabled?: boolean
  position?: string
  format?: string
  fontSize?: string
  fontWeight?: number
  color?: string
  margin?: string
}): string {
  if (!config?.enabled) return ''

  const position = config.position || 'bottom-center'
  const fontSize = config.fontSize || '10px'
  const fontWeight = config.fontWeight || 400
  const color = config.color || '#475569'

  // Map position to @page margin box
  const positionMap: Record<string, string> = {
    'top-left': '@top-left',
    'top-center': '@top-center',
    'top-right': '@top-right',
    'bottom-left': '@bottom-left',
    'bottom-center': '@bottom-center',
    'bottom-right': '@bottom-right',
  }
  const marginBox = positionMap[position] || '@bottom-center'

  return `
/* ========================================
   Page Numbers (CSS @page counters)
   ======================================== */
@page {
  ${marginBox} {
    content: "Page " counter(page) " of " counter(pages);
    font-size: ${fontSize};
    font-weight: ${fontWeight};
    color: ${color};
  }
}
`
}

/**
 * Generate all pagination-related CSS
 */
export function getAllPaginationCSS(options?: {
  includePageMarkers?: boolean
  marginTop?: string
  marginBottom?: string
  marginLeft?: string
  marginRight?: string
  pageNumbers?: {
    enabled?: boolean
    position?: string
    format?: string
    fontSize?: string
    fontWeight?: number
    color?: string
    margin?: string
  }
}): string {
  const {
    includePageMarkers = false,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    pageNumbers
  } = options || {}

  let css = getPageRuleCSS({ marginTop, marginBottom, marginLeft, marginRight })
  css += getPaginationCSS()
  css += getColumnBreakCSS()

  if (includePageMarkers) {
    css += getPageMarkersCSS()
  }

  if (pageNumbers?.enabled) {
    css += getPageNumberCSS(pageNumbers)
  }

  return css
}
