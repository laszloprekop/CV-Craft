---
description: Create a production-ready commit snapshot following the standardized protocol
---

You are about to create a production-ready commit snapshot. Follow the complete protocol documented in `docs/COMMIT-PROTOCOL.md`.

# Commit Snapshot Routine

## Step 1: Understand the Changes

First, ask me:
1. **What type of change is this?** (feature/bugfix/refactor/perf/docs)
2. **Brief description** of what was implemented/fixed
3. **Which files** were primarily modified

## Step 2: Validation Phase

Run these checks (frontend and backend are separate):

**Backend:**
```bash
cd backend && npm run build && npm run lint
```

**Frontend:**
```bash
cd frontend && npm run build && npm run lint
```

Report any failures and stop if critical errors found.

## Step 3: Documentation Analysis

Based on the change type, determine which documentation needs updates:

**Check if updates needed for:**
- [ ] `docs/ARCHITECTURE.md` - Architecture changes, new patterns, migrations
- [ ] `docs/UNIFIED_RENDERING_STATUS.md` - Changes to web/PDF rendering pipeline
- [ ] `docs/CHANGELOG.md` - **ALWAYS UPDATE** with version entry
- [ ] `CLAUDE.md` - **RARE** Only if new essential pattern for ALL devs
- [ ] Feature-specific doc - Create new `docs/FEATURE-*.md` if needed

**Documentation Guidelines:**
- Include version header (e.g., `## Feature Name (v1.X.0)`)
- Use structure: Problem → Solution → Implementation → Lessons Learned
- Add code examples showing patterns (not full implementations)
- Include file references: `frontend/src/components/File.tsx:123`
- Cross-reference related docs

## Step 4: Update Documentation

For each identified doc file:
1. Read the current content
2. Draft the update with proper structure
3. Show me the proposed changes
4. Apply updates after approval

## Step 5: Update CHANGELOG.md

Always add an entry to `docs/CHANGELOG.md`:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added/Changed/Fixed
- Main feature/fix description
- Key technical details (1-2 bullet points)

### Technical Insights
- Implementation insight worth remembering
```

Suggest version number based on:
- **Major (X.0.0)**: Breaking changes, major architecture shifts
- **Minor (0.X.0)**: New features, significant enhancements
- **Patch (0.0.X)**: Bug fixes, minor improvements

## Step 6: Bump package.json Versions

Update BOTH `frontend/package.json` and `backend/package.json` with the new version number:

1. Read current versions from both package.json files
2. Update both to match CHANGELOG.md version
3. Show the proposed changes for approval

**Consistency check:**
- CHANGELOG.md: `## [1.X.Y] - YYYY-MM-DD`
- frontend/package.json: `"version": "1.X.Y"`
- backend/package.json: `"version": "1.X.Y"`
- All three MUST match

## Step 7: Conventional Commit Message

Draft commit message following this structure:

```
type(scope): short description (50 chars max)

Detailed explanation of what changed and why.

Implementation details:
- Key technical decision 1
- Key technical decision 2

Files modified:
- frontend/src/path/to/file.ts: what changed
- backend/src/path/to/file.ts: what changed
- docs/DOC.md: what was added

[Breaking changes if any]
```

**Common types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `docs`: Documentation only
- `chore`: Dependencies, tooling

**Scopes for CV-Craft:**
- `preview`: CVPreview component, rendering
- `pdf`: PDF generation
- `editor`: Monaco editor, markdown editing
- `config`: Template configuration
- `api`: Backend API endpoints
- `parser`: Markdown/CV parsing

**Guidelines:**
- Use imperative mood: "Add" not "Added"
- Be specific: "Fix PDF font rendering" not "Fix bug"
- Include context in body for non-trivial changes
- List key files modified
- NO AI branding ("Generated with Claude Code", etc.)

## Step 8: Stage and Commit

Execute the git operations:

1. Stage all changes: `git add -A`
2. Show staging preview: `git status --short`
3. Commit with crafted message
4. Show commit summary: `git log --oneline -1`

## Step 9: Post-Commit Summary

Provide a summary:
- Version number
- Type of change
- Documentation files updated
- Commit hash and message
- Next steps (push, PR, tag release)

---

**Important Reminders:**
- Read `docs/COMMIT-PROTOCOL.md` for complete guidelines
- Always update `docs/CHANGELOG.md`
- Only update `CLAUDE.md` for truly essential patterns
- Use conventional commit format
- Be specific in commit messages
- Verify builds pass before committing
- Update BOTH frontend and backend package.json versions

**Quick Decision Table:**
| Change Type | Architecture.md | Rendering Status | Changelog.md | Claude.md |
|-------------|-----------------|------------------|--------------|-----------|
| New pattern for ALL devs | ✅ | Maybe | ✅ | ✅ |
| Web/PDF rendering change | Maybe | ✅ | ✅ | Maybe |
| Feature with new approach | ✅ | Maybe | ✅ | ❌ |
| Simple bug fix | ❌ | ❌ | ✅ | ❌ |
| Performance optimization | ✅ | Maybe | ✅ | ❌ |

Begin by asking me about the changes, then proceed through the checklist systematically.
