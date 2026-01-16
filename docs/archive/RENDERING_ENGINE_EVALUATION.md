# CV-Craft Rendering Engine Evaluation & Migration Plan

## Current State Analysis

### Parsing Layer (Backend)
**Engine:** Remark (Unified ecosystem)
**File:** `backend/src/lib/cv-parser/index.ts`

**What it outputs:**
```typescript
ParsedCVContent {
  frontmatter: { name, email, phone, location, website, linkedin, github, ... }
  sections: CVSection[] {
    type: 'heading' | 'paragraph' | 'list' | 'experience' | 'education' | 'skills' | 'projects'
    title?: string
    content: string | CVListItem[] | CVExperienceItem[] | CVEducationItem[] | string[]
    level?: number
  }
}
```

**Limitations:**
- ❌ No structured inline formatting (bold, italic, code, links)
- ❌ Content stored as plain strings
- ❌ Loses markdown formatting information
- ❌ Sections inferred from headings (fragile logic)
- ⚠️ Parser outputs simple structure, renderer tries to re-parse it

### Rendering Layer (Frontend)
**Engine:** Custom React components + manual markdown parsing
**File:** `frontend/src/components/CVPreview.tsx` (1552 lines!)

**What it does:**
1. Receives parsed content (already lost formatting)
2. **Re-parses markdown** with custom `renderMarkdown()` function:
   - Bold: `**text**` → `<strong>`
   - Italic: `*text*` → `<em>`
   - Links: `[text](url)` → `<a>`
   - Code: `` `code` `` → `<code>`
3. Manually renders each section type with conditional logic
4. Applies inline styles from `templateStyles` CSS variables
5. Handles two-column vs single-column layouts
6. Duplicates logic for PDF mode

**Problems:**
1. **Double Parsing:** Parser strips formatting → Renderer tries to add it back
2. **Manual Everything:** Every element type requires custom rendering code
3. **Inline Styles Everywhere:** 100+ `style={{...}}` objects
4. **Duplication:** Web rendering vs PDF rendering have separate code
5. **Disconnected Settings:** 53% of CSS variables not used
6. **Fragile:** Changes require updating multiple places
7. **Not Scalable:** Adding new element types requires extensive code changes

### PDF Generation (Backend)
**Engine:** Puppeteer + Manual HTML generation
**File:** `backend/src/lib/pdf-generator/index.ts`

**What it does:**
1. Generates CSS styles from config variables
2. **Manually builds HTML strings** with template literals
3. Different rendering logic than web preview
4. Lacks many features of web preview
5. May not respect all CSS variables

**Problems:**
1. **Logic Duplication:** Separate from CVPreview
2. **Drift Risk:** Web and PDF can render differently
3. **Maintenance:** Changes need to be made in 2+ places
4. **Limited Testing:** Hard to verify web/PDF parity

## Issue Root Cause

**The fundamental problem:** We're treating CV rendering as a "web app UI problem" when it's actually a **"document generation problem"**.

CVs are documents with:
- Structured content (headings, paragraphs, lists, tables)
- Rich formatting (bold, italic, links, code)
- Precise layout control
- Consistent rendering across media (web, PDF, print)
- Template-based customization

We need a **document rendering pipeline**, not manual React components.

## Evaluation: Rendering Engine Options

### Option 1: Keep Current (Custom React + Cleanup)
**Approach:** Refactor existing code, connect all CSS variables

**Pros:**
- No migration cost
- Familiar codebase
- React integration already works

**Cons:**
- Still manual rendering for every element type
- Still duplicated web/PDF logic
- Still double-parsing markdown
- High maintenance burden
- Doesn't solve fundamental architecture issues

**Effort:** 20-30 hours
**Risk:** Medium (technical debt remains)
**Rating:** ⭐⭐ (2/5)

---

### Option 2: Unified/Rehype Pipeline (Transform Markdown → HTML)
**Approach:** Extend Remark parser with Rehype to generate fully-styled HTML

**Architecture:**
```
Markdown → Remark (parse) → Unified AST → Rehype (transform) → HTML + CSS
                                  ↓
                            Apply template styles
```

**Implementation:**
1. Extend parser to use `remark-rehype` (converts to HTML AST)
2. Apply template styles during transformation with `rehype-rewrite`
3. Generate single HTML output with embedded styles
4. Frontend just renders HTML (no parsing logic needed)
5. PDF uses same HTML (perfect parity)

**Example:**
```typescript
// In parser
const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGfm) // GitHub Flavored Markdown
  .use(remarkRehype) // Convert to HTML AST
  .use(rehypeRewrite, {
    rewrite: (node) => applyTemplateStyles(node, config)
  })
  .use(rehypeStringify) // Output HTML

// Frontend
<div dangerouslySetInnerHTML={{ __html: htmlContent }} />
```

**Pros:**
- ✅ Single source of truth for rendering
- ✅ No double-parsing
- ✅ Perfect web/PDF parity (same HTML)
- ✅ Mature ecosystem (Unified is industry standard)
- ✅ Extensible (add plugins for new features)
- ✅ Structured AST allows precise control
- ✅ All markdown features supported (tables, footnotes, etc.)
- ✅ CSS variables naturally integrated
- ✅ Template changes only in one place

**Cons:**
- Moderate migration effort
- Need to learn Unified ecosystem
- React becomes just a container (less "React-y")

**Effort:** 30-40 hours
**Risk:** Low (proven approach, mature tools)
**Rating:** ⭐⭐⭐⭐⭐ (5/5) **RECOMMENDED**

---

### Option 3: Template Engine (Handlebars/Nunjucks)
**Approach:** Use traditional template engine for HTML generation

**Architecture:**
```
Parsed Content → Template Engine + Config → HTML
```

**Example (Handlebars):**
```handlebars
<div class="cv-preview" style="font-size: {{typography.baseFontSize}}">
  <h1 style="color: {{colors.primary}}">{{frontmatter.name}}</h1>
  {{#each sections}}
    <section>
      <h2>{{title}}</h2>
      {{#each content}}
        <p>{{{this}}}</p>
      {{/each}}
    </section>
  {{/each}}
</div>
```

**Pros:**
- ✅ Clean separation of logic and presentation
- ✅ Familiar syntax for designers
- ✅ Easy to add new templates
- ✅ Server-side rendering possible

**Cons:**
- ❌ Still need to parse markdown to HTML first
- ❌ Less React integration (templates are strings)
- ❌ Hard to add interactivity
- ❌ CSS variables still need manual application
- ❌ Template language learning curve

**Effort:** 25-35 hours
**Risk:** Medium (template debugging, React integration)
**Rating:** ⭐⭐⭐ (3/5)

---

### Option 4: MDX (Markdown + JSX)
**Approach:** Use MDX to mix markdown with React components

**Example:**
```mdx
import CVSection from './CVSection'
import ContactInfo from './ContactInfo'

# {frontmatter.name}

<ContactInfo {...frontmatter} />

<CVSection title="Experience">
  ## Senior Developer at Acme Corp
  *2020 - Present*

  - Led team of 5 developers
  - Built **microservices** architecture
</CVSection>
```

**Pros:**
- ✅ Best of both worlds (Markdown + React)
- ✅ Component reusability
- ✅ Strong React integration
- ✅ Interactive elements possible

**Cons:**
- ❌ Users write MDX, not pure Markdown (barrier to entry)
- ❌ More complex than pure Markdown
- ❌ Harder to validate/sanitize
- ❌ Still need custom components for every element
- ❌ PDF generation more complex

**Effort:** 35-45 hours
**Risk:** High (complex, overkill for our use case)
**Rating:** ⭐⭐ (2/5)

---

### Option 5: React-Markdown + Custom Renderers
**Approach:** Use `react-markdown` library with custom component renderers

**Example:**
```typescript
<ReactMarkdown
  components={{
    h1: ({node, ...props}) => <h1 style={{...styles.h1}} {...props} />,
    h2: ({node, ...props}) => <h2 style={{...styles.h2}} {...props} />,
    p: ({node, ...props}) => <p style={{...styles.p}} {...props} />,
    // ... custom renderers for all elements
  }}
>
  {markdownContent}
</ReactMarkdown>
```

**Pros:**
- ✅ Popular library (well-maintained)
- ✅ React-friendly
- ✅ Custom renderers for styling
- ✅ Handles inline formatting automatically

**Cons:**
- ❌ Still need to write renderers for all elements
- ❌ PDF generation needs separate handling
- ❌ Component-based approach (similar to current issues)
- ❌ CSS variables still disconnected from renderers

**Effort:** 20-25 hours
**Risk:** Medium (renderer maintenance)
**Rating:** ⭐⭐⭐ (3/5)

## Recommendation: Option 2 (Unified/Rehype Pipeline)

### Why Unified/Rehype is Best

1. **You already use Remark** - Natural extension
2. **Industry standard** - Used by Gatsby, Next.js, Docusaurus, Storybook
3. **Plugin ecosystem** - Rich plugins for any feature (GFM, emoji, math, etc.)
4. **Perfect web/PDF parity** - Same HTML output
5. **No double-parsing** - Process once, render everywhere
6. **Future-proof** - Easy to add tables, footnotes, diagrams, etc.
7. **Type-safe** - TypeScript support throughout
8. **Performance** - No runtime parsing in frontend

### Architecture After Migration

```
┌─────────────────────────────────────────────────────────────────┐
│                         PARSING LAYER                            │
│                         (Backend only)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Markdown Input                                                  │
│       ↓                                                          │
│  Remark (parse MD → AST)                                        │
│       ↓                                                          │
│  Extract Frontmatter                                             │
│       ↓                                                          │
│  Unified Plugins (GFM, emoji, etc.)                             │
│       ↓                                                          │
│  Rehype (AST → HTML AST)                                        │
│       ↓                                                          │
│  Apply Template Styles (rehype-rewrite)                         │
│   - Inject CSS variables                                         │
│   - Add CSS classes                                              │
│   - Apply component configs                                      │
│       ↓                                                          │
│  HTML String Output (fully styled)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        RENDERING LAYER                           │
│                     (Frontend + Backend)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend (Web Preview):                                         │
│    <div dangerouslySetInnerHTML={{__html: parsedContent.html}}/>│
│    + CSS variables from config                                   │
│                                                                  │
│  Backend (PDF Export):                                           │
│    Puppeteer renders same HTML                                   │
│    + CSS variables from config                                   │
│                                                                  │
│  Result: Perfect parity, no rendering logic duplication          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Migration Plan

### Phase 1: Parser Enhancement (5-8 hours)

**Goal:** Extend parser to output HTML instead of plain strings

**Tasks:**
1. Add dependencies:
   ```bash
   npm install remark-rehype rehype-stringify rehype-rewrite
   npm install remark-gfm # GitHub Flavored Markdown
   npm install @types/hast @types/mdast
   ```

2. Update `CVParser` class:
   ```typescript
   import { unified } from 'unified'
   import remarkParse from 'remark-parse'
   import remarkGfm from 'remark-gfm'
   import remarkRehype from 'remark-rehype'
   import rehypeRewrite from 'rehype-rewrite'
   import rehypeStringify from 'rehype-stringify'

   async parse(content: string, config: TemplateConfig): Promise<ParsedCVContent> {
     const { data: frontmatter, content: markdownContent } = matter(content)

     const processor = unified()
       .use(remarkParse)
       .use(remarkGfm) // Tables, strikethrough, task lists, etc.
       .use(remarkRehype, { allowDangerousHtml: true })
       .use(rehypeRewrite, {
         rewrite: (node) => this.applyTemplateStyles(node, config)
       })
       .use(rehypeStringify, { allowDangerousHtml: true })

     const htmlContent = await processor.process(markdownContent)

     return {
       frontmatter,
       html: String(htmlContent), // ← NEW: HTML output
       sections: [] // ← Keep for backwards compat during migration
     }
   }
   ```

3. Implement `applyTemplateStyles()` method:
   ```typescript
   private applyTemplateStyles(node: any, config: TemplateConfig) {
     if (node.type === 'element') {
       switch (node.tagName) {
         case 'h1':
           node.properties = {
             ...node.properties,
             style: `
               font-size: var(--name-font-size);
               font-weight: var(--name-font-weight);
               color: var(--name-color);
               letter-spacing: var(--name-letter-spacing);
               text-transform: var(--name-text-transform);
             `
           }
           break

         case 'h2':
           node.properties = {
             ...node.properties,
             style: `
               font-size: var(--section-header-font-size);
               font-weight: var(--section-header-font-weight);
               color: var(--section-header-color);
               text-transform: var(--section-header-text-transform);
               letter-spacing: var(--section-header-letter-spacing);
             `,
             className: 'section-header'
           }
           break

         case 'h3':
           node.properties = {
             ...node.properties,
             style: `
               font-size: var(--job-title-font-size);
               font-weight: var(--job-title-font-weight);
               color: var(--job-title-color);
             `
           }
           break

         case 'p':
           node.properties = {
             ...node.properties,
             style: `
               font-size: var(--body-font-size);
               line-height: var(--body-line-height);
               font-weight: var(--body-weight);
             `
           }
           break

         case 'strong':
           node.properties = {
             ...node.properties,
             style: `
               font-weight: var(--bold-weight);
               color: var(--emphasis-color);
             `
           }
           break

         case 'a':
           node.properties = {
             ...node.properties,
             style: `
               color: var(--link-color);
               text-decoration: underline;
             `
           }
           break

         case 'code':
           node.properties = {
             ...node.properties,
             style: `
               font-size: var(--inline-code-font-size);
               background-color: var(--muted-color);
               padding: 0 0.25rem;
               border-radius: 0.125rem;
             `
           }
           break

         case 'ul':
         case 'ol':
           node.properties = {
             ...node.properties,
             style: `
               margin-left: var(--bullet-level1-indent);
             `
           }
           break

         case 'li':
           node.properties = {
             ...node.properties,
             style: `
               line-height: var(--body-line-height);
               margin-bottom: var(--paragraph-spacing);
             `
           }
           break
       }
     }
   }
   ```

### Phase 2: Frontend Simplification (3-5 hours)

**Goal:** Replace 1500-line CVPreview with simple HTML renderer

**Before:**
```tsx
// CVPreview.tsx - 1552 lines of complex rendering logic
```

**After:**
```tsx
// CVPreview.tsx - ~100 lines
export const CVPreview: React.FC<CVPreviewProps> = ({
  cv,
  template,
  config,
  previewMode = 'web'
}) => {
  const cssVariables = useMemo(
    () => generateCSSVariables(config || template.default_config),
    [config, template]
  )

  if (!cv?.parsed_content?.html) {
    return <EmptyState />
  }

  return (
    <div
      className="cv-preview"
      style={{
        ...cssVariables,
        width: cssVariables['--page-width'],
        padding: `${cssVariables['--page-margin-top']} ${cssVariables['--page-margin-right']} ${cssVariables['--page-margin-bottom']} ${cssVariables['--page-margin-left']}`
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: cv.parsed_content.html }} />
    </div>
  )
}
```

**Benefits:**
- 93% less code
- No custom rendering logic
- All CSS variables automatically connected
- Perfect rendering

### Phase 3: PDF Generator Simplification (2-3 hours)

**Goal:** Use same HTML as web preview

**Before:**
```typescript
// pdf-generator/index.ts - Manual HTML generation
private generateHTML(...) {
  return `<html>...</html>` // 200+ lines
}
```

**After:**
```typescript
// pdf-generator/index.ts - Reuse parser output
async generatePDF(options: PDFGenerationOptions): Promise<PDFGenerationResult> {
  const { cv, config } = options
  const cssVariables = generateCSSVariables(config)

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          :root { ${Object.entries(cssVariables).map(([k,v]) => `${k}: ${v};`).join('\n')} }
          body { font-family: var(--font-family); }
          /* ... base styles ... */
        </style>
      </head>
      <body>
        ${cv.parsed_content.html}
      </body>
    </html>
  `

  // Render with Puppeteer
  await page.setContent(html)
  await page.pdf(pdfOptions)
}
```

### Phase 4: Connect All CSS Variables (4-6 hours)

**Goal:** Ensure ALL 93 CSS variables are used

With HTML generation in the parser, we can now guarantee ALL CSS variables are applied:

**Tasks:**
1. Update `applyTemplateStyles()` to handle all element types
2. Add line-height to all text elements
3. Add font-weight to all appropriate elements
4. Apply spacing variables consistently
5. Handle nested lists with proper indentation
6. Apply hover states via CSS (not inline)

**Example for complete coverage:**
```typescript
// In rehype transform
case 'h1':
case 'h2':
case 'h3':
  node.properties.style = `
    font-family: var(--heading-font-family);
    line-height: var(--heading-line-height);
    letter-spacing: var(--heading-letter-spacing);
    font-weight: var(--heading-weight);
  `
  break

case 'p':
  node.properties.style = `
    font-size: var(--body-font-size);
    line-height: var(--body-line-height);
    font-weight: var(--body-weight);
    margin-bottom: var(--paragraph-spacing);
  `
  break

// ... and so on for ALL elements
```

### Phase 5: Advanced Features (5-8 hours)

**Goal:** Leverage Unified ecosystem for rich features

**Easy Additions:**
1. **Tables:** Already supported by `remark-gfm`
2. **Emoji:** Add `remark-emoji` plugin
3. **Math:** Add `remark-math` + `rehype-katex`
4. **Syntax Highlighting:** Add `rehype-highlight`
5. **Footnotes:** Add `remark-footnotes`
6. **Table of Contents:** Add `remark-toc`

**Example:**
```typescript
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm) // ← Tables, strikethrough, task lists
  .use(remarkEmoji) // ← :smile: → 😊
  .use(remarkMath) // ← $E = mc^2$ → rendered equation
  .use(remarkRehype)
  .use(rehypeHighlight) // ← Code blocks with syntax highlighting
  .use(rehypeRewrite, { rewrite: applyStyles })
  .use(rehypeStringify)
```

## Comparison: Before vs After

### Before (Current State)

**Codebase Complexity:**
- CVPreview.tsx: 1552 lines
- pdf-generator/index.ts: 495 lines
- Manual markdown parsing
- Duplicate rendering logic
- **Total: ~2000+ lines**

**CSS Variables:**
- Generated: 93
- Used: 44
- **Disconnected: 49 (53%)**

**Maintenance:**
- Add new element type: 50+ line changes across 3 files
- Change styling: Find all inline styles, hope you didn't miss any
- Fix bug: Debug complex conditional logic
- **Effort: High**

**Performance:**
- Frontend parses markdown twice (parser + renderMarkdown)
- Backend generates HTML from scratch
- **Inefficient**

### After (Unified Pipeline)

**Codebase Complexity:**
- CVPreview.tsx: ~100 lines (just renders HTML)
- pdf-generator/index.ts: ~150 lines (uses same HTML)
- applyTemplateStyles: ~300 lines (single source of truth)
- **Total: ~550 lines (73% reduction)**

**CSS Variables:**
- Generated: 93
- Used: 93
- **Disconnected: 0 (100% coverage)**

**Maintenance:**
- Add new element type: Update applyTemplateStyles() only
- Change styling: Update CSS variable in one place
- Fix bug: Clear AST-based logic
- **Effort: Low**

**Performance:**
- Parse markdown once (backend)
- Frontend just renders HTML
- Backend reuses HTML for PDF
- **Efficient**

## Migration Risk Assessment

### Risks

1. **Learning Curve** (Low)
   - Team needs to learn Unified/Rehype APIs
   - Mitigation: Well-documented, large community

2. **Breaking Changes** (Medium)
   - Existing CVs need re-parsing
   - Mitigation: Keep backward compatibility during transition

3. **Testing** (Medium)
   - Need to verify all elements render correctly
   - Mitigation: Comprehensive test suite

4. **Time Investment** (Medium)
   - 30-40 hours total effort
   - Mitigation: Phased approach, can pause at any phase

### Success Criteria

✅ All 93 CSS variables connected and working
✅ Perfect web/PDF rendering parity
✅ Sub-100-line frontend component
✅ All markdown features supported (bold, italic, links, code, lists, etc.)
✅ Easy to add new features (tables, emoji, math, etc.)
✅ 70%+ code reduction
✅ Maintenance effort reduced by 80%

## Timeline & Effort

| Phase | Tasks | Effort | Deliverable |
|-------|-------|--------|-------------|
| 1 | Parser Enhancement | 5-8h | HTML output from parser |
| 2 | Frontend Simplification | 3-5h | Simple CVPreview component |
| 3 | PDF Simplification | 2-3h | Unified PDF generation |
| 4 | CSS Variable Connection | 4-6h | All 93 variables working |
| 5 | Advanced Features | 5-8h | Tables, emoji, math, etc. |
| **Total** | **Full migration** | **19-30h** | **Production-ready system** |

## Recommendation

**Proceed with Option 2: Unified/Rehype Pipeline**

**Why:**
1. Solves ALL identified problems (disconnected CSS, double-parsing, duplication)
2. Reduces codebase by 70%+
3. Future-proof (easy to add tables, diagrams, etc.)
4. Industry-standard approach (Gatsby, Next.js, Docusaurus use this)
5. Perfect web/PDF parity guaranteed
6. Maintenance effort reduced 80%

**Start With:**
Phase 1 (Parser Enhancement) - Low risk, immediate value

**Success Looks Like:**
- User changes "Body Line Height" → All paragraphs adjust immediately
- User changes "Bullet Color" → All bullets change color
- Add tables to CV → Just works (no code changes)
- Export to PDF → Looks identical to web preview
- Add new template → Just modify CSS variables

## Next Steps

1. **Approve approach** ← Decision point
2. **Install dependencies** (10 min)
3. **Implement Phase 1** (Parser Enhancement) - 5-8 hours
4. **Test with sample CVs** (1 hour)
5. **Proceed to Phase 2** (Frontend) or pause for feedback

**Decision:** Proceed with migration? Y/N
