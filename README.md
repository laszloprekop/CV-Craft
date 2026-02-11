# CV-Craft

A full-stack CV/Resume generator built with TypeScript. Write your CV in Markdown with YAML frontmatter, customize styling through a visual config panel, preview changes in real time, and export to PDF.

## Features

- **Markdown-based editing** with Monaco Editor (syntax highlighting, autocomplete)
- **YAML frontmatter** for structured contact information
- **Real-time preview** with live CSS variable updates
- **Template system** with saveable/loadable theme presets
- **Semantic color system** with base color pairs, text colors, and custom palette slots
- **Component-level styling** for headings, body text, list bullets, tags, dates, and more
- **Two-column layout** with configurable sidebar/main split and per-column backgrounds
- **PDF export** via Puppeteer with accurate A4 pagination
- **Forced page breaks** using `<!-- break -->` markers in markdown
- **Asset management** for profile photos and documents
- **Auto-save** with debounced persistence to SQLite

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, styled-components |
| Backend | Express, TypeScript, SQLite (better-sqlite3) |
| Shared | `@cv-craft/shared` workspace package (types, utilities) |
| PDF | Puppeteer (headless Chromium) |
| Editor | Monaco Editor |
| Testing | Vitest |

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **pnpm** 8+

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd CV-Craft

# Install dependencies
pnpm install

# Start both frontend and backend
pnpm dev
```

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:4201/api
- **Health check:** http://localhost:4201/health

## Project Structure

```
CV-Craft/
├── frontend/           # React + Vite web application
│   └── src/
│       ├── components/ # UI components (CVPreview, TemplateConfigPanel, etc.)
│       ├── pages/      # Route pages (CVManagerPage, CVEditorPage)
│       ├── hooks/      # Custom hooks (useCVEditor, useTemplates)
│       ├── services/   # API client layer
│       └── styles/     # Tailwind + styled-components
│
├── backend/            # Express API server
│   └── src/
│       ├── api/routes/ # REST endpoints (cvs, templates, assets)
│       ├── services/   # Business logic (CVService, TemplateService)
│       ├── lib/        # Core libraries (cv-parser, pdf-generator)
│       └── database/   # SQLite schema and connection
│
├── shared/             # @cv-craft/shared workspace package
│   ├── types/          # TypeScript interfaces (TemplateConfig, CVSection, etc.)
│   └── utils/          # Shared utilities (cssVariableGenerator, colorResolver, sectionRenderer)
│
└── docs/               # Documentation
```

## Commands

```bash
# Development
pnpm dev              # Start frontend + backend in parallel
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages

# Package-specific
cd frontend && pnpm dev        # Frontend only (port 4200)
cd backend && pnpm dev         # Backend only (port 4201)
cd backend && pnpm test        # Backend tests
cd frontend && pnpm test       # Frontend tests
```

## How It Works

1. **Edit** your CV in Markdown with YAML frontmatter for contact details
2. **Customize** colors, fonts, spacing, and component styles in the config panel
3. **Preview** changes instantly in the browser with approximate page markers
4. **Export** to PDF — the backend renders HTML through Puppeteer for pixel-accurate output

The config panel has four tabs:
- **Colors** — semantic color palette (primary, secondary, tertiary, muted, text, background, custom slots)
- **Styles** — element-level controls for headings, body text, list bullets, tags, dates, links
- **Page** — page dimensions, margins, column layout, PDF settings
- **Etc.** — Google Fonts loading, custom CSS overrides

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system design, data flow, patterns
- [API Reference](docs/API.md) — REST endpoint documentation
- [Database Schema](docs/DATABASE.md) — SQLite tables, indexes, JSON structures
- [Changelog](docs/CHANGELOG.md) — version history
- [Development Scripts](docs/DEV-SCRIPTS-README.md) — legacy shell script usage

## License

MIT
