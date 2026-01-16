# Unified Rendering Implementation Status

**Date:** 2025-11-04
**Goal:** Single source of truth for CV HTML rendering (web + PDF)

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
  <div class="section-content">
    <article class="entry">
      <div class="entry-header">
        <h3 class="entry-title">Job Title</h3>
        <p class="entry-meta">
          <span class="entry-company">Company</span> |
          <span class="entry-date">2023-2024</span>
        </p>
      </div>
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
curl -s http://localhost:3001/api/cvs/e1603823-d738-440f-907d-f29cbba14141/export/pdf -o /tmp/test.pdf
# ✅ PDF generates successfully with new shared renderer
```

---

## 🔄 Phase 3: Frontend Integration (PENDING)

### What Needs to Change

**File:** `/frontend/src/components/CVPreview.tsx`

**Current State:**
- Frontend manually builds HTML using React JSX
- Different structure from PDF
- Separate rendering logic for each section type
- Causes divergence from PDF output

**Target State:**
- Frontend imports shared renderer (same as PDF)
- Frontend calls `renderSections(sections)` to get HTML string
- Frontend uses `dangerouslySetInnerHTML` to inject HTML
- Frontend wraps in continuous layout container (vs PDF's paginated layout)

### Implementation Steps

1. **Import shared renderer:**
```typescript
import { renderSections, renderHeader } from '../../../shared/utils/sectionRenderer'
```

2. **Generate HTML from sections:**
```typescript
const renderCV = () => {
  if (!parsedContent?.sections) return null

  // Generate HTML using shared renderer (no pagination for web)
  const contentHTML = renderSections(parsedContent.sections, { pagination: false })

  // Wrap in two-column layout
  const layoutHTML = wrapInWebLayout(parsedContent.frontmatter, contentHTML)

  return <div dangerouslySetInnerHTML={{ __html: layoutHTML }} />
}
```

3. **Create layout wrapper function:**
```typescript
function wrapInWebLayout(frontmatter, contentHTML) {
  // Similar to PDF's two-column layout but without pagination classes
  // Split sections, create sidebar + main columns
  // Return wrapped HTML string
}
```

4. **Style with CSS classes:**
- All existing styles in CVPreview need to target the new semantic classes
- `.cv-section`, `.entry-title`, `.entry-bullets`, etc.
- Remove inline styles from renderer output

### Benefits After Implementation

✅ **Single HTML Generator** - One renderer for both web and PDF
✅ **Consistent Structure** - Same DOM structure, classes, semantic HTML
✅ **Easy Debugging** - Compare web/PDF HTML directly
✅ **Maintainable** - Changes in one place affect both
✅ **Type-Safe** - Shared TypeScript types prevent mismatches

### Difference Between Web & PDF

After implementation, the ONLY differences will be:

**Web:**
- No pagination classes (`keep-together`, `break-inside: avoid`)
- Continuous single-page layout
- Interactive (zoom, pan)

**PDF:**
- Pagination classes for print layout
- Multi-page A4 layout with page breaks
- Static output

**Same:**
- HTML structure (tags, nesting)
- CSS classes
- Content rendering logic
- Section organization

---

## 📋 Testing Checklist

### Before Frontend Integration

- [ ] Download generated PDF from backend
- [ ] Verify PDF has proper sections (Education, Experience, Projects, etc.)
- [ ] Check PDF has two-column layout (sidebar + main)
- [ ] Verify entry structure (title, company, date, description, bullets)
- [ ] Confirm bullets render as `<ul><li>` not plain text
- [ ] Check no duplicate name/header

### After Frontend Integration

- [ ] Web preview renders without errors
- [ ] Compare web and PDF HTML structure (should be nearly identical)
- [ ] Verify only difference is pagination classes
- [ ] Check both have two-column layout
- [ ] Verify bullets render same way in both
- [ ] Test zoom/pan still works in web preview
- [ ] Export PDF and compare to web visually

---

## 🔍 Current Issues

### Fixed Issues
✅ Backend parser converts description arrays to strings
✅ PDF generator uses shared renderer
✅ PDF generation works with new architecture
✅ Bullets are separate from description

### Known Remaining Issues
⚠️ **Web preview still using old manual JSX rendering** - Will have inconsistencies until Phase 3 is complete
⚠️ **Web/PDF divergence** - Different HTML structures cause styling differences

---

## 📦 Files Changed

### Created
- `/shared/utils/sectionRenderer.ts` - Shared HTML renderer (259 lines)

### Modified
- `/backend/src/lib/pdf-generator/index.ts` - Now uses shared renderer
- `/backend/src/lib/cv-parser/index.ts` - Description type conversion fixes

### To Modify (Phase 3)
- `/frontend/src/components/CVPreview.tsx` - Switch from JSX to shared renderer
- `/frontend/src/components/CVPreview.tsx` (CSS) - Update styles to target new classes

---

## 🚀 Next Steps

1. **User tests current PDF** - Download and verify it renders correctly
2. **If PDF looks good** → Proceed with Phase 3 (frontend integration)
3. **If PDF has issues** → Fix shared renderer first before touching frontend
4. **After frontend integrated** → Compare web and PDF HTML output
5. **Final polish** → Ensure styles match between web/PDF

---

## 📝 Notes

- The shared renderer is backend code (Node.js/TypeScript) but can be imported by frontend (both are TypeScript)
- Frontend will need to be rebuilt to pick up shared utils changes
- PDF pagination classes don't affect web rendering (CSS can ignore them)
- This architecture matches the original "Unified/Rehype" vision - one canonical HTML source
