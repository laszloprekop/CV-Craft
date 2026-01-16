# Commit Snapshot Protocol

This document defines the standardized process for creating production-ready commit snapshots in CV-Craft.

## When to Create a Snapshot

Trigger the snapshot routine when:

- ✅ **New Feature Complete**: Feature is functional and ready for production
- ✅ **Feature Refinement Done**: Improvements to existing feature are complete
- ✅ **Bug Fix Complete**: Issue is resolved and verified
- ✅ **Architecture Change**: Significant refactoring or pattern changes
- ✅ **Performance Optimization**: Measurable performance improvements
- ✅ **Documentation Update**: Major docs reorganization or additions

**Do NOT snapshot:**
- ❌ Work in progress / incomplete features
- ❌ Experimental changes not yet validated
- ❌ Temporary debugging code
- ❌ Minor typo fixes (unless part of larger change)

## Snapshot Process Checklist

### Phase 1: Validation

CV-Craft is a monorepo with separate frontend and backend builds:

**Backend:**
```bash
cd backend
npm run build      # Compile TypeScript
npm run lint       # ESLint check
npm test           # Run Jest tests (optional but recommended)
```

**Frontend:**
```bash
cd frontend
npm run build      # Vite production build with TypeScript check
npm run lint       # ESLint check
npm test           # Run Vitest tests (optional but recommended)
```

**Quick validation (both):**
```bash
cd backend && npm run build && npm run lint && cd ../frontend && npm run build && npm run lint
```

- [ ] Backend build completes without errors
- [ ] Frontend build completes without errors
- [ ] No critical linting errors
- [ ] Manual testing: Feature works as expected

### Phase 2: Documentation Updates

#### 2.1 Identify Documentation Type

Categorize the changes to determine which docs need updates:

**Architecture Changes** → `docs/ARCHITECTURE.md`
- New major patterns or approaches
- Component architecture redesigns
- State management changes
- Performance optimization strategies

**Web/PDF Rendering Changes** → `docs/UNIFIED_RENDERING_STATUS.md`
- Changes to CVPreview.tsx rendering
- PDF generator modifications
- Shared renderer updates
- Progress on web/PDF unification

**API Changes** → `docs/API.md`
- New endpoints
- Request/response format changes
- Authentication changes

**Database Changes** → `docs/DATABASE.md`
- Schema modifications
- New tables or columns
- Migration notes

**General Guidance** → `CLAUDE.md`
- **ONLY** if it changes "how to work with this codebase RIGHT NOW"
- New essential patterns ALL developers must know immediately
- Changes to project structure, commands, or critical workflows
- **NOT** for feature details, bug fixes, or version-specific notes

#### 2.2 Documentation Update Guidelines

**For each relevant doc file:**

1. **Add version header** (if applicable):
   ```markdown
   ## Feature Name (v1.X.Z)
   ```

2. **Use clear structure**:
   - **Problem/Context**: What was the issue or goal?
   - **Solution**: How was it solved?
   - **Implementation Details**: Key technical decisions
   - **Code Examples**: Show patterns, not full implementations
   - **Lessons Learned**: What would you do differently?

3. **Include file references**:
   - Use format: `frontend/src/components/CVPreview.tsx:123`
   - Makes it easy to navigate to relevant code

4. **Add cross-references**:
   - Link to related docs: `See [ARCHITECTURE.md](./ARCHITECTURE.md#section)`

#### 2.3 Always Update CHANGELOG.md

Add entry to `docs/CHANGELOG.md`:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Modified behavior description

### Fixed
- Bug fix description

### Technical Insights
- Key insight worth remembering for future development
```

**Version numbering:**
- **Major (X.0.0)**: Breaking changes, major architecture shifts
- **Minor (0.X.0)**: New features, significant enhancements
- **Patch (0.0.X)**: Bug fixes, minor improvements

#### 2.4 Bump package.json Versions

CV-Craft has TWO package.json files that must be updated together:

1. **Edit frontend/package.json**: Change `"version": "1.X.Y"` to new version
2. **Edit backend/package.json**: Change `"version": "1.X.Y"` to same version
3. **Commit together**: Both version bumps in the same commit

**Consistency check:**
- CHANGELOG.md: `## [1.8.0] - 2026-01-16`
- frontend/package.json: `"version": "1.8.0"`
- backend/package.json: `"version": "1.8.0"`
- All three MUST match

### Phase 3: Conventional Commit

#### 3.1 Commit Type Prefixes

Use conventional commit format: `type(scope): description`

**Common types:**
- `feat`: New feature for the user
- `fix`: Bug fix for the user
- `refactor`: Code change that neither fixes bug nor adds feature
- `perf`: Performance improvement
- `docs`: Documentation only changes
- `style`: Formatting, missing semicolons, etc (not CSS)
- `test`: Adding or correcting tests
- `chore`: Updating build tasks, dependencies, etc

**CV-Craft scope examples:**
- `feat(preview)`: Preview rendering feature
- `fix(pdf)`: PDF generation bug fix
- `perf(parser)`: Parser performance improvement
- `refactor(config)`: Template config refactoring
- `feat(editor)`: Editor feature
- `fix(api)`: Backend API fix

#### 3.2 Commit Message Structure

```
type(scope): short description (50 chars max)

Detailed explanation of what changed and why (optional, wrap at 72 chars).

Implementation details:
- Key technical decision 1
- Key technical decision 2

Files modified:
- frontend/src/components/CVPreview.tsx: what changed
- backend/src/lib/pdf-generator/index.ts: what changed
- docs/ARCHITECTURE.md: added section on X

Closes #123 (if applicable)
```

#### 3.3 Commit Message Guidelines

**DO:**
- ✅ Use imperative mood: "Add feature" not "Added feature"
- ✅ Start with lowercase after type: `feat: add clustering`
- ✅ Be specific: "Fix PDF font rendering at export" not "Fix bug"
- ✅ Include context in body for non-trivial changes
- ✅ List key files modified in body
- ✅ Reference issue numbers if applicable

**DON'T:**
- ❌ Use vague descriptions: "Fix stuff", "Update things"
- ❌ Include AI branding: "Generated with Claude Code"
- ❌ Write essays in subject line
- ❌ Forget to stage documentation updates
- ❌ Commit broken builds

### Phase 4: Git Operations

1. **Stage changes**: `git add -A` or selectively add files
2. **Verify staging**: `git status --short` to review
3. **Preview diff**: `git diff --staged` for final check (optional)
4. **Commit with message**: Follow conventional commit format
5. **Verify commit**: `git log --oneline -1` to confirm

### Phase 5: Post-Commit

- [ ] **Push to remote** (if ready): `git push`
- [ ] **Verify build** (if CI/CD): Check build passes
- [ ] **Create PR** (if using PR workflow): Include commit message as PR description
- [ ] **Tag release** (if appropriate): `git tag v1.X.Y && git push --tags`

## Examples

### Example 1: New Feature Snapshot

**Trigger**: Completed new template config option for sidebar width

**Validation:**
```bash
cd backend && npm run build && npm run lint  # ✓ Success
cd frontend && npm run build && npm run lint  # ✓ Success
```

**Documentation:**
- Update `docs/ARCHITECTURE.md`: Add "Sidebar Width Configuration" section
- Update `docs/CHANGELOG.md`: Add v1.8.0 entry
- Skip `CLAUDE.md`: Not a new essential pattern for ALL developers

**Commit:**
```
feat(config): add configurable sidebar width for two-column layout

Added sidebar width configuration option to TemplateConfig allowing users
to adjust the left column width in the Modern Professional template.

Implementation details:
- Added sidebarWidth to layout config (default: 35%)
- CSS variable --sidebar-width applied in CVPreview
- PDF generator uses same variable for consistent output

Files modified:
- shared/types/index.ts: Added sidebarWidth to LayoutConfig
- frontend/src/components/CVPreview.tsx: Apply sidebar width variable
- frontend/src/components/TemplateConfigPanel.tsx: Added width slider
- backend/src/lib/pdf-generator/index.ts: Use sidebar width in PDF
- docs/CHANGELOG.md: Version 1.8.0 entry
- frontend/package.json: Bumped to 1.8.0
- backend/package.json: Bumped to 1.8.0
```

### Example 2: Bug Fix Snapshot

**Trigger**: Fixed CSS variable not applying in PDF export

**Validation:**
```bash
cd backend && npm run build  # ✓ Success
cd frontend && npm run build  # ✓ Success
```

**Documentation:**
- Update `docs/UNIFIED_RENDERING_STATUS.md`: Note the fix
- Update `docs/CHANGELOG.md`: Add v1.7.3 entry
- Skip `CLAUDE.md`: Not a new pattern

**Commit:**
```
fix(pdf): apply heading line height CSS variable in PDF output

PDF generator was not including --heading-line-height CSS variable,
causing headings to render with different spacing than web preview.

Root cause:
- generateCSSVariables() output not including typography.lineHeight.heading
- PDF template missing the variable in its style block

Solution:
- Added lineHeight variables to cssVariableGenerator.ts
- Updated PDF generator template to include all typography variables

Files modified:
- shared/utils/cssVariableGenerator.ts: Added line height variables
- backend/src/lib/pdf-generator/index.ts: Include in PDF styles
- docs/CHANGELOG.md: Version 1.7.3 entry
```

### Example 3: Documentation-Only Snapshot

**Trigger**: Reorganized docs and created COMMIT-PROTOCOL

**Validation:** (Skip build steps for doc-only changes)

**Documentation:**
- Create `docs/COMMIT-PROTOCOL.md`
- Create `.claude/commands/snapshot.md`
- Update `CLAUDE.md`: Add reference to snapshot protocol

**Commit:**
```
docs: add commit snapshot protocol and /snapshot command

Added standardized commit protocol for creating production-ready
snapshots with consistent documentation and versioning.

New files:
- docs/COMMIT-PROTOCOL.md: Complete protocol guidelines
- .claude/commands/snapshot.md: Quick-trigger command for Claude

Changes:
- CLAUDE.md: Added reference to snapshot protocol
- Archived 16 outdated docs to docs/archive/

Documentation philosophy:
- CLAUDE.md: Essential patterns for working with codebase NOW
- docs/ARCHITECTURE.md: Detailed implementation decisions
- docs/CHANGELOG.md: Version history
```

## Quick Reference: When to Update Which Doc

| Change Type | CLAUDE.md | ARCHITECTURE.md | RENDERING_STATUS.md | CHANGELOG.md |
|-------------|-----------|-----------------|---------------------|--------------|
| New pattern ALL devs need | ✅ | ✅ | Maybe | ✅ |
| Architecture decision | ❌ | ✅ | Maybe | ✅ |
| Web/PDF rendering change | Maybe | Maybe | ✅ | ✅ |
| New feature | ❌ | Maybe | Maybe | ✅ |
| Bug fix | ❌ | ❌ | Maybe | ✅ |
| Performance optimization | ❌ | ✅ | Maybe | ✅ |
| API change | ❌ | Maybe | ❌ | ✅ |

## Common Pitfalls to Avoid

1. **Forgetting to update CHANGELOG.md** - Always update, even for small features
2. **Updating CLAUDE.md for everything** - Only for truly essential patterns
3. **Vague commit messages** - Be specific about what changed and why
4. **Not running builds before commit** - Always validate both frontend and backend
5. **Forgetting to bump BOTH package.json files** - Frontend and backend must match
6. **Committing too many unrelated changes** - Keep snapshots focused
7. **Missing documentation updates** - Document before you forget the details
8. **Not cross-referencing docs** - Help future readers find related info

## Triggering the Snapshot

Use the `/snapshot` command in Claude Code to initiate the protocol. This will guide you through the complete checklist.
