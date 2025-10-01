# Changelog

All notable changes to CV-Craft will be documented in this file.

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
