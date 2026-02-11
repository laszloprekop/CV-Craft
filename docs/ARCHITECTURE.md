# CV-Craft Architecture Documentation

**Version:** 1.22.0
**Last Updated:** February 2026

## Overview

CV-Craft is a full-stack CV/Resume generation application built as a TypeScript monorepo. It enables users to create, style, and export professional CVs through an intuitive web interface with real-time preview and PDF export capabilities.

### Key Characteristics

- **Architecture**: pnpm monorepo with three workspace packages (frontend, backend, @cv-craft/shared)
- **Technology Stack**: React + TypeScript (frontend), Express + TypeScript (backend), SQLite (database)
- **Build Tools**: Vite (frontend), TypeScript compiler (backend), pnpm workspaces
- **Testing**: Vitest (unified across frontend and backend)
- **Core Features**: Markdown-based CV editing, real-time preview, PDF generation, template customization, semantic color system

---

## Project Structure

```
CV-Craft/
├── package.json                 # Root workspace config (pnpm)
├── pnpm-workspace.yaml          # Workspace definition
├── pnpm-lock.yaml               # Lockfile
│
├── frontend/                    # React web application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API integration
│   │   ├── styles/             # Styled-components & Tailwind
│   │   ├── utils/              # Frontend utilities
│   │   └── themes/             # Theme definitions
│   ├── package.json            # Depends on @cv-craft/shared
│   └── vite.config.ts
│
├── backend/                     # Express API server
│   ├── src/
│   │   ├── api/routes/         # API route handlers
│   │   ├── services/           # Business logic
│   │   ├── models/             # Data models & ORM
│   │   ├── lib/                # Core libraries (parser, PDF generator)
│   │   ├── database/           # Database setup & migrations
│   │   └── middleware/         # Express middleware
│   ├── package.json            # Depends on @cv-craft/shared
│   ├── vitest.config.ts        # Test configuration
│   └── cv-craft.db             # SQLite database
│
├── shared/                      # @cv-craft/shared package
│   ├── package.json            # Package exports for types & utils
│   ├── types/                  # TypeScript interfaces & types
│   └── utils/                  # Shared utilities
│
├── docs/                        # Documentation
├── exports/                     # Generated PDFs & web packages
├── start-dev.sh                # Development startup script (legacy)
├── stop-dev.sh                 # Development stop script (legacy)
└── view-logs.sh                # Log viewing script (legacy)
```

### Monorepo Benefits

- **pnpm Workspaces**: Single lockfile, efficient disk usage via symlinks, unified commands
- **Shared Package**: `@cv-craft/shared` is a proper package with exports for types and utils
- **Unified Testing**: Vitest across all packages (replaced Jest in backend)
- **Single Source of Truth**: Templates and configurations are defined once and used consistently

---

## Frontend Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 | Component-based UI |
| Build Tool | Vite | Fast development & production builds |
| Language | TypeScript | Type-safe development |
| Styling | Tailwind CSS + Styled-components | Component & utility styling |
| Routing | React Router DOM | Client-side navigation |
| HTTP Client | Axios | API communication |
| Editor | Monaco Editor | Code editing interface |

### Component Hierarchy

```
App
├── Header
└── Routes
    ├── CVManagerPage
    │   ├── CV List
    │   ├── Template List
    │   └── Create/Import UI
    │
    └── CVEditorPage
        ├── EditorLeftHeader
        ├── EditorContainer
        │   ├── EditorPane (MonacoEditor)
        │   ├── ResizeHandle
        │   └── PreviewPane (CVPreview)
        ├── EditorRightHeader
        ├── TemplateConfigPanel
        │   ├── Colors Tab (SemanticColorEditor)
        │   ├── Styles Tab (SemanticElementEditor)
        │   │   ├── Headings sub-tab (H1/H2/H3)
        │   │   ├── Body sub-tab (text, list bullets)
        │   │   ├── Org/Date sub-tab
        │   │   └── Tags/Links sub-tab
        │   ├── Page Tab (layout, margins, columns, PDF)
        │   └── Etc. Tab (Google Fonts, custom CSS)
        ├── AssetUploader
        └── ExportPanel
```

### State Management

**Primary Hook**: `useCVEditor(cvId?: string)`
- Manages CV content, settings, and config
- Handles auto-save (30-second interval with debounce)
- Provides save status tracking
- Integrates with API for persistence

**Component-Level State**:
- `useState` for local UI state
- `useRef` for debounce timers and measurements
- `useMemo` for computed values

### Data Flow: Editor to Preview

```
MonacoEditor Content Change
  ↓
useCVEditor.updateContent()
  ↓
CVPreview receives liveContent prop
  ↓
parseMarkdownContent() (client-side parsing)
  ↓
Generate HTML with CSS Variables
  ↓
Apply TemplateConfig styling
  ↓
Render with scrollable container
  ↓
(Auto-save triggers after 30 seconds)
```

---

## Backend Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Express | HTTP server |
| Language | TypeScript | Type-safe server code |
| Database | SQLite + better-sqlite3 | Data persistence |
| PDF Generation | Puppeteer | Headless browser rendering |
| Markdown Parsing | Remark + Rehype | CV content parsing |
| Security | Helmet | HTTP header security |
| Rate Limiting | express-rate-limit | DDoS protection |

### Service Layer

```
src/
├── api/routes/
│   ├── cvs.ts           # CV CRUD + export endpoints
│   ├── templates.ts     # Template management
│   └── assets.ts        # Asset upload/retrieval
│
├── services/
│   ├── CVService.ts     # CV business logic
│   ├── TemplateService.ts
│   └── AssetService.ts
│
├── models/
│   ├── CVInstance.ts    # CV data model
│   ├── Template.ts
│   └── Asset.ts
│
└── lib/
    ├── cv-parser/       # Markdown parsing
    └── pdf-generator/   # PDF generation
```

### Request/Response Format

**Standard API Response**:
```typescript
{
  data: T,
  success: boolean,
  message?: string
}
```

**Paginated Response**:
```typescript
{
  data: T[],
  total: number,
  limit: number,
  offset: number,
  success: boolean
}
```

**Error Response**:
```typescript
{
  error: string,     // error code
  message: string,   // human readable
  details?: object
}
```

---

## Shared Code

### Core Types (`shared/types/index.ts`)

1. **CVInstance** - CV document representation
2. **Template** - CV template definition
3. **TemplateConfig** - Comprehensive template configuration
   - colors, typography, layout, components, pdf, advanced
4. **TemplateSettings** - Legacy settings (backward compatibility)
5. **Asset** - File storage reference
6. **ParsedCVContent** - Markdown parsing result

### CSS Variable Generator (`shared/utils/cssVariableGenerator.ts`)

Generates CSS custom properties from TemplateConfig:

```css
--primary-color, --on-primary-color
--secondary-color, --on-secondary-color
--heading-font-family, --body-font-family
--title-font-size, --h2-font-size, --body-font-size
--tag-bg-color, --tag-text-color
... (100+ variables)
```

### Color Resolver (`shared/utils/colorResolver.ts`)

Maps semantic color keys to actual values:
- `resolveSemanticColor(colorKey, config, opacity)` → hex/rgba
- `hexToRgba(hex, opacity)` → rgba string
- `resolveColorPair(colorPair, config)` → base + contrast color

---

## Key Features

### 1. Markdown-Based CV Editing

- Monaco Editor for syntax highlighting
- YAML frontmatter for contact info
- Real-time validation
- Remark/Rehype parsing pipeline

### 2. Real-Time Preview

- Client-side markdown parsing
- Dynamic CSS variable application
- Zoom controls (fit-width, fit-height, actual-size, custom)
- PDF overflow detection with warnings

### 3. Template System

**Multi-Layer Configuration:**
1. Template Definition (CSS + TemplateConfig)
2. Default Configuration (per-template baseline)
3. User Configuration (custom settings per CV)
4. Migration System (upgrades legacy configs)

### 4. PDF Generation

**Process:**
1. Initialize headless Chromium (Puppeteer)
2. Set A4 viewport (794x1123 pixels)
3. Generate HTML with template CSS
4. Render to PDF with print settings
5. Return download link

**Quality Features:**
- Exact A4 measurements (210mm × 297mm)
- High resolution (2x device scale)
- Print background colors
- Google Fonts integration

### 5. Semantic Color System

**Base Pairs:**
- primary / onPrimary
- secondary / onSecondary
- tertiary / onTertiary
- muted / onMuted

**Text Colors:**
- text (primary)
- textSecondary
- textMuted

### 6. Auto-Save

- 30-second interval
- Debounced to prevent excessive API calls
- Tracks unsaved changes
- Saves on navigation/unmount
- Visual feedback (saving → saved → idle)

---

## Data Flow Diagrams

### Create New CV

```
Frontend: "Create" Button
  ↓
CVEditorPage (no ID)
  ↓
useCVEditor() loads default content
  ↓
User edits in MonacoEditor
  ↓
updateContent() → hasUnsavedChangesRef
  ↓
Auto-save timer → saveCv()
  ↓
POST /api/cvs
  ↓
Backend: CVService.create()
  ├─ Validate markdown
  ├─ Get template
  ├─ Parse with Remark/Rehype
  └─ Store in database
  ↓
Frontend: Navigate to /editor/{newId}
```

### PDF Export

```
User: "Export → PDF"
  ↓
Save CV if unsaved
  ↓
POST /api/cvs/{id}/export {type: 'pdf'}
  ↓
Backend: CVService.exportCV()
  ├─ Load CV + template
  ├─ Initialize Puppeteer
  ├─ Generate HTML
  ├─ Render PDF
  └─ Save to /exports
  ↓
Frontend: Download link
  ↓
Browser downloads PDF
```

---

## Development Setup

### Quick Start (pnpm)

```bash
# Install all dependencies
pnpm install

# Start both frontend and backend in parallel
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test
```

### Legacy Scripts (still work)

```bash
./start-dev.sh   # Start both servers
./view-logs.sh   # View logs
./stop-dev.sh    # Stop servers
```

### Manual Start

```bash
# Terminal 1: Backend
cd backend
pnpm dev  # Port 4201

# Terminal 2: Frontend
cd frontend
pnpm dev  # Port 4200
```

### Environment Variables

**Frontend (.env):**
```
VITE_API_URL=http://localhost:4201/api
```

**Backend (.env):**
```
PORT=4201
DATABASE_PATH=cv-craft.db
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
```

---

## Architectural Patterns

### Patterns Used

1. **Service Layer** - CVService, TemplateService, AssetService
2. **Repository/Model** - CVInstanceModel, TemplateModel
3. **Factory** - createCVService(), createTemplateModel()
4. **Middleware** - Error handling, validation, logging
5. **Custom Hooks** - useCVEditor, useTemplates, useGoogleFonts
6. **Component Composition** - Reusable controls, collapsible sections

### Security Measures

- Helmet.js for HTTP security headers
- CORS with strict origin checking
- Rate limiting (100 req/15min production)
- Joi input validation
- SQL injection prevention (prepared statements)
- File upload validation (10MB limit)
- XSS prevention (React escaping + DOMPurify)

### Performance Optimizations

- Debounced config updates (1 second)
- Memoized computed values
- Lazy font loading
- Database indexes for common queries
- SQLite WAL mode for concurrency
- Lazy component loading

---

## Related Documentation

- [API Reference](./API.md)
- [Database Schema](./DATABASE.md)
- [Changelog](./CHANGELOG.md)
- [Development Scripts](./DEV-SCRIPTS-README.md)
