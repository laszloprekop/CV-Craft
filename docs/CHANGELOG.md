# Changelog

All notable changes to CV-Craft will be documented in this file.

## [1.22.0] - 2026-02-11

### Added
- **Bullet list customization UI** — Wire up `MultiLevelBulletPicker` in Styles > Body > List Bullets with per-level bullet style, semantic color, and indent controls
- **`--bullet-level{1,2,3}-style` CSS variables** — Bullet style (disc/circle/square/none/custom) now flows through CSS variables to `list-style-type`, enabling live preview and PDF rendering
- **Semantic color for bullet markers** — Replace hex color picker with `SemanticColorControl` dropdown and add `colorKey` field to `BulletLevelConfig` type

### Changed
- **Consistent "On X" naming** — Rename "Text Primary/Secondary/Muted" to "On Background/On Background (Light)/On Background (Muted)" and "Text Custom 1-4" to "On Custom 1-4" in `SemanticColorControl` dropdown to match Colors tab naming convention

### Fixed
- **Hardcoded color fallbacks** — Remove hardcoded `#f5f0e8`, `#ffffff`, `#4a3d2a` from `layoutRenderer.ts`, `semanticCSS.ts`, and `CVPreview.tsx`; replace with `var(--text-color)` CSS fallbacks or config-derived values so customized column colors are never overridden
- **Bullet color regression** — Guard `resolveSemanticColor` calls in CSS variable generator to only fire when `colorKey` is explicitly set; prevents `resolveSemanticColor(undefined)` returning `text.primary` and short-circuiting the fallback chain
- **`onCommit` prop not destructured** — Add `onCommit` to `SemanticElementEditor` component destructuring so bullet config changes persist to database

### Technical Insights
- `resolveSemanticColor(undefined, config)` returns `config.colors.text.primary` (a truthy string), not `undefined` — never use it in an `||` fallback chain without guarding for the key being set first

## [1.21.1] - 2026-02-11

### Fixed
- **Editor cursor jumping** — Remove `startTransition` from debounced Monaco editor content update to fix cursor jumping to end of document mid-typing; the 300ms debounce already prevents excessive re-renders, making the transition wrapper redundant and the source of a race condition with the controlled component pattern

## [1.21.0] - 2026-02-10

### Added
- **Theme management** — Save, load, rename, delete, and reset named TemplateConfig presets ("Saved Themes")
- **`saved_themes` database table** — Stores named config snapshots with UNIQUE name constraint, FK to templates
- **Backend CRUD** — `SavedThemeModel`, `SavedThemeService`, REST API at `/api/saved-themes` (GET, POST, PUT, DELETE)
- **`SavedTheme` shared type** — New interface in `shared/types/index.ts` (distinct from existing UI `Theme`)
- **`savedThemeApi` frontend client** — API service for saved theme operations
- **`useSavedThemes` hook** — Manages theme list state with save/update/delete/rename actions
- **Theme selector dropdown** — Replaces native template `<select>` in `EditorRightHeader` with custom dropdown featuring:
  - "Modern Professional (Default)" always first with checkmark indicator
  - User-saved themes with inline rename (pencil icon) and delete (trash icon with confirmation)
  - "Save as Theme..." with inline name input
  - "Update [active theme]" to overwrite current config into the active theme
  - "Reset to Default" when a saved theme is active

### Changed
- `EditorRightHeader` accepts new theme management props: `savedThemes`, `activeThemeId`, `onLoadTheme`, `onSaveTheme`, `onUpdateTheme`, `onDeleteTheme`, `onRenameTheme`, `onResetToDefault`
- `CVEditorPage` integrates `useSavedThemes` hook and `activeThemeId` state with handler functions

## [1.20.0] - 2026-02-10

### Added
- **Inline markdown rendering** — Bold (`**text**`), italic (`*text*`), inline code, and links now render in entry descriptions, bullets, skill items, and org/date meta lines via new `renderInlineMarkdown()` in `sectionRenderer.ts`
- **Org/Date element editor** — New "Org/Date" element in Styles tab with:
  - Separator radio buttons (pipe, dot, bullet, dash, none, newline) controlling meta item layout
  - Independent Organization typography: font family, size, weight, color, letter spacing, text transform, font style, line height
  - Independent Date typography: font family, size, weight, color, letter spacing, text transform, font style
  - Newline separator renders each meta item as a separate paragraph
- **Org/Date independent font family** — FontSelector controls for Organization and Date, with CSS variables `--org-name-font-family` and `--date-line-font-family`
- **Body text element** — New "Body" element in Styles tab with color, font weight, line height, and text alignment controls
- **Font scale controls** — Base tab now includes scale multiplier sliders for H1–H3, Body, Small, Tiny
- **Column background colors** — Page tab "Column Colors" section for two-column layouts with independent sidebar/main background color overrides
- **Clickable contact links** — Phone, email, LinkedIn, GitHub, and website links in web preview now use proper `<a>` tags with `tel:`, `mailto:`, and external URLs
- **Phosphor regular-weight icons** — Contact icons (phone, email, LinkedIn, GitHub, globe, location) updated from fill/duotone to regular weight for consistency between web and PDF
- **SemanticColorControl mode filtering** — New `mode` prop (`'text'` | `'background'`) filters dropdown groups: text pickers show only Text group, background pickers show only Surface + On Surface groups
- **Text Custom colors in dropdown** — On-custom1–4 available as "Text Custom 1–4" entries in the Text group (no background, text-only preview)
- **Page number CSS counters** — `getPageNumberCSS()` in `paginationCSS.ts` generates `@page` margin-box counters for single-column PDFs
- **Ctrl+S / Cmd+S save shortcut** — Global keyboard shortcut triggers markdown save and re-parse

### Fixed
- **List duplication** — `walkTree()` in cv-parser now skips children of `list` nodes, preventing paragraph children from duplicating bullet text into `entry.description`
- **Company name parsing** — 4-tier paragraph detection in cv-parser: `**Company** | Date`, standalone `**Company**`, plain `Company | Date`, date-only fallback; fixes trailing `**` asterisks in company names
- **Entry header layout** — `--entry-layout` set to `column` (org below title, no gap) instead of `row`
- **Double italic** — `--date-line-font-style` default changed from `italic` to `normal` to prevent double italic application
- **On-color fallback** — On-color group entries in SemanticColorControl fall back to `#000000` background instead of light neutral `#f8f9fa`
- **Swatch icon consistency** — Removed `brightness(0.9)` filter from dropdown swatch icons so they match the option row background exactly

### Changed
- Element labels renamed: H2 → "Section", H3 → "Entry" (in Styles tab element list)
- Header Layout control removed from H3/Entry editor (redundant with Org/Date element)
- Meta separator threaded through full rendering pipeline: `renderEntryMeta()` → `renderSections()` → `layoutRenderer` functions

## [1.19.2] - 2026-02-10

### Fixed
- **H1/H2/H3 margin-left/right controls** — Individual margin left/right had no effect; CSS variables `--*-margin-left` and `--*-margin-right` are now generated and applied in both web preview (inline styles) and PDF (semantic CSS)
- **H1/H2/H3 individual padding mode** — Switching to individual padding mode had no effect; padding values are now composed into a CSS shorthand when `paddingMode === 'individual'`
- **Uniform margin mode** — When `marginMode === 'uniform'`, all four margin sides now correctly use `marginUniform` value

## [1.19.1] - 2026-02-10

### Changed
- **Dev server ports** — Frontend changed from 3000 → 4200, backend from 3001 → 4201 to avoid clashes with other local dev apps
- Updated all port references across vite config, env files, API fallback, Express defaults, CORS origin, and legacy shell scripts

## [1.19.0] - 2026-02-10

### Added
- **Linked Color Pair Section** — New `ColorPairSection` component for heading editors (H1/H2/H3)
  - Selecting a pair (e.g., "Custom 1") sets `backgroundColorKey` + `colorKey` (on-variant) together
  - Includes text opacity and background opacity sliders
  - Replaces the separate Background section for heading elements
- **On-color semantic variants** — `on-primary`, `on-secondary`, `on-tertiary`, `on-muted`, `on-custom1–4`
  - Added to `SemanticColorKey` union type, `colorResolver.ts`, and all UI controls
  - Enables proper text-on-background color selection for heading elements
- **Divider gap control** — New spacing slider for dividers on H1/H2/H3 headings
  - CSS variables: `--name-divider-gap`, `--section-header-divider-gap`, `--job-title-divider-gap`
- **Color swatch dropdowns** — `SemanticColorControl` replaced plain `<select>` with custom dropdown showing resolved color swatches
- **Divider HTML in shared renderers** — `sectionRenderer.ts` and `layoutRenderer.ts` now emit divider `<div>` elements, controlled by `display: var(--*-divider-display, none)`

### Fixed
- **PDF preview config sync** — Changed preview-pdf endpoint from GET to POST; frontend sends current config directly in request body, bypassing stale database config
- **Background opacity default** — Changed from `?? 0` (invisible) to `?? 1` (fully opaque) when `backgroundColorKey` is set
- **Section header color fallbacks** — `--section-header-color` and `--section-header-background-color` now conditionally generated only when explicitly set, allowing two-column CSS fallbacks (`accent` for sidebar, `primary` for main) to work correctly
- **Missing `cv-name` class** — Added to `<h1>` elements in `layoutRenderer.ts` so PDF name styling matches

### Changed
- "Divider Width" renamed to "Divider Thickness" in UI
- `semanticCSS.ts` expanded with full CSS properties for H1/H2/H3 (line-height, font-style, border, shadow, `print-color-adjust`)
- Two-column header CSS uses CSS variable fallback chain: `var(--section-header-color, var(--on-primary-color, #ffffff))`

### Technical Insights
- **Conditional CSS variable generation**: Section header color/background are only included in `:root` when user has explicitly set a color pair, otherwise omitted so layout-specific CSS fallbacks work
- **POST config for PDF preview**: Avoids a class of stale-closure/save-timing bugs by sending config directly instead of relying on database state
- **`useRef` for stable config**: PDF preview effect uses `configRef.current` to always send latest config without adding `config` as a dependency (which would cause constant PDF regeneration)

## [1.18.0] - 2026-02-06

### Added
- **Unified Color Picker Popup** — Custom color picker replacing native HTML5 input
  - `react-colorful` saturation/hue mixer at the top
  - Multi-model value input with dropdown selector (HEX, RGB, HSL, OKLCH)
  - Collapsible Tailwind CSS swatch library (22 families × 11 shades)
  - Portal-based rendering to avoid sidebar overflow clipping
  - Viewport-aware positioning: flips above trigger when near bottom of screen

- **Material Design Color Role Presentation** — Color palette displayed as labeled blocks
  - Each role shown as a colored rectangle with its name overlaid in the contrasting "on" color
  - Grouped layout: Primary/Secondary/Tertiary (3-col), Muted/Background (2-col), Border/Link/Link Hover (3-col)
  - Replaced separate Border & Links section — now integrated into the role grid

- **4 Custom Color Pairs** — `Custom 1–4` with corresponding `On Custom 1–4`
  - Configurable in Colors tab under "Custom Colors" collapsible section
  - Assignable in Styles panel via semantic color dropdowns on all elements
  - Default values: Violet-500, Pink-500, Teal-500, Orange-500
  - Full stack support: types, CSS variables (`--custom1-color` etc.), color resolver

### Changed
- `ColorControl` simplified to 30×30 color swatch trigger (no inline hex input)
- Color picker popup extracted to shared `ColorPickerPopup` component used by both `ColorControl` and `ColorRoleBlock`

### Technical Insights
- **Portal positioning**: `ColorPickerPopup` uses `createPortal` to `document.body` to escape the sidebar's `overflow-hidden`/`overflow-y-auto`. Position computed from trigger's `getBoundingClientRect()`, dismissed on scroll/resize
- **Color model conversions**: `colorConversions.ts` provides hex↔RGB↔HSL↔OKLCH with buffered editing (user types freely, parsed on blur/Enter)
- **SemanticColorKey propagation**: Custom colors required updating the union type in `shared/types/index.ts` (~20 occurrences), `colorResolver.ts`, `SemanticColorControl.tsx`, `SemanticElementEditor.tsx`, and `TextStyleControl.tsx`

## [1.17.0] - 2026-02-05

### Changed
- **pnpm Workspaces Migration** - Migrated from npm to pnpm workspaces for monorepo management
  - Root `package.json` with workspace-wide scripts (`pnpm dev`, `pnpm build`, `pnpm test`)
  - `shared/` is now a proper package: `@cv-craft/shared` with exports for types and utils
  - Frontend and backend depend on `@cv-craft/shared: workspace:*`
  - Single `pnpm-lock.yaml` replaces individual `package-lock.json` files

- **Backend Testing Migration** - Replaced Jest with Vitest for unified testing
  - Both frontend and backend now use Vitest
  - Created `backend/vitest.config.ts` with globals, node environment, and setup file
  - Updated `backend/tests/setup.ts` to import from `vitest` instead of `@jest/globals`
  - Deleted `backend/jest.config.js`

### Fixed
- **TypeScript Portability** - Fixed `NodeJS.Timeout` type for cross-environment compatibility
  - Changed to `ReturnType<typeof setTimeout>` in `TemplateConfigPanel.tsx` and `useCVEditor.ts`

### Technical Insights
- **pnpm Workspace Links**: Workspace packages are symlinked (e.g., `node_modules/@cv-craft/shared -> ../../../shared`), enabling direct TypeScript imports without build steps
- **Vitest Globals**: With `globals: true` in vitest config, test files don't need explicit imports for `describe`, `test`, `expect`

## [1.16.4] - 2026-02-05

### Changed
- **Config Panel Header Removed** - Removed redundant header from config panel
  - "Template Config" title and close button removed (toggle is now in toolbar)
  - Panel now starts directly with tabs for more vertical space
  - Removed unused `onClose` prop from TemplateConfigPanel interface

## [1.16.3] - 2026-02-05

### Changed
- **Config Panel Toggle** - Replaced Settings button with toggleable config panel
  - Removed "Settings" button from center toolbar
  - Added config panel toggle button on right side of toolbar (mirrors Editor toggle on left)
  - Config panel visibility persists via localStorage (`cv-craft-config-panel-visible`)
  - Panel opens by default on first visit

### Technical Insights
- **Symmetrical Panel Toggles**: Editor toggle (left sidebar) and Config toggle (right sidebar) now use the same visual pattern - highlighted when panel is visible, using mirrored `SidebarSimple` icons.

## [1.16.2] - 2026-01-18

### Fixed
- **HTML/PDF Styling Consistency** - Fixed CSS variable mismatches causing visual differences between preview and PDF
  - H2 section headers: Changed from `--h3-font-size` to `--section-header-font-size` (was 20% smaller in PDF)
  - H2 margins: Changed hardcoded `8px`/`12px` to use `--section-header-margin-top` variable
  - H3 job titles in sidebar: Changed from `--small-font-size` to `--job-title-font-size` for consistency

### Technical Insights
- **CSS Specificity in Hybrid Rendering**: When HTML preview uses inline styles (higher specificity) and PDF uses stylesheet rules, both must reference the same CSS variables to ensure visual consistency. The `semanticCSS.ts` two-column overrides were using wrong variables.

## [1.16.1] - 2026-01-18

### Changed
- **Consistent CollapsibleSection UI** - All Template Config tabs now use CollapsibleSection components
  - Colors tab: "Main Colors", "Border & Links" sections
  - Page tab: "Page Size", "Page Layout", "Page Margins", "PDF Export" sections
  - Etc. tab: "Font Library", "Preferences", "Custom CSS" sections
  - Each section has contextual Tabler icons for visual consistency

### Fixed
- **React Hooks Violation Crash** - Fixed app crash when clicking Date/Tag/Link/Contact/Photo/Page# in Styles tab
  - Removed invalid `useCallback` usage inside nested render functions
  - Hooks must be called at top level of components, not inside nested functions

### Technical Insights
- **React Rules of Hooks**: Never use hooks (`useCallback`, `useState`, etc.) inside nested functions, loops, or conditions. If a nested function needs memoization, either move the hook to component top level or use plain functions if memoization isn't critical.

## [1.16.0] - 2026-01-18

### Added
- **LinkedSpacingControl Component** - New UI control for margin/padding with uniform/individual modes
  - Toggle between uniform (all sides equal) and individual (per-side) spacing
  - Link/unlink icons indicate mode; individual mode shows Top/Right/Bottom/Left inputs
  - Added to SpacingSection for heading elements (Name, H2, H3) and Photo

- **Tabler Icons Integration** - Replaced Phosphor icons with Tabler icons throughout config panel
  - Tab icons: Colors (palette), Styles (typography), Page (file), Advanced (settings)
  - Section headers with contextual icons throughout all tabs
  - Element selector icons: H1, H2, H3, calendar, tag, link, etc.
  - CollapsibleSection now supports optional `icon` prop

### Changed
- **Type Definitions Extended** - Added margin/padding mode support to component types
  - `marginMode`, `marginUniform`, `marginTop/Right/Bottom/Left` for name, sectionHeader, jobTitle, profilePhoto
  - `paddingMode`, `paddingUniform`, `paddingTop/Right/Bottom/Left` for heading components

### Technical Insights
- **Icon Library Migration**: Tabler icons use `stroke` prop for weight (1.5 default, 2.5 for bold) vs Phosphor's `weight` prop
- **Linked Spacing Pattern**: Store both uniform and individual values; mode determines which is applied. Preserves user input when switching modes.

## [1.15.0] - 2026-01-18

### Changed
- **Unified Styles Tab** - Merged Typography and Components tabs into single "Styles" tab
  - New `SemanticElementEditor` component with horizontal tag selector
  - 7 semantic elements: Base, Name, Section, Date, Tag, Link, Contact
  - Property editors organized in collapsible sections (Typography, Spacing, Border)
  - Reduced TemplateConfigPanel from ~800 lines to ~400 lines

### Fixed
- **Italic Font Rendering** - Fixed faux-italic in HTML preview
  - Google Fonts now load with italic variants using `ital,wght@0,400;...;1,400;...` syntax
  - Added `font-synthesis: none` to prevent browser-generated faux styles
  - Updated `GoogleFontsService.ts` and `cssVariableGenerator.ts` font loading

### Technical Insights
- **Google Fonts API v2 Italic Syntax**: To load true italic variants, use axis tuple format: `family=Inter:ital,wght@0,400;0,700;1,400;1,700` where `0` = regular, `1` = italic
- **Semantic Element Pattern**: Group related UI controls by semantic meaning (what it styles) rather than property type (colors/spacing) for better discoverability

## [1.14.1] - 2026-01-18

### Fixed
- **Sidebar Content Overflow** - Nested elements no longer extend beyond sidebar container
  - Separated `.sidebar-container` (layout) from `.sidebar` (text styling) in CSS
  - Added `overflow: hidden` and `max-width: 100%` constraints to sidebar
  - Reduced bullet indentation in sidebar (1.5rem → 1rem) to prevent overflow
- **Heading Padding Inconsistency** - Web and PDF now have matching heading spacing
  - Added scoped heading reset (margin: 0, line-height: 1.2) to web preview
  - Web preview was using browser defaults; now matches PDF's explicit styles
  - Added `cv-preview-content` wrapper class for scoped styling

### Technical Insights
- **CSS Class Separation**: Layout properties (width, padding) belong on container class; text/color overrides on content class. Mixing causes conflicts when same class applied at different nesting levels.
- **Browser Defaults**: Web preview needs explicit heading resets to match PDF's `* { margin: 0 }` - don't assume Tailwind or React reset these.

## [1.14.0] - 2026-01-18

### Changed
- **Unified Style Pipeline** - Single source of truth for web and PDF styling
  - Created modular CSS generators in `shared/utils/`: `semanticCSS.ts`, `paginationCSS.ts`
  - Created HTML renderers: `layoutRenderer.ts`, `contactRenderer.ts`, `photoRenderer.ts`
  - Refactored pdf-generator from ~3468 lines to ~570 lines using shared utilities
  - All CSS now uses CSS variables (no hardcoded pt/px values in PDF)

### Fixed
- **Photo Size Mismatch** - Both web and PDF now use `--profile-photo-size` (160px default)
- **Photo Border Mismatch** - Both now use `--profile-photo-border` (3px solid #e2e8f0 default)
- **Section Header Styling** - Fixed CSS selector mismatch (`main` → `main-content`) in PDF
- **Sidebar H3 Font Size** - Web preview now uses `--h3-font-size` CSS variable instead of Tailwind's `text-sm`

### Technical Insights
- **CSS Selector Consistency**: PDF's `generateColumnHTML()` now outputs `class="main-content"` to match CSS selectors `.main-content .cv-section > h2.section-header`
- **Inline Style Fallbacks**: When using CSS variables in inline styles, fallbacks must match the default values in `cssVariableGenerator.ts`
- **DRY CSS Architecture**: Export CSS as functions (`getPhotoCSS()`, `getContactCSS()`, etc.) that can be composed for different contexts

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
