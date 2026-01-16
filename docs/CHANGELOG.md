# Changelog

All notable changes to CV-Craft will be documented in this file.

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
