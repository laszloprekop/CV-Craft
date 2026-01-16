# Settings Persistence & Application Audit

## Date: 2025-01-03
## Version: 1.4.4

## Summary

This document tracks which template configuration settings are:
1. ✅ Exposed in the UI (TemplateConfigPanel)
2. ✅ Persisting to database (via onChange/onChangeComplete)
3. ✅ Applied in preview (CVPreview)

## Implementation Status

### ✅ FULLY IMPLEMENTED: Colors
| Setting | UI Control | Persistence | Preview Applied |
|---------|------------|-------------|-----------------|
| Primary color | ✅ ColorControl | ✅ Immediate save | ✅ CSS var `--primary-color` |
| Secondary color | ✅ ColorControl | ✅ Immediate save | ✅ CSS var `--surface-color` |
| Accent color | ✅ ColorControl | ✅ Immediate save | ✅ CSS var `--accent-color` |
| Background color | ✅ ColorControl | ✅ Immediate save | ✅ CSS var `--background-color` |
| Text primary | ✅ ColorControl | ✅ Immediate save | ✅ CSS var `--text-color` |
| Text secondary | ✅ ColorControl | ✅ Immediate save | ❌ NOT APPLIED |
| Text muted | ✅ ColorControl | ✅ Immediate save | ❌ NOT APPLIED |
| Borders | ✅ ColorControl | ✅ Immediate save | ❌ NOT APPLIED |
| Links default | ✅ ColorControl | ✅ Immediate save | ❌ NOT APPLIED |
| Links hover | ✅ ColorControl | ✅ Immediate save | ❌ NOT APPLIED |

### ✅ FULLY IMPLEMENTED: Typography - Font Sizes
| Setting | UI Control | Persistence | Preview Applied |
|---------|------------|-------------|-----------------|
| Base font size | ✅ SpacingControl | ✅ Debounced (1s) | ✅ CSS var `--base-font-size` |
| H1 scale | ✅ NumberControl | ✅ Debounced (1s) | ✅ Calculated `--title-font-size` |
| H2 scale | ✅ NumberControl | ✅ Debounced (1s) | ✅ Calculated `--h2-font-size` |
| H3 scale | ✅ NumberControl | ✅ Debounced (1s) | ✅ Calculated `--h3-font-size` |
| Body scale | ✅ NumberControl | ✅ Debounced (1s) | ✅ Calculated `--body-font-size` |
| Small scale | ✅ NumberControl | ✅ Debounced (1s) | ✅ Calculated `--small-font-size` |
| Tiny scale | ✅ NumberControl | ✅ Debounced (1s) | ✅ Calculated `--tiny-font-size` |

### ⚠️ PARTIALLY IMPLEMENTED: Typography - Other
| Setting | UI Control | Persistence | Preview Applied |
|---------|------------|-------------|-----------------|
| Heading font | ✅ FontSelector | ✅ Debounced (1s) | ✅ CSS var `--heading-font-family` |
| Body font | ✅ FontSelector | ✅ Debounced (1s) | ✅ CSS var `--font-family` |
| Heading weight | ✅ NumberControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Body weight | ✅ NumberControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Heading line height | ✅ NumberControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Body line height | ✅ NumberControl | ✅ Debounced (1s) | ❌ NOT APPLIED |

### ⚠️ PARTIALLY IMPLEMENTED: Layout
| Setting | UI Control | Persistence | Preview Applied |
|---------|------------|-------------|-----------------|
| Page width | ✅ SpacingControl | ✅ Debounced (1s) | ✅ CSS var `--page-width` |
| Page margins (all 4) | ✅ BoxModelControl | ✅ Debounced (1s) | ✅ CSS vars `--page-margin-*` |
| Section spacing | ✅ SpacingControl | ✅ Debounced (1s) | ✅ CSS var `--section-spacing` |
| Paragraph spacing | ✅ SpacingControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Columns enabled | ✅ ToggleControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Column gap | ✅ SpacingControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Column ratio | ✅ SelectControl | ✅ Debounced (1s) | ❌ NOT APPLIED |

### ⚠️ PARTIALLY IMPLEMENTED: Components
| Setting | UI Control | Persistence | Preview Applied |
|---------|------------|-------------|-----------------|
| Header alignment | ✅ SelectControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Tags background | ✅ ColorControl | ✅ Immediate save | ❌ NOT APPLIED |
| Tags text color | ✅ ColorControl | ✅ Immediate save | ❌ NOT APPLIED |
| Tags border radius | ✅ SpacingControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Tags style (pill/inline) | ✅ SelectControl | ✅ Debounced (1s) | ✅ Applied via `renderSkills()` |
| Tags separator | ✅ SelectControl | ✅ Debounced (1s) | ✅ Applied via `renderSkills()` |
| Date line color | ✅ ColorControl | ✅ Immediate save | ❌ NOT APPLIED |
| Date line font style | ✅ SelectControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Date line alignment | ✅ SelectControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Links underline | ✅ ToggleControl | ✅ Debounced (1s) | ❌ NOT APPLIED |

### ❌ NOT IMPLEMENTED: PDF Settings
| Setting | UI Control | Persistence | Preview Applied |
|---------|------------|-------------|-----------------|
| Page size | ✅ SelectControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Orientation | ✅ SelectControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Print color adjust | ✅ ToggleControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Page numbers enabled | ✅ ToggleControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Page numbers position | ✅ SelectControl | ✅ Debounced (1s) | ❌ NOT APPLIED |

### ❌ NOT IMPLEMENTED: Advanced
| Setting | UI Control | Persistence | Preview Applied |
|---------|------------|-------------|-----------------|
| Icon set | ✅ SelectControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Enable animations | ✅ ToggleControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Enable shadows | ✅ ToggleControl | ✅ Debounced (1s) | ❌ NOT APPLIED |
| Custom CSS | ✅ Textarea | ✅ Debounced (1s) | ❌ NOT APPLIED |

## Key Fixes Applied

### 1. Debounced Auto-Save (NEW)
**Problem**: Most settings (typography, layout, components, PDF, advanced) only had `onChange` handlers, which updated live preview but never saved to database.

**Solution**: Implemented debounced auto-save in `TemplateConfigPanel.tsx`:
- Accumulates all changes in `pendingChangesRef`
- Triggers `onChangeComplete` 1 second after last change
- Saves pending changes on panel close (cleanup effect)

```typescript
const updateConfig = (section, value) => {
  const update = { [section]: { ...config[section], ...value } };

  // Immediate live preview
  onChange(update);

  // Accumulate for debounced save
  pendingChangesRef.current = { ...pendingChangesRef.current, ...update };

  // Debounce timer (1 second)
  clearTimeout(debounceTimerRef.current);
  debounceTimerRef.current = setTimeout(() => {
    onChangeComplete(pendingChangesRef.current);
    pendingChangesRef.current = null;
  }, 1000);
};
```

### 2. Color Immediate Save (ALREADY WORKING)
Colors use `onChangeComplete` handlers for immediate save on mouse release, not debounced.

## Recommendations

### Priority 1: Apply Missing CSS Variables in CVPreview
Add to `getTemplateStyles()` in CVPreview.tsx:

```typescript
// Text colors
'--text-secondary': activeConfig?.colors.text.secondary || '#64748b',
'--text-muted': activeConfig?.colors.text.muted || '#94a3b8',

// Border color
'--border-color': activeConfig?.colors.borders || '#e2e8f0',

// Link colors
'--link-color': activeConfig?.colors.links.default || '#2563eb',
'--link-hover-color': activeConfig?.colors.links.hover || '#1d4ed8',

// Font weights
'--heading-weight': activeConfig?.typography.fontWeight.heading || 700,
'--body-weight': activeConfig?.typography.fontWeight.body || 400,

// Line heights
'--heading-line-height': activeConfig?.typography.lineHeight.heading || 1.2,
'--body-line-height': activeConfig?.typography.lineHeight.body || 1.6,

// Paragraph spacing
'--paragraph-spacing': activeConfig?.layout.paragraphSpacing || '12px',
```

### Priority 2: Implement Component-Specific Styles
These need inline styles or conditional class names in render functions:
- Header alignment
- Tags colors & border radius
- Date line color, style, alignment
- Links underline toggle

### Priority 3: PDF Settings
These should be passed to PDF generator (backend):
- Page size, orientation
- Print color adjust
- Page numbers

### Priority 4: Advanced Features
- Custom CSS: Inject into `<style>` tag
- Animations: Add CSS class to container
- Shadows: Add CSS class to elements
- Icon set: Not yet implemented in render logic

## Testing Checklist

- [x] Change accent color → saves immediately on mouse release
- [x] Change base font size → saves 1s after last change
- [x] Change multiple settings rapidly → only saves once after 1s
- [x] Close panel while changing settings → saves pending changes
- [ ] All CSS variables applied and visible in preview
- [ ] Component-specific styles work (tags, date lines, links)
- [ ] PDF exports use correct page size/orientation
- [ ] Custom CSS injected correctly
