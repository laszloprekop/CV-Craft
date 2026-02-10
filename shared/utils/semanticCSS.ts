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
 * Uses CSS variables for consistent sizing between web and PDF
 */
export function getPhotoCSS(): string {
  return `
/* ========================================
   Profile Photo Styles
   ======================================== */
.photo-container {
  display: flex;
  justify-content: var(--profile-photo-position, center);
  margin-top: var(--profile-photo-margin-top, 0px);
  margin-bottom: var(--profile-photo-margin-bottom, 16px);
  margin-left: var(--profile-photo-margin-left, 0px);
  margin-right: var(--profile-photo-margin-right, 0px);
}

.profile-photo {
  width: var(--profile-photo-size, 160px);
  height: var(--profile-photo-size, 160px);
  border-radius: var(--profile-photo-border-radius, 50%);
  border-width: var(--profile-photo-border-width, 3px);
  border-style: var(--profile-photo-border-style, solid);
  border-color: var(--profile-photo-border-color, #e2e8f0);
  object-fit: cover;
  display: block;
  box-shadow: var(--profile-photo-shadow, none);
  opacity: var(--profile-photo-opacity, 1);
  filter: var(--profile-photo-filter, none);
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
  box-shadow: var(--profile-photo-shadow, none);
  opacity: var(--profile-photo-opacity, 1);
  filter: var(--profile-photo-filter, none);
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
  text-align: var(--name-alignment, left);
  line-height: var(--name-line-height, 1.2);
  font-style: var(--name-font-style, normal);
  margin-top: var(--name-margin-top, 0);
  margin-bottom: var(--name-margin-bottom, 0.25rem);
  margin-left: var(--name-margin-left, 0px);
  margin-right: var(--name-margin-right, 0px);
  padding: var(--name-padding, 0);
  background-color: var(--name-background-color, transparent);
  border-radius: var(--name-border-radius, 0);
  border-style: var(--name-border-style, none);
  border-width: var(--name-border-width, 0);
  border-color: var(--name-border-color, transparent);
  box-shadow: var(--name-shadow, none);
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
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
  color: var(--section-header-color, var(--primary-color));
  text-transform: var(--section-header-text-transform);
  letter-spacing: var(--section-header-letter-spacing);
  line-height: var(--section-header-line-height, 1.2);
  font-style: var(--section-header-font-style, normal);
  background-color: var(--section-header-background-color, transparent);
  border-radius: var(--section-header-border-radius, 0);
  border-style: var(--section-header-border-style, none);
  border-width: var(--section-header-border-width, 0);
  border-color: var(--section-header-border-color, transparent);
  box-shadow: var(--section-header-shadow, none);
  padding: var(--section-header-padding);
  margin-top: var(--section-header-margin-top);
  margin-bottom: var(--section-header-margin-bottom);
  margin-left: var(--section-header-margin-left, 0px);
  margin-right: var(--section-header-margin-right, 0px);
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Section Header Divider */
.section-header-divider {
  display: var(--section-header-divider-display, none);
  height: var(--section-header-divider-width, 2px);
  background-color: var(--section-header-divider-color);
  margin-top: var(--section-header-divider-gap, 0px);
  margin-bottom: 8px;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
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
  color: var(--job-title-color, var(--text-color));
  letter-spacing: var(--job-title-letter-spacing, 0);
  text-transform: var(--job-title-text-transform, none);
  line-height: var(--job-title-line-height, 1.3);
  font-style: var(--job-title-font-style, normal);
  margin: 0;
  margin-top: var(--job-title-margin-top, 0);
  margin-bottom: var(--job-title-margin-bottom, 4px);
  margin-left: var(--job-title-margin-left, 0px);
  margin-right: var(--job-title-margin-right, 0px);
  padding: var(--job-title-padding, 0);
  background-color: var(--job-title-background-color, transparent);
  border-radius: var(--job-title-border-radius, 0);
  border-style: var(--job-title-border-style, none);
  border-width: var(--job-title-border-width, 0);
  border-color: var(--job-title-border-color, transparent);
  box-shadow: var(--job-title-shadow, none);
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Job Title Divider */
.entry-title-divider {
  display: var(--job-title-divider-display, none);
  height: var(--job-title-divider-width, 2px);
  background-color: var(--job-title-divider-color);
  margin-top: var(--job-title-divider-gap, 0px);
  margin-bottom: 4px;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
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
  font-size: var(--date-line-font-size-custom, var(--tiny-font-size));
  color: var(--date-line-color, var(--text-secondary));
  font-style: var(--date-line-font-style, normal);
  text-align: var(--date-line-alignment, left);
  font-synthesis: none; /* Prevent faux italic - use true italic font or normal */
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
  color: var(--bullet-level1-color, var(--primary-color));
}

/* Nested lists (level 2) */
.entry-bullets ul,
.entry-bullets ol {
  list-style-type: circle;
  margin-left: var(--bullet-level2-indent, 1.5rem);
}

.entry-bullets ul li::marker,
.entry-bullets ol li::marker {
  color: var(--bullet-level2-color, var(--text-secondary));
}

/* Level 3 nested lists */
.entry-bullets ul ul,
.entry-bullets ol ol,
.entry-bullets ul ol,
.entry-bullets ol ul {
  list-style-type: square;
  margin-left: var(--bullet-level3-indent, 1.5rem);
}

.entry-bullets ul ul li::marker,
.entry-bullets ol ol li::marker,
.entry-bullets ul ol li::marker,
.entry-bullets ol ul li::marker {
  color: var(--bullet-level3-color, var(--text-muted));
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
  color: var(--name-color, var(--primary-color));
  letter-spacing: var(--name-letter-spacing);
  text-transform: var(--name-text-transform);
  text-align: var(--name-alignment, left);
  line-height: var(--name-line-height, 1.2);
  font-style: var(--name-font-style, normal);
  margin-top: var(--name-margin-top, 0);
  margin-bottom: var(--name-margin-bottom);
  margin-left: var(--name-margin-left, 0px);
  margin-right: var(--name-margin-right, 0px);
  padding: var(--name-padding, 0);
  background-color: var(--name-background-color, transparent);
  border-radius: var(--name-border-radius, 0);
  border-style: var(--name-border-style, none);
  border-width: var(--name-border-width, 0);
  border-color: var(--name-border-color, transparent);
  box-shadow: var(--name-shadow, none);
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Name Divider */
.name-divider {
  display: var(--name-divider-display, none);
  height: var(--name-divider-width, 2px);
  background-color: var(--name-divider-color);
  margin-top: var(--name-divider-gap, 4px);
  margin-bottom: 8px;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
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
  font-size: var(--job-title-font-size);
  font-weight: var(--job-title-font-weight, 600);
  color: var(--job-title-color);
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

/* Reduce bullet indentation in sidebar to prevent overflow */
.sidebar .entry-bullets {
  margin-left: 1rem;
}

/* Prevent skill tags from overflowing */
.sidebar .skill-tags {
  max-width: 100%;
}

.sidebar .skill-tag {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
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
   Uses --section-header-color/background-color when user has set a Color Pair,
   falls back to layout-specific defaults (accent for sidebar, primary for main)
   ======================================== */
.sidebar .cv-section > h2.section-header,
.sidebar .sidebar-section > h2.section-header {
  font-family: var(--heading-font-family);
  font-size: var(--section-header-font-size);
  font-weight: var(--section-header-font-weight, bold);
  text-transform: var(--section-header-text-transform, uppercase);
  letter-spacing: var(--section-header-letter-spacing, 0.05em);
  line-height: var(--section-header-line-height, 1.2);
  font-style: var(--section-header-font-style, normal);
  margin-bottom: var(--section-header-margin-bottom, 12px);
  margin-top: var(--section-header-margin-top, 16px);
  margin-left: var(--section-header-margin-left, 0px);
  margin-right: var(--section-header-margin-right, 0px);
  padding: var(--section-header-padding, 4px 12px);
  border-radius: var(--section-header-border-radius, 4px);
  border-bottom: none;
  border-style: var(--section-header-border-style, none);
  border-width: var(--section-header-border-width, 0);
  border-color: var(--section-header-border-color, transparent);
  box-shadow: var(--section-header-shadow, none);
  color: var(--section-header-color, var(--on-tertiary-color, #ffffff));
  background-color: var(--section-header-background-color, var(--accent-color));
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.main-content .cv-section > h2.section-header {
  font-family: var(--heading-font-family);
  font-size: var(--section-header-font-size);
  font-weight: var(--section-header-font-weight, bold);
  text-transform: var(--section-header-text-transform, uppercase);
  letter-spacing: var(--section-header-letter-spacing, 0.05em);
  line-height: var(--section-header-line-height, 1.2);
  font-style: var(--section-header-font-style, normal);
  margin-bottom: var(--section-header-margin-bottom, 12px);
  margin-top: var(--section-header-margin-top, 16px);
  margin-left: var(--section-header-margin-left, 0px);
  margin-right: var(--section-header-margin-right, 0px);
  padding: var(--section-header-padding, 4px 12px);
  border-radius: var(--section-header-border-radius, 4px);
  border-bottom: none;
  border-style: var(--section-header-border-style, none);
  border-width: var(--section-header-border-width, 0);
  border-color: var(--section-header-border-color, transparent);
  box-shadow: var(--section-header-shadow, none);
  color: var(--section-header-color, var(--on-primary-color, #ffffff));
  background-color: var(--section-header-background-color, var(--primary-color));
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
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

/* Sidebar container - configurable dimensions for PDF
   Note: Web preview uses Tailwind w-2/5 with inline padding,
   so this only applies in PDF/full document mode */
.sidebar-container {
  width: var(--sidebar-width, 84mm);
  min-width: var(--sidebar-width, 84mm);
  max-width: var(--sidebar-width, 84mm);
  padding: var(--page-margin-top, 20mm) 6mm var(--page-margin-bottom, 20mm) var(--page-margin-left, 6mm);
  flex-shrink: 0;
}

/* Sidebar content styling - applied to content elements for text/color overrides
   No width/padding here - that's handled by container or JSX */
.sidebar {
  overflow: hidden;
  max-width: 100%;
}

/* Ensure nested elements don't overflow sidebar */
.sidebar * {
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.main-content {
  width: var(--main-width, 126mm);
  min-width: var(--main-width, 126mm);
  max-width: var(--main-width, 126mm);
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
  width: var(--sidebar-width, 84mm);
  height: 100%;
  background-color: ${sidebarColor};
  z-index: -2;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.bg-main {
  position: fixed;
  top: 0;
  left: var(--sidebar-width, 84mm);
  width: var(--main-width, 126mm);
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
  width: var(--sidebar-width, 84mm);
  height: 100%;
  background-color: ${sidebarColor};
  z-index: -2;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.main-background {
  position: fixed;
  top: 0;
  left: var(--sidebar-width, 84mm);
  width: var(--main-width, 126mm);
  height: 100%;
  background-color: ${mainColor};
  z-index: -2;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
`
}

/**
 * Generate CSS for advanced visual effects (animations, shadows)
 * These are applied via CSS variables that can be toggled
 */
export function getAdvancedEffectsCSS(): string {
  return `
/* ========================================
   Advanced Visual Effects
   Controlled by CSS variables from config
   ======================================== */

/* Shadow effects on skill tags */
.skill-tag {
  box-shadow: var(--shadow-default, none);
  transition: box-shadow var(--animation-duration, 0s) ease,
              transform var(--animation-duration, 0s) ease;
}

/* Entry cards can have subtle shadows */
.entry {
  transition: box-shadow var(--animation-duration, 0s) ease,
              transform var(--animation-duration, 0s) ease;
}

/* Hover effects - only for screen (not print) */
@media screen {
  .skill-tag:hover {
    box-shadow: var(--shadow-hover, none);
    transform: translateY(calc(-1px * min(1, var(--animation-duration, 0s) / 1s)));
  }

  .entry:hover {
    box-shadow: var(--shadow-hover, none);
  }

  /* Link hover transitions */
  a {
    transition: color var(--animation-duration, 0s) ease;
  }

  /* Section header transitions */
  .section-header {
    transition: background-color var(--animation-duration, 0s) ease,
                color var(--animation-duration, 0s) ease;
  }
}

/* Disable hover effects and shadows for print */
@media print {
  .skill-tag,
  .entry {
    box-shadow: none !important;
    transform: none !important;
    transition: none !important;
  }
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
  includeAdvancedEffects?: boolean
}): string {
  const {
    includeTwoColumn = true,
    sidebarColor = 'var(--surface-color)',
    mainColor = 'var(--background-color)',
    includeAdvancedEffects = true
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

  if (includeAdvancedEffects) {
    css += getAdvancedEffectsCSS()
  }

  return css
}
