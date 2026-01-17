# Changelog

All notable changes to CV-Craft will be documented in this file.

## [1.13.0] - 2026-01-17

### Added
- **PDF Overlay Technique** - Multi-layer PDF generation for reliable two-column layouts
  - Renders sidebar and main columns as separate PDFs
  - Creates background layer with two-column colors
  - Merges all layers using pdf-lib for pixel-perfect output
  - Backgrounds extend full-bleed on all pages without position:fixed issues
  - Added `pdf-lib` dependency for PDF merging

### Fixed
- **Skills Rendering as Pills in PDF** - Skill tags now match HTML preview styling
  - Fixed multi-line string parsing for skill categories
  - Added `parseSkillString()` to extract category and individual skills
  - Pills render with proper background colors, border radius, and fonts
- **Google Fonts Loading in PDF** - Fonts now load correctly in PDF export
  - Extract actual fonts from `fontFamily.heading` and `fontFamily.body` config
  - Filter to known Google Fonts (IBM Plex Sans, Cardo, Inter, etc.)
  - Wait for `document.fonts.ready` before PDF capture
- **Markdown Line Break Preservation** - Soft breaks (two trailing spaces) now preserved
  - CV parser handles `break` nodes in markdown AST
  - Line breaks in Skills section no longer concatenate incorrectly

### Technical Insights
- **PDF Overlay Architecture**: Three separate Puppeteer renders (sidebar, main, background) merged with pdf-lib ensures consistent backgrounds across multi-page documents
- **Skill Parsing Regex**: `/^\*{0,2}([^:*]+)\*{0,2}:\s*(.+)$/` matches "**Category:** skill1, skill2" pattern
- **Google Font Detection**: Maintain whitelist of known Google Fonts; extract first font from font-stack and check against list

## [1.12.0] - 2026-01-17

### Changed
- **Preview Mode Consolidation** - Simplified from three modes to two
  - Consolidated `web` and `page-markers` modes into single `html` mode
  - `html` mode: Fast HTML preview with optional page markers toggle
  - `exact-pdf` mode: Backend-generated PDF for accurate pagination
  - Page markers toggle shows/hides A4 page break indicators
  - Both mode and toggle visibility persist in localStorage

### Added
- **Page Markers Implementation** - Actually working page break indicators
  - Calculates A4 page breaks based on content height (297mm - 40mm margins)
  - Red dashed lines with "Page 2", "Page 3" labels at break positions
  - Toggle button with Eye/EyeSlash icons in HTML mode header
  - Recalculates on content, zoom, or style changes

### Fixed
- **Node.js Module Warning** - Added `"type": "module"` to frontend/package.json
  - Eliminates `MODULE_TYPELESS_PACKAGE_JSON` warning on dev server start

### Technical Insights
- **Page Break Calculation**: Convert mm to pixels at 96 DPI (3.7795 px/mm), calculate content height, insert indicators at intervals of (297mm - 40mm margins)
- **localStorage Persistence**: Separate keys for mode (`cv-craft-preview-mode`) and toggle (`cv-craft-page-markers-visible`) allow independent persistence

## [1.11.0] - 2026-01-16

### Added
- **Shared Semantic CSS Module** - DRY architecture for web/PDF styling consistency
  - Created `shared/utils/semanticCSS.ts` with `getSemanticCSS()` and `getTwoColumnHeaderCSS()`
  - Frontend injects CSS via `injectSemanticCSS()` utility at runtime
  - Backend imports directly into PDF generator
  - Single source of truth for ~180 lines of semantic class CSS

- **PDF Photo Support** - Profile photos now load from asset storage
  - `loadPhotoAsDataUri()` reads photo from `./storage/assets/{assetId}.{ext}`
  - Converts to base64 data URI for reliable PDF embedding
  - Falls back to frontmatter.photo URL if no asset

- **PDF Contact Icons** - SVG icons for all contact fields
  - Phone, Email, LinkedIn, GitHub, Globe (website), Location
  - Icons embedded as inline SVG in PDF HTML
  - Matches web preview visual appearance

- **PDF Skill Tags** - Pill-style rendering for skills
  - Custom `renderSkillsSection()` respects `config.components.tags.style`
  - Supports both "pill" (rounded background) and "inline" (separated text) styles
  - CSS for `.skill-tag`, `.skill-tags`, `.skill-category-block`

### Fixed
- **PDF Sidebar Full Height** - Background now extends to bottom of every page
  - Added `.sidebar-background` with `position: fixed` and `height: 100vh`
  - Explicit widths: sidebar 84mm (40%), main 126mm (60%) of 210mm A4
  - Fixed `.cv-page` padding conflicts between layouts

- **PDF Page Margins** - Consistent margins for two-column layout
  - Removed conflicting base `.cv-page` padding
  - Two-column: sidebar `20mm 6mm`, main `20mm 8mm`
  - Single-column uses separate page margin variables

### Technical Insights
- **DRY CSS Pattern**: Export CSS as template literal function from shared module; backend imports directly, frontend injects via `<style>` element on module load
- **Photo Embedding Strategy**: For PDF generation, convert images to base64 data URIs to avoid network requests in Puppeteer
- **Fixed Background for Multi-Page**: Use `position: fixed` with `height: 100vh` to make backgrounds span all pages in print

## [1.10.0] - 2026-01-16

### Added
- **Three Preview Modes** - Replaced broken JS-based pagination with robust preview system
  - **Web Mode**: Continuous scroll, no page boundaries (quick editing)
  - **Page Markers Mode**: Visual dashed lines showing approximate page breaks (default)
  - **Exact PDF Mode**: Backend-rendered PDF displayed in iframe (WYSIWYG)
  - Mode selection persists in localStorage (`cv-craft-preview-mode`)
  - Mode selector UI with icons integrated into CVPreview header

- **Preview PDF Endpoint** - `GET /api/cvs/:id/preview-pdf` returns PDF as binary stream
  - Reuses existing PDF generator for consistent output
  - Inline Content-Disposition for iframe display

### Changed
- **CVPreview Component** - Manages preview mode internally (not via props)
  - Removed ~300 lines of broken pagination code (PDFPageData, measuredHeights, renderPDFPage)
  - Preview mode no longer passed from CVEditorPage
  - EditorRightHeader no longer has Web/PDF toggle buttons

- **PDF Generator Reliability** - Fixed Puppeteer launch issues on macOS
  - Changed `headless: true` to `headless: 'new'` (new Chrome headless mode)
  - Added system Chrome detection (`/Applications/Google Chrome.app`)
  - Falls back to bundled Chromium if system Chrome unavailable

### Technical Insights
- **Mode Persistence Pattern**: Use localStorage for UI preferences that should survive page reloads
- **PDF Preview Strategy**: Instead of simulating pagination in JS, leverage the actual PDF generator and display result in iframe - guarantees WYSIWYG
- **Puppeteer macOS Fix**: System Chrome is more reliable than bundled Chromium on macOS; detect and use it when available

## [1.9.0] - 2026-01-16

### Added
- **Unified Renderer Integration (Phase 3)** - CVPreview now uses shared renderer for section content
  - Imported `renderSections` from `shared/utils/sectionRenderer.ts` into frontend
  - Added helper functions: `renderSectionContentHTML()`, `extractSectionInnerContent()`, `isSpecialSkillsSection()`
  - Section content now rendered via `dangerouslySetInnerHTML` for web/PDF consistency

- **CSS Semantic Classes** - Added ~180 lines of CSS rules for shared renderer classes
  - Entry styling: `.entry`, `.entry-header`, `.entry-title`, `.entry-meta`, `.entry-description`, `.entry-bullets`
  - Skill styling: `.skill-category`, `.skill-category-name`, `.skill-list`
  - Section styling: `.cv-section`, `.section-header`, `.section-content`
  - Sidebar overrides for two-column layout

### Changed
- **renderSectionContent Function** - Now uses shared renderer for non-skills sections
  - Skills sections still use JSX rendering to support pill/inline tag styles
  - Added `forPDF` parameter to enable/disable pagination classes
  - All layouts (minimal, two-column, PDF mode) now use unified content rendering

### Technical Insights
- **Hybrid Approach**: Keeping JSX for layout structure while using shared renderer for content minimizes risk
- **Skills Exception**: Skills sections intentionally bypass shared renderer to preserve configurable tag styles
- **CSS Variables Integration**: Semantic classes from shared renderer respect template CSS variables for theming

## [1.8.0] - 2026-01-16

### Added
- **Unified Web/PDF Rendering Pipeline** - Both preview modes now use shared rendering utilities
  - Created `shared/utils/sectionRenderer.ts` for consistent HTML generation
  - PDF generator uses same rendering functions as web preview
  - CSS variables serve as styling contract between frontend and backend

- **Semantic Color System** - Theme-aware color controls with dropdown selections
  - Extended `TemplateConfig` types with comprehensive component settings
  - Added `SemanticColorControl` for theme-aware color selection
  - Figma-style collapsible sections in TemplateConfigPanel UI

- **Enhanced CV Parser with Rehype Pipeline** - Backend now generates styled HTML directly
  - Added Unified/Rehype plugins for HTML generation (`remark-gfm`, `remark-rehype`, `rehype-stringify`, `rehype-rewrite`)
  - Parser generates HTML with embedded CSS variables
  - Improved section type detection (languages, certifications, interests, references, summary)
  - Better entry parsing for experience/education with title/company extraction
  - Skills parsing supports categorized format (`**Category:** skill1, skill2`)

- **Development Workflow Scripts** - Improved developer experience
  - Added `start-dev.sh`, `stop-dev.sh`, `view-logs.sh` for server management
  - Created `/snapshot` command for standardized commit workflow
  - Documentation reorganized with core docs in `docs/` directory

### Changed
- **Documentation Structure** - Cleaner project root
  - Moved implementation notes and old changelogs to `docs/archive/`
  - Rewritten `CLAUDE.md` with clearer structure and key file references
  - Core documentation now in dedicated `docs/` folder

- **TypeScript Improvements** - Better type safety across codebase
  - Extended CSSProperties to support CSS custom properties
  - Fixed implicit any types in callbacks and function parameters
  - Proper type guards for section content and frontmatter parsing

### Fixed
- **Build System** - Resolved TypeScript and Vite build issues
  - Added `vite-env.d.ts` for ImportMeta.env types
  - Extended styled-components DefaultTheme
  - Fixed SaveStatus naming conflict in EditorStyles
  - Removed outdated compiled JS files from shared types

### Technical Insights
- **CSS Variables Pattern**: Using CSS custom properties as the styling contract between React components and generated HTML ensures consistent rendering across web preview and PDF export
- **Type Safety for CSS**: When using CSS custom properties extensively, extend React.CSSProperties via module augmentation rather than casting everywhere
- **Shared Code Location**: Utilities needed by both frontend (CVPreview) and backend (pdf-generator) belong in `shared/` directory
- **Module Resolution**: Vite prefers TypeScript sources over compiled JS - keep shared types as .ts files without pre-compilation

## [1.7.2] - 2025-11-04 (Previous Unreleased)

### Fixed
- Unified web and PDF rendering with shared utilities
- TextStyleControl updated to use SemanticColorControl
- Layout stability improvements for CollapsibleSection

## [1.4.2] - 2025-10-01

### Fixed
- **Profile Photo Upload and Rendering** - Photos now properly display after upload
  - Modified photo upload to insert `photo: <url>` field into YAML frontmatter
  - Enhanced frontmatter parser to handle URLs with colons (http://, https://)
  - Photo URLs now correctly extracted and rendered in profile circle
  - Fixed issue where photos were inserted as markdown images instead of frontmatter field

- **Markdown Bold Syntax Parsing** - Bold markers (**) now properly removed from rendered text
  - Rewrote `parseSkills` function with better regex matching for `**Category:**` patterns
  - Added stripping of `**` from both category names and individual skills
  - Handles both inline format (`**Category:** skill1, skill2`) and multi-line format
  - Prevents double-processing of lines with index-based while loop

### Changed
- **Improved Editor Layout and Space Management**
  - Settings panel now compact at 280px width (was 384px)
  - Preview automatically adjusts width when settings panel opens (smooth margin transition)
  - Editor pane now hideable via toggle button (Sidebar icon) for full-width preview
  - Settings panel made horizontally space-efficient:
    - Reduced all padding/margins: headers, tabs, content sections
    - Smaller font sizes: headings (text-xs), labels (text-xs), inputs (text-xs)
    - Compact color controls: 8x8px picker (was 12x10), reduced gaps and spacing
    - Section headings use mb-1.5 mt-3 (was mb-3 mt-6)

### Technical Insights
- **Photo Upload Strategy**: Store photo URLs in YAML frontmatter (not as markdown images) because frontmatter is structured data that's easier to parse and render consistently across web/PDF modes
- **URL Parsing in YAML**: When parsing frontmatter with `split(':')`, must rejoin remaining parts since URLs contain colons: `valueParts.join(':').trim()`
- **Layout Responsiveness**: Use margin on container instead of adjusting inner element widths - allows smooth transitions and avoids recalculating multiple element dimensions
- **Toggle Pattern**: Conditionally render editor pane (`{showEditor && <EditorPane>...}`), adjust preview width based on editor visibility, maintain state in parent component
- **Compact UI Design**: Reduce all spacing proportionally - padding, margins, gaps, font sizes - while maintaining visual hierarchy and usability

## [1.4.1] - 2025-10-01

### Fixed
- **Unified Web and PDF Preview Rendering** - Both preview modes now use identical parsing and rendering logic
  - Fixed `[object Object]` appearing in PDF mode skill tags
  - Added icon rendering to PDF mode contact information (Phone, Envelope, LinkedIn, GitHub, Globe, MapPin)
  - Enhanced `renderSectionContent` to properly detect and handle skills, languages, interests sections
  - Improved markdown rendering consistency (bold, italic, line breaks) across both modes
  - Better handling of simple list items and array content

### Changed
- **Template Configuration Persistence** - Config now properly saves to database
  - Extended `useCVEditor` hook with config state management
  - Modified `CVEditorPage` to use config from hook instead of local state only
  - Added `config` field to backend API validation schema
  - Fixed 422 validation errors when saving template configuration

### Technical Insights
- **Rendering Consistency**: The key to maintaining identical Web/PDF rendering is using a single unified rendering function (`renderSectionContent`) that both modes call with an `isSidebar` parameter
- **Type Safety**: When dealing with mixed data types (objects vs strings in arrays), always check type first and extract the appropriate value using pattern: `typeof item === 'string' ? item : (item.name || item.text || String(item))`
- **Icon Libraries**: Phosphor Icons work in both preview modes when rendered as React components (not SVG strings)
- **Config Persistence Chain**: Frontend state → Hook state → API call → Backend validation → Database storage. Each layer must accept the config field.

## [1.4.0] - 2025-09-30

### Added
- **Comprehensive Template Configuration System**
  - Added `TemplateConfig` interface with colors, typography, layout, components, and PDF settings
  - Created `TemplateConfigPanel` with organized sections for all template customization
  - Implemented color pickers for primary, secondary, accent, background, text, border, and link colors
  - Added font family selectors with Google Fonts integration and search
  - Font library expanded with Business and Calm category fonts

### Fixed
- **Skill Tag Rendering Issues**
  - Added configurable tag separators (· | • , none)
  - Fixed skill rendering to support both pill-style tags and inline separated text
  - Properly handle skill data whether it's strings or objects

- **Markdown Rendering Improvements**
  - Enhanced bold syntax detection with non-greedy character class match
  - Added lookahead/lookbehind for italic parsing to avoid conflicts
  - Line breaks now properly converted to `<br/>` tags
  - Link and inline code parsing improved

- **Profile Picture Support**
  - Added support for `frontmatter.photo` field
  - Profile pictures render at 200px × 200px in both Web and PDF modes
  - Fallback placeholder when no photo is provided

## [1.3.0] - 2025-09-15

### Added
- Initial comprehensive template configuration system
- Google Fonts integration with dynamic font loading
- Export functionality for PDF and web packages

## [1.2.0] - 2025-09-10

### Added
- Monaco Editor integration for markdown editing
- Live preview with 300ms debounce
- Dual-pane resizable editor interface

## [1.1.0] - 2025-09-05

### Added
- Backend code quality improvements
- Security hardening with Helmet.js and rate limiting
- Better error handling and validation

## [1.0.1] - 2025-09-01

### Changed
- Removed Spec kit framework
- Streamlined project structure

## [1.0.0] - 2025-08-25

### Added
- Initial release
- CV creation and management
- Markdown-based CV editing
- Template system
- PDF export functionality
