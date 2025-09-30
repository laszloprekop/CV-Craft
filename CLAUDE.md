# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CV-Craft is a webapp for creating static CV websites and PDFs from structured Markdown files. Users edit Markdown CVs in a Monaco editor with live preview, customize templates via color pickers, and export to PDF or static HTML/CSS packages.

## Architecture

**Monorepo Structure:**
- `backend/` - Express.js API (port 3001) with SQLite database
- `frontend/` - React SPA (port 3000) with Vite dev server
- `shared/` - TypeScript types shared between frontend/backend

**Backend (`backend/src/`):**
- `app.ts` - Express server entry point with CORS, middleware setup
- `api/routes/` - REST endpoints: `/api/cvs`, `/api/templates`, `/api/assets`, `/api/exports`
- `services/` - Business logic: `CVService`, `TemplateService`, `AssetService`
- `lib/` - Reusable libraries:
  - `cv-parser/` - Remark-based Markdown parser with frontmatter extraction
  - `template-engine/` - HTML/CSS generation with styled-components
  - `pdf-generator/` - Puppeteer wrapper for PDF rendering
  - `storage-manager/` - File upload/download handling
- `models/` - SQLite schema definitions and validation
- `database/` - Database initialization and migrations

**Frontend (`frontend/src/`):**
- `App.tsx` - Root component with routing
- `pages/` - Main views:
  - `CVEditorPage.tsx` - Split-pane editor with Monaco + live preview
  - `CVManagerPage.tsx` - CV list/management dashboard
- `components/` - Reusable UI:
  - `CVPreview.tsx` - Renders parsed CV HTML with styled-components
  - `EditorLeftHeader.tsx` / `EditorRightHeader.tsx` - Toolbar controls
  - `SettingsPanel.tsx` - Template customization (color pickers, settings)
  - `ExportPanel.tsx` - PDF/HTML export co≠ntrols
  - `AssetUploader.tsx` - Drag-drop file uploads
- `services/` - API client wrappers
- `hooks/` - Custom React hooks (debouncing, state management)
- `themes/` - styled-components theme definitions

**Database (SQLite with better-sqlite3):**
```sql
cv_instances (id, name, content, parsed_content, template_id, settings, status, created_at, updated_at)
templates (id, name, css, config_schema, default_settings, preview_image, is_active)
assets (id, cv_id, filename, file_type, storage_path, uploaded_at)
exports (id, cv_id, export_type, filename, file_path, generated_at)
```

## Development Commands

**Backend:**
```bash
cd backend
npm run dev        # Start dev server with nodemon + ts-node (hot reload)
npm run build      # Compile TypeScript to dist/
npm start          # Run compiled production build
npm test           # Run Jest tests
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix lint issues
```

**Frontend:**
```bash
cd frontend
npm run dev        # Start Vite dev server (port 3000)
npm run build      # Production build (TypeScript check + Vite bundle)
npm run preview    # Preview production build locally
npm test           # Run Vitest unit tests
npm run test:ui    # Interactive test UI
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix lint issues
```

**Running Both:**
Start backend first (`cd backend && npm run dev`), then frontend (`cd frontend && npm run dev`). Frontend proxies API requests to `http://localhost:3001`.

## Key Patterns

**CV Parsing Flow:**
1. User types Markdown in Monaco editor (frontend)
2. Frontend debounces input (300ms) and sends to `/api/cvs/:id` PUT
3. Backend `cv-parser` extracts frontmatter + parses Markdown with Remark
4. `template-engine` generates HTML with selected template + custom settings
5. Frontend receives HTML and renders in `CVPreview` iframe/sandboxed div

**Template System:**
- Templates stored in `templates` table with `config_schema` (JSON Schema)
- `SettingsPanel` dynamically renders color pickers based on schema
- Theme changes trigger re-render via styled-components CSS Custom Properties
- Preview updates must match PDF output exactly (same CSS)

**Export Behavior:**
- PDF: Puppeteer renders HTML → saves as `FirstName_LastName_CV.pdf`
- Static web: Archives HTML + CSS + assets into ZIP file
- Exports tracked in `exports` table for download history

## Key Reference Files

- `_references/project_specification.md` - Complete feature requirements
- `_references/laszlo_frontend_cv.md` - Sample CV Markdown structure
- `_references/CV_sample.pdf` - Target PDF output quality
