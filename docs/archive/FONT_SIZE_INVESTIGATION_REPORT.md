# CV-Craft Font Size Settings Investigation Report

## Executive Summary

The CV-Craft application uses a **hierarchical font sizing system** with a base font size setting that scales all text elements proportionally. The system is implemented consistently across both web preview and PDF rendering, with component-level overrides available for individual elements.

---

## 1. Where Base Font Size is Configured

### 1.1 Primary Configuration Location
**File:** `/shared/types/defaultTemplateConfig.ts`
**Key Setting:** `typography.baseFontSize`

```typescript
typography: {
  // Base font size for scaling
  baseFontSize: '10pt',  // Default value
  
  // Google Fonts Integration
  availableFonts: [...],
  fontLoadingStrategy: 'preload',
  
  fontFamily: { heading, body, monospace },
  
  // Font scale - multipliers relative to baseFontSize
  fontScale: {
    h1: 3.2,    // 3.2 × 10pt = 32pt
    h2: 2.4,    // 2.4 × 10pt = 24pt
    h3: 2.0,    // 2.0 × 10pt = 20pt
    body: 1.6,  // 1.6 × 10pt = 16pt
    small: 1.4, // 1.4 × 10pt = 14pt
    tiny: 1.2   // 1.2 × 10pt = 12pt
  },
  
  // Legacy absolute sizes (for backward compatibility)
  fontSize: {
    h1: '32px',
    h2: '24px',
    h3: '20px',
    body: '16px',
    small: '14px',
    tiny: '12px'
  }
}
```

### 1.2 Configuration Interface
**File:** `/shared/types/index.ts`

```typescript
typography: {
  baseFontSize: string;  // e.g., '10pt', '12px', '1rem'
  fontScale: {
    h1: number;          // e.g., 3.2 means 3.2 × baseFontSize
    h2: number;
    h3: number;
    body: number;
    small: number;
    tiny: number;
  };
  fontSize?: {           // Legacy: absolute sizes
    h1: string;
    h2: string;
    h3: string;
    body: string;
    small: string;
    tiny: string;
  };
  // ... other typography settings
}
```

### 1.3 UI Control for Base Font Size
**File:** `/frontend/src/components/TemplateConfigPanel.tsx`

Users can adjust base font size in the "Typography" tab:
```typescript
<SpacingControl
  label="Base Font Size"
  value={config.typography.baseFontSize}
  onChange={(value) => updateConfig('typography', { baseFontSize: value })}
  units={['px', 'pt', 'rem', 'em']}
/>
```

---

## 2. How Base Font Size is Applied in Rendering

### 2.1 CSS Variable Generation (Shared between Web and PDF)
**File:** `/shared/utils/cssVariableGenerator.ts`

This is the **single source of truth** for font size calculations:

```typescript
function calculateFontSize(scale: number, baseFontSize: string): string {
  const baseValue = parseFloat(baseFontSize);
  const unit = baseFontSize.replace(/[0-9.]/g, '');
  return `${(baseValue * scale).toFixed(1)}${unit}`;
}

export function generateCSSVariables(config: TemplateConfig): Record<string, string> {
  const baseFontSize = config.typography.baseFontSize || '10pt';
  const fontScale = config.typography.fontScale || {
    h1: 3.2, h2: 2.4, h3: 2.0, body: 1.6, small: 1.4, tiny: 1.2
  };

  return {
    // Generated CSS variables:
    '--base-font-size': baseFontSize,
    '--title-font-size': calculateFontSize(fontScale.h1, baseFontSize),     // h1
    '--h2-font-size': calculateFontSize(fontScale.h2, baseFontSize),        // h2
    '--h3-font-size': calculateFontSize(fontScale.h3, baseFontSize),        // h3
    '--body-font-size': calculateFontSize(fontScale.body, baseFontSize),    // body
    '--small-font-size': calculateFontSize(fontScale.small, baseFontSize),  // small
    '--tiny-font-size': calculateFontSize(fontScale.tiny, baseFontSize),    // tiny
    
    // Component-specific sizes (with fallback to calculated sizes):
    '--name-font-size': config.components.name?.fontSize || calculateFontSize(fontScale.h1, baseFontSize),
    '--contact-font-size': config.components.contactInfo?.fontSize || calculateFontSize(fontScale.small, baseFontSize),
    '--section-header-font-size': config.components.sectionHeader?.fontSize || calculateFontSize(fontScale.h2, baseFontSize),
    '--job-title-font-size': config.components.jobTitle?.fontSize || calculateFontSize(fontScale.h3, baseFontSize),
    '--org-name-font-size': config.components.organizationName?.fontSize || calculateFontSize(fontScale.body, baseFontSize),
    // ... more component sizes
  };
}
```

### 2.2 Web Preview Rendering
**File:** `/frontend/src/components/CVPreview.tsx`

The CVPreview component uses the CSS variables:
```typescript
// Generate CSS variables from config
const cssVariables = generateCSSVariables(activeConfig);

// Apply to rendered elements
<h1 style={{
  fontSize: templateStyles['--name-font-size'],
  fontWeight: templateStyles['--name-font-weight'],
  // ... other styles
}}>
```

### 2.3 PDF Generation Rendering
**File:** `/backend/src/lib/pdf-generator/index.ts`

The PDF generator uses the **same** CSS variable generation:
```typescript
// Generate CSS variables from config using shared utility
const cssVariables = generateCSSVariables(config);

// Generate CSS with root variables
private generateCSS(variables: Record<string, string>): string {
  const cssVars = Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ')

  return `
    :root {
      ${cssVars}
    }
    
    body {
      font-size: var(--body-font-size);  // Uses calculated size from base + scale
      // ...
    }
    
    h1 { font-size: var(--title-font-size); }
    h2 { font-size: var(--h2-font-size); }
    h3 { font-size: var(--h3-font-size); }
  `;
}
```

---

## 3. Complete Font Size Hierarchy & Element Styling

### 3.1 Core Typography Levels (All inherit from Base Font Size)

| Element | Type | Scale | Default (10pt base) | CSS Variable | Inheritance |
|---------|------|-------|---------------------|--------------|------------|
| **H1 / Name** | Title | 3.2x | 32pt | `--title-font-size` | baseFontSize × 3.2 |
| **H2 / Section Header** | Heading | 2.4x | 24pt | `--h2-font-size` | baseFontSize × 2.4 |
| **H3 / Job Title** | Subheading | 2.0x | 20pt | `--h3-font-size` | baseFontSize × 2.0 |
| **Body / Paragraphs** | Text | 1.6x | 16pt | `--body-font-size` | baseFontSize × 1.6 |
| **Small** | Caption | 1.4x | 14pt | `--small-font-size` | baseFontSize × 1.4 |
| **Tiny** | Small text | 1.2x | 12pt | `--tiny-font-size` | baseFontSize × 1.2 |

### 3.2 Component-Level Font Sizes (Web and PDF)

#### Name (H1)
- **Inheritance:** `fontScale.h1` (3.2x base) or override via `components.name.fontSize`
- **CSS Variable:** `--name-font-size`
- **Default:** 32px (when base = 10pt)
- **Configurable:** Yes, in Components tab → Name
- **Web Code (CVPreview.tsx):**
  ```typescript
  <h1 style={{ fontSize: templateStyles['--name-font-size'] }}>
  ```
- **PDF Code (pdf-generator/index.ts):**
  ```css
  h1 { font-size: var(--title-font-size); }
  ```

#### Contact Information
- **Inheritance:** `fontScale.small` (1.4x base) or override via `components.contactInfo.fontSize`
- **CSS Variable:** `--contact-font-size`
- **Default:** 14px (when base = 10pt)
- **Configurable:** Yes, in Components tab → Contact Info
- **Web Code:**
  ```typescript
  <div style={{ fontSize: templateStyles['--contact-font-size'] }}>
  ```

#### Section Headers (H2)
- **Inheritance:** `fontScale.h2` (2.4x base) or override via `components.sectionHeader.fontSize`
- **CSS Variable:** `--section-header-font-size`
- **Default:** 24pt (when base = 10pt)
- **Configurable:** Yes, in Components tab → Section Header
- **Web Code:**
  ```typescript
  <h2 style={{ fontSize: templateStyles['--section-header-font-size'] }}>
  ```

#### Job/Education Titles (H3)
- **Inheritance:** `fontScale.h3` (2.0x base) or override via `components.jobTitle.fontSize`
- **CSS Variable:** `--job-title-font-size`
- **Default:** 20pt (when base = 10pt)
- **Configurable:** Yes, in Components tab → Job Title
- **Web Code:**
  ```typescript
  <h3 style={{ fontSize: templateStyles['--job-title-font-size'] }}>
  ```

#### Organization Names
- **Inheritance:** `fontScale.body` (1.6x base) or override via `components.organizationName.fontSize`
- **CSS Variable:** `--org-name-font-size`
- **Default:** 16px (when base = 10pt)
- **Configurable:** Yes, in Components tab → Organization Name

#### Tags/Skills
- **Inheritance:** Fixed size from `components.tags.fontSize`
- **CSS Variable:** No auto-scaling (independent)
- **Default:** 14px
- **Configurable:** Yes, direct value (not based on fontScale)

#### Date Line
- **Inheritance:** Fixed size from `components.dateLine.fontSize`
- **CSS Variable:** No auto-scaling (independent)
- **Default:** 14px
- **Configurable:** Yes, direct value (not based on fontScale)

#### Lists/Bullet Points
- **Inheritance:** `fontScale.body` (via CSS var or component config)
- **CSS Variable:** References `--body-font-size` or `--small-font-size`
- **Default:** 16px or 14px (depends on context)
- **Configurable:** Via components.list styling

### 3.3 Element Type Summary with Inheritance Pattern

```
baseFontSize (10pt default)
│
├── fontScale.h1 (3.2x)  ──► --title-font-size (32pt) ──► h1, name, main heading
├── fontScale.h2 (2.4x)  ──► --h2-font-size (24pt) ──► h2, section headers
├── fontScale.h3 (2.0x)  ──► --h3-font-size (20pt) ──► h3, job titles, subtitles
├── fontScale.body (1.6x) ──► --body-font-size (16pt) ──► paragraphs, descriptions
├── fontScale.small (1.4x) ──► --small-font-size (14pt) ──► contact info, captions
└── fontScale.tiny (1.2x) ──► --tiny-font-size (12pt) ──► timestamps, fine print
│
└── components.*.fontSize (OVERRIDES)
    ├── name.fontSize → overrides --title-font-size
    ├── sectionHeader.fontSize → overrides --section-header-font-size
    ├── jobTitle.fontSize → overrides --job-title-font-size
    ├── organizationName.fontSize → overrides --org-name-font-size
    ├── contactInfo.fontSize → overrides --contact-font-size
    ├── tags.fontSize → independent sizing (no fontScale inheritance)
    └── dateLine.fontSize → independent sizing (no fontScale inheritance)
```

---

## 4. Web vs PDF Rendering Differences

### 4.1 CSS Variable Consistency

**Both web and PDF use the same CSS variable generation:**
```
Shared: /shared/utils/cssVariableGenerator.ts
  ↓
Web:   /frontend/src/components/CVPreview.tsx
PDF:   /backend/src/lib/pdf-generator/index.ts
```

**Result:** Font sizes are **identical** between web preview and PDF export for all elements using fontScale.

### 4.2 Web-Specific Implementation

**File:** `/frontend/src/components/CVPreview.tsx`

```typescript
// Apply CSS variables to rendered elements
<div style={{
  ...templateStyles,
  fontFamily: templateStyles['--font-family'],
  fontSize: templateStyles['--body-font-size'],
  color: templateStyles['--text-color']
}}>
```

Uses React inline styles with CSS variables.

### 4.3 PDF-Specific Implementation

**File:** `/backend/src/lib/pdf-generator/index.ts`

```typescript
// Embed CSS variables in generated HTML
<style>
  :root {
    --base-font-size: 10pt;
    --title-font-size: 32pt;
    --h2-font-size: 24pt;
    /* ... */
  }
  
  body {
    font-size: var(--body-font-size);
  }
</style>
```

Uses inline CSS in Puppeteer-rendered HTML, then converts to PDF.

### 4.4 Known Differences

**NO INCONSISTENCIES FOUND** when using fontScale inheritance. However:

1. **Direct Size Overrides May Differ**: If a component specifies `fontSize: "18px"` directly, it won't scale with baseFontSize
2. **Font Loading**: PDF may have slight rendering differences due to system fonts vs Google Fonts
3. **Resolution**: PDF uses 96 DPI (standard for Puppeteer), web rendering is screen DPI

---

## 5. Configuration Flow

### 5.1 User Changes Base Font Size

1. **UI Input** → TemplateConfigPanel.tsx
   ```typescript
   updateConfig('typography', { baseFontSize: newValue })
   ```

2. **Live Preview Update** → CVPreview.tsx
   ```typescript
   const cssVariables = generateCSSVariables(activeConfig)
   // All font sizes recalculated automatically
   ```

3. **PDF Generation** → pdf-generator/index.ts
   ```typescript
   const cssVariables = generateCSSVariables(config)
   // Same calculation, same result
   ```

### 5.2 User Changes Font Scale Multiplier (e.g., h1: 3.2 → 3.5)

1. **Config Update**
   ```typescript
   updateConfig('typography', { fontScale: { ...fontScale, h1: 3.5 } })
   ```

2. **Recalculation**
   ```typescript
   --title-font-size = 10pt × 3.5 = 35pt
   ```

3. **Applied Everywhere** (web and PDF simultaneously)

### 5.3 User Overrides Component Font Size

1. **Component Override**
   ```typescript
   updateConfig('components', {
     name: { fontSize: '28px' }  // Direct override
   })
   ```

2. **CSS Generation**
   ```typescript
   '--name-font-size': '28px'  // Uses override, ignores fontScale
   ```

3. **Result**: Name is now 28px regardless of base font size changes

---

## 6. Configuration Migration & Persistence

### 6.1 Migration Path (Old to New System)

**File:** `/frontend/src/utils/configMigration.ts`

Old system (absolute sizes only):
```typescript
fontSize: { h1: '32px', h2: '24px', h3: '20px', ... }
```

New system (scalable):
```typescript
baseFontSize: '10pt'
fontScale: { h1: 3.2, h2: 2.4, h3: 2.0, ... }
```

Migration logic:
1. Detect if config has `fontScale` → Use new system
2. If only `fontSize` exists → Calculate `baseFontSize` and `fontScale`
3. Ensure `baseFontSize` is always present (defaults to '10pt')

### 6.2 Persistence

**Storage:** SQLite database (`cv_instances.config` or template `default_config`)

**Persistence Check:**
- baseFontSize: Persisted correctly
- fontScale: Persisted correctly
- Components overrides: Persisted correctly

---

## 7. Summary of Font Size Configuration Points

### Elements That Inherit from Base Font Size
1. **H1 / Name** - scales with base (3.2x multiplier)
2. **H2 / Section Headers** - scales with base (2.4x multiplier)
3. **H3 / Job Titles** - scales with base (2.0x multiplier)
4. **Body / Descriptions** - scales with base (1.6x multiplier)
5. **Small / Contact Info** - scales with base (1.4x multiplier)
6. **Tiny / Timestamps** - scales with base (1.2x multiplier)
7. **Bullet lists** - typically use body or small size

### Elements with Independent Sizing
1. **Tags/Skills** - fixed `components.tags.fontSize` (default 14px)
2. **Date Line** - fixed `components.dateLine.fontSize` (default 14px)
3. **Profile Photo Size** - fixed `components.profilePhoto.size` (200px)
4. **Icon Sizes** - fixed `components.contactInfo.iconSize` (16px)

### Override Points for All Elements
Every major element can have a component-level override:
- `components.name.fontSize`
- `components.sectionHeader.fontSize`
- `components.jobTitle.fontSize`
- `components.organizationName.fontSize`
- `components.contactInfo.fontSize`
- `components.tags.fontSize`
- `components.dateLine.fontSize`

---

## 8. Key Insights

✅ **Strengths:**
- Single source of truth (cssVariableGenerator.ts)
- Consistent calculation between web and PDF
- Scalable system with multipliers
- Component-level override capability
- Backward compatible with legacy absolute sizes
- Proper persistence in database

⚠️ **Potential Issues:**
- Component-level overrides break the scaling relationship
- No visual feedback in UI showing calculated sizes
- Legacy `fontSize` property still exists (may cause confusion)
- No validation preventing contradictory settings

💡 **Recommendations:**
1. Deprecate legacy `fontSize` property in favor of fontScale-only
2. Add visual indicators in UI showing calculated sizes
3. Validate that overrides make sense relative to base size
4. Consider adding preset font size themes (Compact, Normal, Large)
5. Document the inheritance hierarchy in-app

