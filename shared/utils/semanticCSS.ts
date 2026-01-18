/**
 * Shared Semantic CSS Generator
 *
 * Single source of truth for all CV styling.
 * Used by both web preview (frontend) and PDF generator (backend) for consistent styling.
 *
 * All styles use CSS custom properties from generateCSSVariables() for theming.
 * NO hardcoded values - everything flows from CSS variables.
 */

/**
 * Generate base CSS reset and document styles
 */
export function getBaseCSS(): string {
  return `
/* ========================================
   Base Reset and Document Styles
   ======================================== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 210mm;
  font-family: var(--font-family), 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: var(--body-font-size);
  color: var(--text-color);
  line-height: var(--body-line-height, 1.5);
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Typography base */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--heading-font-family), 'Crimson Text', Georgia, serif;
  line-height: var(--heading-line-height, 1.2);
  font-weight: var(--heading-weight, 700);
  page-break-after: avoid;
  break-after: avoid;
}

a {
  color: var(--link-color);
  text-decoration: underline;
}

a:hover {
  color: var(--link-hover-color);
}
`
}

/**
 * Generate CSS for photo/profile image
 * Uses CSS variable --profile-photo-size for consistent sizing between web and PDF
 */
export function getPhotoCSS(): string {
  return `
/* ========================================
   Profile Photo Styles
   ======================================== */
.photo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.profile-photo {
  width: var(--profile-photo-size, 160px);
  height: var(--profile-photo-size, 160px);
  border-radius: var(--profile-photo-border-radius, 50%);
  border: var(--profile-photo-border, none);
  object-fit: cover;
  display: block;
}

.profile-photo-placeholder {
  width: var(--profile-photo-size, 160px);
  height: var(--profile-photo-size, 160px);
  border-radius: var(--profile-photo-border-radius, 50%);
  background-color: var(--muted-color, #e5e5e5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--tiny-font-size);
  color: var(--on-muted-color, #888);
}
`
}

/**
 * Generate CSS for contact information
 * Supports both vertical (sidebar) and horizontal (header) layouts
 */
export function getContactCSS(): string {
  return `
/* ========================================
   Contact Information Styles
   ======================================== */
.contact-info {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: var(--contact-spacing, 8px);
}

.contact-info.horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: var(--contact-spacing, 8px);
  font-size: var(--contact-font-size, var(--small-font-size));
  color: var(--on-secondary-color, #4a3d2a);
}

.contact-item svg {
  flex-shrink: 0;
  width: var(--contact-icon-size, 14px);
  height: var(--contact-icon-size, 14px);
  color: var(--contact-icon-color, var(--on-secondary-color, #4a3d2a));
}

.contact-item a {
  color: inherit;
  text-decoration: none;
}

.contact-item a:hover {
  text-decoration: underline;
}

.break-all {
  word-break: break-all;
}
`
}

/**
 * Generate CSS for name/title header in main content
 */
export function getNameHeaderCSS(): string {
  return `
/* ========================================
   Name and Title Header Styles
   ======================================== */
h1.cv-name,
.main-content > h1 {
  font-family: var(--heading-font-family);
  font-size: var(--name-font-size);
  font-weight: var(--name-font-weight, 700);
  color: var(--name-color, var(--primary-color));
  letter-spacing: var(--name-letter-spacing, 0);
  text-transform: var(--name-text-transform, none);
  margin-bottom: var(--name-margin-bottom, 0.25rem);
}

.job-title,
.main-content > p.job-title {
  font-size: var(--h3-font-size);
  color: var(--accent-color);
  margin-bottom: 1rem;
}
`
}

/**
 * Generate CSS for semantic classes from shared renderer
 * These classes match the HTML structure produced by sectionRenderer.ts
 */
export function getSemanticCSS(): string {
  return `
/* ========================================
   Semantic Classes from Shared Renderer
   Used by both web preview and PDF export
   ======================================== */

/* Section styling */
.cv-section {
  margin-bottom: var(--section-spacing, 1.5rem);
}

.section-header {
  font-family: var(--heading-font-family);
  font-size: var(--section-header-font-size);
  font-weight: var(--section-header-font-weight);
  color: var(--section-header-color);
  text-transform: var(--section-header-text-transform);
  letter-spacing: var(--section-header-letter-spacing);
  border-bottom: var(--section-header-border-bottom);
  border-color: var(--section-header-border-color);
  padding: var(--section-header-padding);
  margin-top: var(--section-header-margin-top);
  margin-bottom: var(--section-header-margin-bottom);
}

.section-content {
  font-size: var(--body-font-size);
  color: var(--text-color);
  line-height: var(--body-line-height, 1.6);
}

/* Entry (job, education, project) styling */
.entry {
  margin-bottom: 1rem;
}

/* Smart pagination groupings for entries */
.entry-start {
  page-break-inside: avoid;
  break-inside: avoid;
}

.entry-bullet-bridge {
  page-break-inside: avoid;
  break-inside: avoid;
}

.entry-description-last {
  margin-bottom: 0.5rem;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.entry-title {
  font-family: var(--heading-font-family);
  font-size: var(--job-title-font-size);
  font-weight: var(--job-title-font-weight);
  color: var(--job-title-color);
  margin: 0;
}

.entry-meta {
  font-size: var(--small-font-size);
  color: var(--text-secondary);
  margin: 0;
}

.entry-company {
  font-size: var(--org-name-font-size);
  font-weight: var(--org-name-font-weight);
  color: var(--org-name-color);
  font-style: var(--org-name-font-style);
}

.entry-date {
  font-size: var(--tiny-font-size);
  color: var(--text-secondary);
}

.entry-location {
  font-size: var(--tiny-font-size);
  color: var(--text-secondary);
}

.entry-description {
  font-size: var(--small-font-size);
  color: var(--on-background-color);
  margin-bottom: 0.5rem;
}

.entry-description p {
  margin: 0 0 0.5rem 0;
}

.entry-description p:last-child {
  margin-bottom: 0;
}

.entry-bullets {
  list-style-type: disc;
  margin-left: var(--bullet-level1-indent, 1.5rem);
  padding-left: 0;
  font-size: var(--small-font-size);
  color: var(--on-background-color);
}

.entry-bullets li {
  margin-bottom: 0.25rem;
}

.entry-bullets li::marker {
  color: var(--bullet-level1-marker-color);
}

/* Skills styling */
.skill-category {
  margin-bottom: 0.75rem;
}

.skill-category-name {
  font-family: var(--heading-font-family);
  font-size: var(--small-font-size);
  font-weight: 600;
  color: var(--text-color);
}

.skill-list {
  font-size: var(--small-font-size);
  color: var(--text-color);
}

.skill-item {
  font-size: var(--small-font-size);
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

/* Skill tags (pill style) - used by both web and PDF */
.skill-category-block {
  margin-bottom: 1rem;
}

.skill-category-title {
  font-family: var(--heading-font-family);
  font-size: var(--small-font-size);
  font-weight: 600;
  color: var(--on-secondary-color, #4a3d2a);
  margin-bottom: 0.5rem;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.skill-tag {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  font-family: var(--heading-font-family);
  font-size: var(--tag-font-size-custom, var(--tag-font-size, 0.75rem));
  font-weight: var(--tag-font-weight, 500);
  background-color: var(--tag-bg-color, rgba(184, 177, 157, 0.72));
  color: var(--tag-text-color, #ffffff);
  border-radius: var(--tag-border-radius, 4em);
  line-height: 1.4;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.skill-inline {
  font-family: var(--font-family);
  font-size: var(--tag-font-size-custom, var(--small-font-size));
  color: var(--on-secondary-color, #4a3d2a);
}

/* Header styling */
.cv-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--accent-color);
}

.cv-name {
  font-family: var(--heading-font-family);
  font-size: var(--name-font-size);
  font-weight: var(--name-font-weight);
  color: var(--name-color);
  letter-spacing: var(--name-letter-spacing);
  text-transform: var(--name-text-transform);
  margin-bottom: var(--name-margin-bottom);
}

.cv-title {
  font-size: var(--h3-font-size);
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.cv-contact {
  display: flex;
  justify-content: center;
  gap: var(--contact-spacing);
  flex-wrap: wrap;
  font-size: var(--contact-font-size);
  color: var(--contact-icon-color);
}

.cv-contact a {
  color: var(--link-color);
  text-decoration: underline;
}

/* Content text */
.content-text {
  font-size: var(--body-font-size);
  color: var(--on-background-color);
  margin-bottom: 0.5rem;
  line-height: var(--body-line-height, 1.6);
}

/* Sidebar-specific overrides (for two-column layout) */
.sidebar .section-content {
  font-size: var(--small-font-size);
}

.sidebar .entry-title {
  font-size: var(--small-font-size);
  font-weight: 600;
}

.sidebar .entry-company,
.sidebar .entry-meta {
  font-size: var(--tiny-font-size);
}

.sidebar .skill-category-name,
.sidebar .skill-category-title,
.sidebar .skill-list,
.sidebar .skill-item,
.sidebar .content-text {
  color: var(--on-secondary-color, #4a3d2a);
}

.sidebar,
.sidebar .section-content,
.sidebar .entry-title,
.sidebar .entry-company,
.sidebar .entry-description,
.sidebar .content-text {
  color: var(--on-secondary-color, #4a3d2a);
}
`
}

/**
 * Generate CSS for two-column layout section headers
 * These override the default section-header styles with colored backgrounds
 */
export function getTwoColumnHeaderCSS(): string {
  return `
/* ========================================
   Two-Column Section Headers
   Colored background style for sidebar/main
   ======================================== */
.sidebar .cv-section > h2.section-header,
.sidebar .sidebar-section > h2.section-header {
  font-family: var(--heading-font-family);
  font-size: var(--h3-font-size);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  margin-top: 8px;
  padding: 4px 12px;
  border-radius: 4px;
  border-bottom: none;
  color: var(--on-tertiary-color, #ffffff);
  background-color: var(--accent-color);
}

.main-content .cv-section > h2.section-header {
  font-family: var(--heading-font-family);
  font-size: var(--h3-font-size);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  margin-top: 12px;
  padding: 4px 12px;
  border-radius: 4px;
  border-bottom: none;
  color: var(--on-primary-color, #ffffff);
  background-color: var(--primary-color);
}

.main-content .cv-section:first-of-type > h2.section-header {
  margin-top: 0;
}
`
}

/**
 * Generate CSS for two-column page layout
 * Handles sidebar and main content column positioning
 */
export function getTwoColumnLayoutCSS(): string {
  return `
/* ========================================
   Two-Column Page Layout
   ======================================== */
.cv-content {
  display: flex;
  width: 210mm;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.two-column-layout {
  display: flex;
  width: 210mm;
  min-height: 100%;
}

.sidebar {
  width: 84mm;
  min-width: 84mm;
  max-width: 84mm;
  padding: var(--page-margin-top, 20mm) 6mm var(--page-margin-bottom, 20mm) var(--page-margin-left, 6mm);
  flex-shrink: 0;
}

.main-content {
  width: 126mm;
  min-width: 126mm;
  max-width: 126mm;
  padding: var(--page-margin-top, 20mm) var(--page-margin-right, 8mm) var(--page-margin-bottom, 20mm) 8mm;
}

/* Single column layout */
.single-column-layout {
  padding: var(--page-margin-top, 20mm) var(--page-margin-right, 15mm) var(--page-margin-bottom, 20mm) var(--page-margin-left, 15mm);
}
`
}

/**
 * Generate CSS for fixed background columns (PDF overlay technique)
 * These create full-height colored columns that repeat on each printed page
 */
export function getFixedBackgroundCSS(sidebarColor: string, mainColor: string): string {
  return `
/* ========================================
   Fixed Background Columns
   For PDF overlay rendering technique
   ======================================== */
.bg-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 84mm;
  height: 100%;
  background-color: ${sidebarColor};
  z-index: -2;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.bg-main {
  position: fixed;
  top: 0;
  left: 84mm;
  width: 126mm;
  height: 100%;
  background-color: ${mainColor};
  z-index: -2;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Alternative naming */
.sidebar-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 84mm;
  height: 100%;
  background-color: ${sidebarColor};
  z-index: -2;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.main-background {
  position: fixed;
  top: 0;
  left: 84mm;
  width: 126mm;
  height: 100%;
  background-color: ${mainColor};
  z-index: -2;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
`
}

/**
 * Generate all CSS for a complete CV document
 * Combines all style modules into a single stylesheet
 */
export function getAllSemanticCSS(options?: {
  includeTwoColumn?: boolean
  sidebarColor?: string
  mainColor?: string
}): string {
  const {
    includeTwoColumn = true,
    sidebarColor = 'var(--surface-color)',
    mainColor = 'var(--background-color)'
  } = options || {}

  let css = getBaseCSS()
  css += getPhotoCSS()
  css += getContactCSS()
  css += getNameHeaderCSS()
  css += getSemanticCSS()

  if (includeTwoColumn) {
    css += getTwoColumnHeaderCSS()
    css += getTwoColumnLayoutCSS()
    css += getFixedBackgroundCSS(sidebarColor, mainColor)
  }

  return css
}
