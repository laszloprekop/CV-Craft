# UI Fix Implementation Plan

## Overview
This plan addresses key differences between the design proposal and current implementation, focusing on header consolidation, button cleanup, PDF pagination, and rendering consistency.

## Identified Issues

### 1. Double Header Issue
- **Current:** App-level `<Header />` + editor-specific headers creating redundancy
- **Expected:** Single clean header per design proposal

### 2. Redundant Buttons
- **Current:** Duplicate "Save" buttons, multiple "Web/PDF" toggles
- **Expected:** Minimal toolbar with essential controls

### 3. PDF Preview Issues
- **Current:** Only shows first page, missing pagination, content cut off
- **Expected:** Multi-page view with navigation controls

### 4. PDF Bottom Padding & Margins
- **Current:** Content overflow, insufficient margins
- **Expected:** Proper A4 margins (20mm top/bottom, 15mm left/right)

### 5. Keep-Together Blocks
- **Current:** Section headers split from content across pages
- **Expected:** CSS `page-break-inside: avoid` preventing mid-block splits

### 6. Web vs PDF Rendering Consistency
- **Current:** Different parsing, colors, layouts
- **Expected:** Identical rendering with only pagination differences

### 7. Template Engine Discrepancies
- **Current:** Backend generates different output than frontend
- **Expected:** Unified rendering logic

## Implementation Tasks

### Task 1: Header Structure Consolidation ✓
**Files:** `frontend/src/App.tsx`, `frontend/src/pages/CVEditorPage.tsx`

**Changes:**
- Remove app-level `<Header />` from `App.tsx` for editor routes
- Keep only `EditorLeftHeader` + `EditorRightHeader` in `CVEditorPage`
- Retain app header for CV Manager page only

### Task 2: Redundant Button Cleanup ✓
**Files:** `frontend/src/components/EditorRightHeader.tsx`

**Changes:**
- Consolidate "Save" to single prominent button (right section)
- Remove "Saved X mins ago" status text
- Keep single Web/PDF toggle in center section
- Remove duplicate export buttons

### Task 3: PDF Preview Pagination ✓
**Files:** `frontend/src/components/CVPreview.tsx`

**Changes:**
- Fix `splitContentIntoPages()` height estimation algorithm
- Add page navigation controls (Previous/Next, Page X of Y)
- Implement proper A4-based page-break detection (210mm × 297mm)
- Show all pages stacked vertically with shadows

### Task 4: PDF Bottom Padding & Margins ✓
**Files:** `frontend/src/components/CVPreview.tsx`

**Changes:**
- Fix `padding: '0mm'` in `renderPDFPage()` wrapper
- Apply proper A4 margins: 20mm top/bottom, 15mm left/right
- Adjust content area: 180mm width × 257mm height
- Add bottom padding buffer

### Task 5: Keep-Together Blocks ✓
**Files:** `frontend/src/components/CVPreview.tsx`, styles

**Changes:**
- Add CSS: `.keep-together { page-break-inside: avoid; break-inside: avoid; }`
- Wrap sections in `<div className="keep-together">` for PDF mode
- Update `splitContentIntoPages()` to respect boundaries
- Move entire sections to next page if they don't fit

### Task 6: Web vs PDF Rendering Consistency ✓
**Files:** `frontend/src/components/CVPreview.tsx`

**Changes:**
- Unify rendering logic using same `renderSectionContent()`
- Extract color palette to shared theme constants
- Ensure PDF mode uses identical HTML structure to web
- Only difference: pagination wrapper + page-break CSS

### Task 7: Template Engine Unification ✓
**Files:** `backend/src/lib/template-engine/` (if exists)

**Changes:**
- Audit backend template-engine for discrepancies
- Move template rendering to shared module
- Ensure Puppeteer PDF uses same React component HTML
- Consider server-side rendering for PDF export

### Task 8: Testing & Validation ✓
**Files:** Test with `_references/laszlo_frontend_cv.md`

**Validation:**
- Compare against `CV_sample.pdf` and `CV_sample-page1.jpg`
- Verify page breaks at same locations
- Check color consistency, font sizes, spacing
- Test zoom controls for web and PDF modes

## Implementation Order Priority

1. Header consolidation (Quick win)
2. Button cleanup (Quick win)
3. PDF pagination (Critical)
4. Page margins & padding (Required)
5. Keep-together blocks (Quality)
6. Web/PDF consistency (Quality)
7. Template engine audit (Backend)
8. Testing with reference CV (Validation)

## Success Criteria

- ✓ Single unified header per pane
- ✓ No duplicate buttons or controls
- ✓ All PDF pages visible with navigation
- ✓ Proper A4 margins and no content overflow
- ✓ Section headers stay with content
- ✓ Web and PDF previews visually identical
- ✓ Backend PDF export matches frontend preview
- ✓ Reference CV renders correctly

## Reference Files

- Design: `_references/design_proposal.png`
- Current UI: `_references/UI_review/FE-editor-*.png`
- Sample CV: `_references/CV_sample.pdf`, `_references/CV_sample-page1.jpg`
- Test Markdown: `_references/laszlo_frontend_cv.md`
- Spec: `_references/project_specification.md`
