/**
 * Shared Semantic CSS Generator
 *
 * Generates CSS for semantic classes used by the shared section renderer.
 * Used by both web preview (frontend) and PDF generator (backend) for consistent styling.
 *
 * All styles use CSS custom properties from generateCSSVariables() for theming.
 */

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
  margin-bottom: 1.5rem;
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
  line-height: 1.6;
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
  margin-bottom: 0.5rem;
}

.entry-title {
  font-size: var(--job-title-font-size);
  font-weight: var(--job-title-font-weight);
  color: var(--job-title-color);
  margin-bottom: var(--job-title-margin-bottom);
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
  padding: 0.25rem 0.5rem;
  font-size: var(--tag-font-size, 0.75rem);
  font-weight: var(--tag-font-weight, 500);
  background-color: var(--tag-bg-color, #d4c4b0);
  color: var(--tag-text-color, #4a3d2a);
  border-radius: var(--tag-border-radius, 4px);
}

.skill-inline {
  font-size: var(--small-font-size);
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
  line-height: 1.6;
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
.sidebar .skill-list,
.sidebar .skill-item,
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
/* Section headers with background colors for two-column layout */
.sidebar .cv-section > h2.section-header {
  font-size: var(--h3-font-size);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  padding: 4px 12px;
  border-radius: 4px;
  border-bottom: none;
  color: var(--on-tertiary-color, #ffffff);
  background-color: var(--accent-color);
}

.main-content .cv-section > h2.section-header {
  font-size: var(--h3-font-size);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  padding: 4px 12px;
  border-radius: 4px;
  border-bottom: none;
  color: var(--on-primary-color, #ffffff);
  background-color: var(--primary-color);
}
`
}
