cla# Font Size Cascade Investigation Report

## Executive Summary

CV-Craft uses a **two-tier font sizing system** with Base Font Size and Font Scale settings that cascade through most elements. The system ensures **100% consistency between web preview and PDF export** by using shared utilities.

## Core Typography Settings

### 1. Base Font Size
**Location:** `shared/types/defaultTemplateConfig.ts:39`
**Default:** `'10pt'`
**UI Control:** `TemplateConfigPanel.tsx:381-389` (SpacingControl)
**Units:** `pt`, `px`, `rem`

This is the **root unit** from which all other sizes are calculated.

### 2. Font Scale (Relative Multipliers)
**Location:** `shared/types/defaultTemplateConfig.ts:63-70`
**UI Control:** `TemplateConfigPanel.tsx:392-473` (NumberControl sliders)

Default multipliers:
- **h1**: 3.2 (for main name/title)
- **h2**: 2.4 (for section headers)
- **h3**: 2.0 (for job titles)
- **body**: 1.6 (for paragraphs)
- **small**: 1.4 (for metadata)
- **tiny**: 1.2 (for dates, locations)

**UI shows calculated values:** Each slider displays the absolute size (e.g., "24.0pt" = 10pt × 2.4)

## Font Size Calculation Pipeline

### Step 1: Calculation Function
**Location:** `shared/utils/cssVariableGenerator.ts:13-17`

```typescript
function calculateFontSize(scale: number, baseFontSize: string): string {
  const baseValue = parseFloat(baseFontSize)
  const unit = baseFontSize.replace(/[0-9.]/g, '')
  return `${(baseValue * scale).toFixed(1)}${unit}`
}
```

### Step 2: CSS Variable Generation
**Location:** `shared/utils/cssVariableGenerator.ts:26-207`

The `generateCSSVariables()` function creates CSS custom properties:

```typescript
'--base-font-size': baseFontSize,                               // 10pt
'--title-font-size': calculateFontSize(fontScale.h1, baseFontSize),  // 32pt
'--h2-font-size': calculateFontSize(fontScale.h2, baseFontSize),     // 24pt
'--h3-font-size': calculateFontSize(fontScale.h3, baseFontSize),     // 20pt
'--body-font-size': calculateFontSize(fontScale.body, baseFontSize), // 16pt
'--small-font-size': calculateFontSize(fontScale.small, baseFontSize),// 14pt
'--tiny-font-size': calculateFontSize(fontScale.tiny, baseFontSize)  // 12pt
```

### Step 3: Application to Components

Each component can either:
1. **Use calculated size** (inherits from base + scale) ✅ Recommended
2. **Override with fixed size** (independent of base font size) ⚠️ Legacy

## Element-by-Element Breakdown

### ✅ Elements that FOLLOW Base Font Size + Scale

These elements automatically scale when you change Base Font Size or Font Scale:

| Element | CSS Variable | Calculation | Default Value |
|---------|-------------|-------------|---------------|
| **Main Name (H1)** | `--name-font-size` | `h1 × base` OR `config.components.name.fontSize` | 32pt (10 × 3.2) |
| **Section Headers (H2)** | `--section-header-font-size` | `h2 × base` OR `config.components.sectionHeader.fontSize` | 24pt (10 × 2.4) |
| **Job Titles (H3)** | `--job-title-font-size` | `h3 × base` OR `config.components.jobTitle.fontSize` | 20pt (10 × 2.0) |
| **Body Text** | `--body-font-size` | `body × base` | 16pt (10 × 1.6) |
| **Contact Info** | `--contact-font-size` | `small × base` OR `config.components.contactInfo.fontSize` | 14pt (10 × 1.4) |
| **Organization Names** | `--org-name-font-size` | `body × base` OR `config.components.organizationName.fontSize` | 16pt (10 × 1.6) |
| **Small Text** | `--small-font-size` | `small × base` | 14pt (10 × 1.4) |
| **Tiny Text (dates)** | `--tiny-font-size` | `tiny × base` | 12pt (10 × 1.2) |

**Code References:**
- `cssVariableGenerator.ts:122` (name)
- `cssVariableGenerator.ts:143` (contact)
- `cssVariableGenerator.ts:152` (section headers)
- `cssVariableGenerator.ts:172` (job titles)
- `cssVariableGenerator.ts:182` (organization names)
- `cssVariableGenerator.ts:80-87` (base scale sizes)

### ⚠️ Elements with OPTIONAL Fixed Sizes

These elements have hardcoded defaults in `defaultTemplateConfig.ts` but can be overridden to use calculated sizes:

| Component | Fixed Default | Alternative | Status |
|-----------|---------------|-------------|---------|
| `name.fontSize` | `'32px'` | Falls back to `h1 × base` if undefined | **Legacy** |
| `contactInfo.fontSize` | `'14px'` | Falls back to `small × base` if undefined | **Legacy** |
| `sectionHeader.fontSize` | `'20px'` | Falls back to `h2 × base` if undefined | **Legacy** |
| `jobTitle.fontSize` | `'18px'` | Falls back to `h3 × base` if undefined | **Legacy** |
| `organizationName.fontSize` | `'16px'` | Falls back to `body × base` if undefined | **Legacy** |
| `tags.fontSize` | `'14px'` | No fallback - always fixed | **Independent** |
| `dateLine.fontSize` | `'14px'` | No fallback - always fixed | **Independent** |

**Note:** If you delete these fixed values from the config, the system will automatically use the calculated sizes from base + scale.

### ❌ Elements with INDEPENDENT Sizes (Not Affected by Base Font Size)

These elements have hardcoded sizes that do not scale:

| Element | Location | Value | Rationale |
|---------|----------|-------|-----------|
| **Inline Code** | `CVPreview.tsx:190` | `0.75rem` | Relative to browser default (16px) |
| **Tags (fallback)** | `CVPreview.tsx:871, 884` | `'9px'` or `'14px'` | Configurable via `config.components.tags.fontSize` |

## Web vs PDF Consistency

### ✅ 100% Consistent Between Web and PDF

Both rendering engines use the **exact same CSS variable generation**:

**Frontend (Web Preview):**
```typescript
// CVPreview.tsx:385
const cssVariables = generateCSSVariables(activeConfig)
```

**Backend (PDF Export):**
```typescript
// pdf-generator/index.ts:142
const cssVariables = generateCSSVariables(config)
```

Both apply variables to:
- `body { font-size: var(--body-font-size); }` (pdf-generator:195)
- `h1 { font-size: var(--title-font-size); }` (pdf-generator:231)
- `h2 { font-size: var(--h2-font-size); }` (pdf-generator:236)
- `h3 { font-size: var(--h3-font-size); }` (pdf-generator:240)
- All component-specific sizes via CSS variables

**Result:** Changing Base Font Size or Font Scale affects **both web preview and PDF export identically**.

## UI Controls

### Typography Panel Location
**File:** `frontend/src/components/TemplateConfigPanel.tsx:380-473`

### Base Font Size Control
```tsx
<SpacingControl
  label="Base Font Size"
  value={config.typography.baseFontSize}
  onChange={(value) => updateConfig('typography', { baseFontSize: value })}
  units={['pt', 'px', 'rem']}
  description="Base size - all other sizes scale relative to this"
/>
```

### Font Scale Controls
Each scale multiplier has a `NumberControl` with:
- **Label:** "H1 Scale", "H2 Scale", etc.
- **Value:** Current multiplier (e.g., 2.4)
- **Range:** 0.5 to 5.0 (varies by element)
- **Step:** 0.1
- **Description:** Shows calculated absolute size (e.g., "24.0pt")

### Live Calculation Display
```tsx
description={`${(parseFloat(config.typography.baseFontSize) * config.typography.fontScale.h2).toFixed(1)}${config.typography.baseFontSize.replace(/[0-9.]/g, '')}`}
```

Example output: **"24.0pt"** when base is 10pt and h2 scale is 2.4

## How Sizing Changes Cascade

### Scenario 1: User Changes Base Font Size (10pt → 12pt)

All calculated sizes scale proportionally:
- Name (H1): 32pt → 38.4pt (12 × 3.2)
- Section Headers (H2): 24pt → 28.8pt (12 × 2.4)
- Job Titles (H3): 20pt → 24pt (12 × 2.0)
- Body: 16pt → 19.2pt (12 × 1.6)
- Small: 14pt → 16.8pt (12 × 1.4)
- Tiny: 12pt → 14.4pt (12 × 1.2)

**Fixed sizes remain unchanged:**
- Tags: 14px (independent)
- Any component with explicit `fontSize` override

### Scenario 2: User Changes Font Scale (H2 from 2.4 → 3.0)

Only section headers affected:
- Section Headers: 24pt → 30pt (10 × 3.0)
- All other elements: unchanged

### Scenario 3: User Sets Component Override

If `config.components.sectionHeader.fontSize = '28px'` is set:
- Section headers use **fixed 28px** (ignores base + scale)
- All other elements continue using calculated sizes

## Rendered Element Mapping

### Header Elements
- **H1 (Name):** Uses `--name-font-size` → `CVPreview.tsx:554, 650, 777, 1072`
- **H2 (Section Headers):** Uses `--section-header-font-size` → `CVPreview.tsx:597, 810, 1102`
- **H3 (Job Titles):** Uses `--job-title-font-size` → `CVPreview.tsx:972, 1127`

### Body Elements
- **Paragraphs:** Uses `--body-font-size` → `CVPreview.tsx:541, 666, 1062, 1175`
- **Descriptions:** Uses `--small-font-size` → `CVPreview.tsx:999, 1005, 1012`
- **Job descriptions:** Uses `--small-font-size` → `CVPreview.tsx:1145, 1156`

### Contact/Metadata Elements
- **Contact Info:** Uses `--contact-font-size` → `CVPreview.tsx:580, 680, 690, 700, 710, 720, 730`
- **Dates/Locations:** Uses `--tiny-font-size` → `CVPreview.tsx:835, 994, 995, 1140, 1141`
- **Organization Names:** Uses `--org-name-font-size` → `CVPreview.tsx:983, 1133`

### Special Elements
- **Tags:** Uses `config.components.tags.fontSize` (independent) → `CVPreview.tsx:871, 884`
- **Page Numbers:** Uses `--tiny-font-size` → `CVPreview.tsx:835`
- **Inline Code:** Uses hardcoded `0.75rem` → `CVPreview.tsx:190`

## Recommendations

### ✅ Best Practices

1. **Use Base Font Size + Scale** for all typography (default behavior)
2. **Adjust Base Font Size** to scale entire document proportionally
3. **Adjust individual scales** to fine-tune hierarchy while maintaining proportions
4. **Avoid setting component-specific fontSize** unless absolutely necessary

### ⚠️ When to Use Component Overrides

Only set `config.components.<element>.fontSize` when:
- You need a specific element to **not scale** with base font size
- You're matching an exact design specification
- You want independent control over that element

### 🔧 Potential Improvements

1. **Deprecate legacy fontSize values** in `defaultTemplateConfig.ts` (lines 72-79, 120, 135, 159, 185, 194, 221, 231)
2. **Make tags.fontSize** respect font scale system
3. **Add UI toggle** to switch between "scaled" and "fixed" sizing per component

## Conclusion

CV-Craft's font sizing system is **well-architected** with:
- ✅ Centralized configuration via Base Font Size + Font Scale
- ✅ Consistent cascade through most elements
- ✅ 100% parity between web preview and PDF export
- ✅ Shared utilities prevent drift between frontend/backend
- ⚠️ Some legacy fixed sizes remain for backward compatibility

**The system works as intended:** Changing Base Font Size or Font Scale will affect **all calculated elements** in both web and PDF rendering, while preserving independent sizing for special cases like tags and inline code.
