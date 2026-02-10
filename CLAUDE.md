# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CV-Craft is a TypeScript monorepo webapp for creating CVs from Markdown. Users edit in a Monaco editor with live preview, customize styling via a template config panel, and export to PDF.

**Structure:** `frontend/` (React + Vite, port 4200) | `backend/` (Express + SQLite, port 4201) | `shared/` (types & utilities)

## Development Commands

**Monorepo (pnpm workspaces):**
```bash
pnpm dev             # Start both frontend and backend in parallel
pnpm build           # Build all packages
pnpm test            # Run all tests (Vitest)
pnpm lint            # Lint all packages
```

**Legacy scripts (still work):**
```bash
./start-dev.sh       # Start both servers
./stop-dev.sh        # Stop servers
./view-logs.sh       # View logs
```

**Package-specific:**
```bash
cd backend
pnpm dev             # Dev server with hot reload
pnpm test            # Run Vitest tests
pnpm vitest -- CVService  # Run tests matching pattern
pnpm lint:fix        # Auto-fix lint issues

cd frontend
pnpm dev             # Vite dev server
pnpm test            # Run Vitest tests
pnpm lint:fix        # Auto-fix lint issues
```

## Key Files for Common Changes

| Task | Files to Modify |
|------|-----------------|
| CV preview rendering | `frontend/src/components/CVPreview.tsx` |
| PDF generation | `backend/src/lib/pdf-generator/index.ts` |
| Markdown parsing | `backend/src/lib/cv-parser/index.ts` |
| Template config UI | `frontend/src/components/TemplateConfigPanel.tsx` |
| CSS variable generation | `shared/utils/cssVariableGenerator.ts` |
| Type definitions | `shared/types/index.ts`, `shared/types/defaultTemplateConfig.ts` |
| CV CRUD operations | `backend/src/services/CVService.ts` |

## Current Architecture State

**Web/PDF Rendering Divergence:** The web preview (`CVPreview.tsx`) and PDF generator use different rendering approaches. PDF uses a shared renderer (`shared/utils/sectionRenderer.ts`), but web preview still uses manual JSX. This causes styling inconsistencies between preview and exported PDF. See `docs/UNIFIED_RENDERING_STATUS.md` for details.

**Preview Modes:** CVPreview has two modes:
- `html` (default) - fast HTML preview with optional page markers toggle
- `exact-pdf` - embeds backend-generated PDF for accurate pagination

Page markers show approximate A4 page break positions as red dashed lines. Toggle visibility persists in localStorage.

## Important Patterns

**Template Config Flow:**
1. User adjusts settings in `TemplateConfigPanel`
2. `onChange` updates live preview immediately (no save)
3. `onChangeComplete` (debounced 1s) saves to database
4. `generateCSSVariables()` in shared/ creates CSS custom properties used by both web and PDF

**CV Data Flow:**
1. User edits Markdown in Monaco editor
2. Frontend debounces (300ms) and calls PUT `/api/cvs/:id`
3. Backend parses with Remark, extracts frontmatter, stores in SQLite
4. Frontend receives parsed content and renders preview

**Config Merge Priority:** `liveConfigChanges` > `savedConfig` > `template.default_config` > `DEFAULT_TEMPLATE_CONFIG`

## Conventions

- **Shared code:** Any utility needed by both frontend and backend goes in `shared/`
- **CSS variables:** All styling uses CSS custom properties from `generateCSSVariables()`
- **Type safety:** Changes to data shapes require updating `shared/types/index.ts`
- **Deep merge:** Config updates use deep merge to preserve nested properties (never shallow spread)

## Commit Snapshot Protocol

When completing features, bug fixes, or significant changes, use the `/snapshot` command to trigger the standardized commit routine.

**The protocol handles:**
1. Validation (build both frontend and backend)
2. Documentation updates (identifies which docs need changes)
3. CHANGELOG.md version entry
4. Bumping both package.json versions
5. Conventional commit message generation
6. Git staging and commit

**See:** `docs/COMMIT-PROTOCOL.md` for complete guidelines

**Key principles:**
- Always update `docs/CHANGELOG.md`
- Only update `CLAUDE.md` for truly essential patterns
- Use conventional commit format (`feat`, `fix`, `refactor`, etc.)
- Bump BOTH `frontend/package.json` and `backend/package.json`

## Reference Files

- `_references/project_specification.md` - Original feature requirements
- `_references/laszlo_frontend_cv.md` - Sample CV Markdown structure
- `_references/CV_sample.pdf` - Target PDF output quality
- `docs/ARCHITECTURE.md` - Detailed system architecture
- `docs/API.md` - API endpoint documentation
- `docs/DATABASE.md` - Database schema
