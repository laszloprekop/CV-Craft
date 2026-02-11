# Unified Rendering Implementation Status

**Last Updated:** 2026-02-10
**Goal:** Single source of truth for CV HTML rendering (web + PDF)
**Status:** ✅ All phases complete

---

## ✅ Phase 1: Shared Renderer (COMPLETED)

### What Was Built

**File:** `/shared/utils/sectionRenderer.ts`

A shared HTML renderer that converts structured CV sections into semantic HTML with classes (no inline styles).

**Key Functions:**
- `renderSections(sections, options)` - Main entry point for rendering sections array
- `renderHeader(frontmatter)` - Renders CV header with name, contact info
- Support for all section types: experience, education, projects, skills, languages, interests, etc.

**Features:**
- **Semantic HTML** - Uses proper tags: `<section>`, `<article>`, `<h2>`, `<h3>`, `<ul>`, etc.
- **Class-based styling** - All elements use CSS classes (e.g., `cv-section`, `entry-title`, `entry-bullets`)
- **Pagination support** - Optional `pagination: true` flag adds `keep-together` classes and `break-inside: avoid` for PDF
- **Consistent structure** - Same HTML structure for all consumers
- **Type-safe** - Full TypeScript support with shared types

**HTML Structure Generated:**
```html
<section class="cv-section" data-type="experience">
  <h2 class="section-header">Professional Experience</h2>
  <div class="section-header-divider"></div>
  <div class="section-content">
    <article class="entry">
      <div class="entry-header">
        <h3 class="entry-title">Job Title</h3>
        <p class="entry-meta">
          <span class="entry-company">Company</span> |
          <span class="entry-date">2023-2024</span>
        </p>
      </div>
      <div class="entry-title-divider"></div>
      <div class="entry-description">
        <p>Description text</p>
      </div>
      <ul class="entry-bullets">
        <li>Bullet point 1</li>
        <li>Bullet point 2</li>
      </ul>
    </article>
  </div>
</section>
```

> **Note (v1.19.0):** Divider elements (`.section-header-divider`, `.entry-title-divider`, `.name-divider`) are always emitted in HTML but hidden by default via `display: var(--*-divider-display, none)`. Set to `block` when user enables a divider style.

---

## ✅ Phase 2: PDF Generator Integration (COMPLETED)

### What Was Changed

**File:** `/backend/src/lib/pdf-generator/index.ts`

**Before:**
- PDF manually built HTML from sections using template string literals
- Different structure from web preview
- Each entry type had custom rendering logic
- No consistent classes

**After:**
- PDF imports shared renderer: `import { renderSections, renderHeader } from '../../../../shared/utils/sectionRenderer'`
- PDF calls: `renderSections(sections, { pagination: true })` to get HTML with keep-together classes
- PDF wraps result in layout container (two-column or single-column)
- Same HTML structure as web will use

**Key Method:**
```typescript
private generateHTML(cv, template, config) {
  const { frontmatter, sections } = cv.parsed_content

  // Generate HTML using shared renderer
  const headerHTML = renderHeader(frontmatter)
  const contentHTML = renderSections(sections, { pagination: true })

  // Wrap in layout
  const bodyHTML = useMinimalLayout
    ? `<div class="cv-page">${headerHTML}\n${contentHTML}</div>`
    : this.generateTwoColumnLayoutHTML(frontmatter, sections)

  // Return full HTML document with CSS
  return `<!DOCTYPE html>...`
}
```

**Two-Column Layout Wrapper:**
- Splits sections into sidebar (skills, languages, interests) and main (experience, education, projects)
- Renders each group separately using shared renderer
- Wraps in layout-specific divs

**Testing:**
```bash
curl -s http://localhost:4201/api/cvs/<cv-id>/export/pdf -o /tmp/test.pdf
# ✅ PDF generates successfully with new shared renderer
```

---

## ✅ Phase 3: Frontend Integration (COMPLETED)

**Date:** 2026-01-16

### What Was Changed

**Files Modified:**
- `/frontend/src/components/CVPreview.tsx` - Now uses shared renderer for section content
- `/frontend/src/index.css` - Added CSS rules for semantic classes from shared renderer

### Implementation Approach: Hybrid Strategy

Used a hybrid approach that maintains JSX wrappers for layout structure (two-column, sidebar, photo, contact icons) while using the shared renderer for section content. This minimizes risk while achieving rendering consistency.

**Key Changes in CVPreview.tsx:**

1. **Import shared renderer:**
```typescript
import { renderSections } from '../../../shared/utils/sectionRenderer'
```

2. **Helper functions for extracting content:**
```typescript
// Render section content using shared renderer
const renderSectionContentHTML = (section: CVSection, forPDF: boolean = false): string => {
  const html = renderSections([section], { pagination: forPDF, classPrefix: '' })
  return extractSectionInnerContent(html)
}

// Extract inner content from section HTML (strips section wrapper)
const extractSectionInnerContent = (html: string): string => {
  const match = html.match(/<div class="[^"]*section-content[^"]*">([\s\S]*?)<\/div>\s*<\/section>/i)
  return match ? match[1].trim() : html
}
```

3. **Updated renderSectionContent function:**
```typescript
const renderSectionContent = (section: CVSection, isSidebar: boolean = false, forPDF: boolean = false) => {
  // Skills sections still use JSX for pill/inline style support
  if (isSpecialSkillsSection(section)) {
    return renderSkills(skillCategories, isSidebar)
  }

  // All other sections use shared renderer for consistency
  const contentHTML = renderSectionContentHTML(section, forPDF)
  return (
    <div
      className={`section-content ${isSidebar ? 'sidebar' : ''}`}
      dangerouslySetInnerHTML={{ __html: contentHTML }}
    />
  )
}
```

**Key Changes in index.css:**

Added ~180 lines of CSS rules for semantic classes:
- `.cv-section`, `.section-header`, `.section-content`
- `.entry`, `.entry-header`, `.entry-title`, `.entry-meta`
- `.entry-company`, `.entry-date`, `.entry-location`
- `.entry-description`, `.entry-bullets`
- `.skill-category`, `.skill-category-name`, `.skill-list`
- `.sidebar` overrides for two-column layout

### Benefits Achieved

✅ **Single Content Renderer** - Section content now uses shared renderer
✅ **Consistent Entry Structure** - Jobs, education, projects rendered identically in web/PDF
✅ **CSS Variable Integration** - Semantic classes respect template CSS variables
✅ **Skills Exception** - Skills sections still support pill/inline tag styles
✅ **Backward Compatible** - Existing layout structure preserved

### Difference Between Web & PDF

**Web Mode (`forPDF: false`):**
- No pagination classes (`keep-together`, `break-inside: avoid`)
- Continuous scroll layout
- Interactive (zoom, pan)

**PDF Mode (`forPDF: true`):**
- Pagination classes for print layout
- Multi-page A4 layout with page breaks
- Static output

**Same:**
- HTML structure for entries (title, company, date, description, bullets)
- CSS classes
- Content rendering logic via shared renderer
- Entry formatting and styling

---

## 📋 Testing Checklist

### Phase 1-2 (PDF Integration) ✅

- [x] Download generated PDF from backend
- [x] Verify PDF has proper sections (Education, Experience, Projects, etc.)
- [x] Check PDF has two-column layout (sidebar + main)
- [x] Verify entry structure (title, company, date, description, bullets)
- [x] Confirm bullets render as `<ul><li>` not plain text
- [x] Check no duplicate name/header

### Phase 3 (Frontend Integration) ✅

- [x] Web preview renders without errors
- [x] Frontend builds successfully with TypeScript
- [x] Minimal layout uses shared renderer
- [x] Two-column layout uses shared renderer
- [x] PDF mode uses shared renderer with pagination
- [x] Measurement container uses shared renderer
- [x] Skills sections still render with pill/inline styles

### Manual Testing Required

- [ ] Web preview renders correctly with sample CV
- [ ] Toggle PDF mode and verify pagination
- [ ] Export PDF and compare visual output with web preview
- [ ] Verify entry structure matches (title, company, date, bullets)
- [ ] Test zoom/pan still works in web preview

---

## 🔍 Current Issues

### Fixed Issues
✅ Backend parser converts description arrays to strings
✅ PDF generator uses shared renderer
✅ PDF generation works with new architecture
✅ Bullets are separate from description
✅ Web preview now uses shared renderer for section content
✅ Web/PDF rendering consistency achieved

### Known Remaining Considerations
⚠️ **Skills sections use JSX** - Skills still use JSX rendering for pill/inline tag styles (shared renderer doesn't support tag styles yet)
⚠️ **Layout wrappers use JSX** - Two-column layout structure (sidebar, photo, contact icons) still uses JSX for flexibility

---

## 📦 Files Changed

### Created
- `/shared/utils/sectionRenderer.ts` - Shared HTML renderer (201 lines)
- `/shared/utils/semanticCSS.ts` - Shared CSS generator for semantic classes (v1.11.0)
- `/frontend/src/utils/injectSemanticCSS.ts` - Frontend CSS injection utility (v1.11.0)

### Modified (Phase 1-2)
- `/backend/src/lib/pdf-generator/index.ts` - Now uses shared renderer
- `/backend/src/lib/cv-parser/index.ts` - Description type conversion fixes

### Modified (Phase 3)
- `/frontend/src/components/CVPreview.tsx` - Uses shared renderer for section content via `dangerouslySetInnerHTML`
- `/frontend/src/index.css` - Added ~180 lines of CSS for semantic classes

### Modified (Phase 4 - v1.11.0)
- `/backend/src/lib/pdf-generator/index.ts` - Added:
  - SVG icons for contact info (ICONS constant)
  - `loadPhotoAsDataUri()` for base64 photo embedding
  - `renderSkillsSection()` for pill-style skill tags
  - Fixed sidebar background with `position: fixed`
  - Explicit A4 width calculations (84mm sidebar, 126mm main)
- `/frontend/src/components/CVPreview.tsx` - Imports and calls `injectSemanticCSS()`
- `/frontend/src/index.css` - Moved semantic CSS to shared module (now just a comment pointing to shared)

---

## ✅ Phase 5: Unified Style Pipeline (COMPLETED)

**Date:** 2026-01-18
**Version:** 1.14.0

### What Was Built

Created a complete unified style pipeline where both web preview and PDF export use the same CSS and HTML generation code.

**New Shared Utilities:**

| File | Purpose |
|------|---------|
| `shared/utils/semanticCSS.ts` | Modular CSS generators: `getPhotoCSS()`, `getContactCSS()`, `getSemanticCSS()`, `getTwoColumnHeaderCSS()`, etc. |
| `shared/utils/paginationCSS.ts` | Page break rules: `getPaginationCSS()`, `getPageMarkersCSS()`, `getPageRuleCSS()` |
| `shared/utils/layoutRenderer.ts` | Unified HTML generator: `generateCVDocument()`, `generateColumnHTML()`, `generateBackgroundHTML()` |
| `shared/utils/contactRenderer.ts` | Contact info with SVG icons: `renderContactInfo()`, `CONTACT_ICONS` |
| `shared/utils/photoRenderer.ts` | Profile photo HTML: `renderPhoto()`, `renderProfilePhoto()` |

**Key Refactoring:**

- **pdf-generator**: Reduced from ~3468 lines to ~570 lines
  - Removed all duplicate CSS template strings
  - Removed duplicate `renderSkillsSection()` method
  - Now imports and uses shared `generateColumnHTML()` and `generateBackgroundHTML()`
  - Keeps only: Puppeteer logic, PDF merging, file I/O

- **CVPreview**: Updated to use CSS variables consistently
  - Photo uses `--profile-photo-size` and `--profile-photo-border`
  - Section headers use `--h3-font-size` instead of Tailwind classes
  - Injected CSS now includes all shared modules

### Architecture Achieved

```
TemplateConfig
     │
     ▼
generateCSSVariables(config) → CSS Variables
     │
     ├── semanticCSS → Element styles (photo, contact, entries, skills)
     ├── paginationCSS → Page break rules
     └── layoutRenderer → HTML structure
           │
           ├── CVPreview (columnBreaks: 'css')
           └── pdf-generator (columnBreaks: 'actual')
```

### Issues Fixed

1. **Photo size mismatch** - Both use `--profile-photo-size` (160px default)
2. **Photo border mismatch** - Both use `--profile-photo-border` (3px solid #e2e8f0)
3. **CSS selector mismatch** - PDF now uses `main-content` class (was `main`)
4. **Sidebar header font size** - Web uses CSS variable instead of Tailwind

---

## 🚀 Future Improvements

1. **Full JSX replacement** - Replace remaining CVPreview JSX with shared renderer output
2. **Performance testing** - Monitor `dangerouslySetInnerHTML` impact on React reconciliation
3. **E2E tests** - Add visual regression tests comparing web/PDF output

---

## 📝 Notes

- The shared renderer is in `/shared/utils/` and can be imported by both frontend and backend
- Frontend uses a hybrid approach: JSX for layout structure, shared renderer for content
- Skills sections intentionally bypass shared renderer to support configurable tag styles
- CSS in `index.css` targets semantic classes with CSS variables for theming
- This architecture achieves the "Unified Rendering" goal - single source of truth for CV content HTML
- **Preview-pdf endpoint (v1.19.0)**: Changed from `GET` to `POST /api/cvs/:id/preview-pdf`. Frontend sends the current config in the request body to avoid stale database config issues. The backend uses `configOverride || cv.config || template.default_config`.
