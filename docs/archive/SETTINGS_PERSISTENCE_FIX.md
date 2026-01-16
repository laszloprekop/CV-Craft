# Settings Persistence Fix - Key Insights

## Version: 1.4.4
## Date: 2025-01-03

## Problem Summary
Template configuration settings (colors, typography, etc.) were not persisting correctly when saving and reloading CVs. The `baseFontSize` field was becoming `undefined` after color changes, and accent colors were reverting to defaults on CV reload.

## Root Causes Identified

### 1. **Shallow Merge Corruption in useCVEditor**
**Location**: `frontend/src/hooks/useCVEditor.ts:202`

**Issue**: The `updateConfig` function was using shallow merge:
```typescript
const updated = { ...prev, ...newConfig } as TemplateConfig
```

When updating nested config like `{colors: {accent: '#c6bdae'}}`, this replaced the **entire** `colors` object, losing all other color properties. Similarly, when `colors` was updated, the `typography` section was replaced with `undefined`.

**Fix**: Implemented deep merge that preserves nested properties:
```typescript
const updated: TemplateConfig = {
  colors: newConfig.colors ? { ...prev?.colors, ...newConfig.colors } : prev?.colors,
  typography: newConfig.typography ? { ...prev?.typography, ...newConfig.typography } : prev?.typography,
  // ... for all sections
}
```

### 2. **Complex State Synchronization with Race Conditions**
**Location**: `frontend/src/pages/CVEditorPage.tsx`

**Issue**: The original architecture used:
- `templateConfig` state initialized before `savedConfig` was loaded
- `useEffect` to sync `templateConfig` with `savedConfig`
- `effectiveConfig` fallback chain: `templateConfig || savedConfig || defaults`

This created race conditions where:
1. Component renders with `DEFAULT_TEMPLATE_CONFIG`
2. CV loads from database with correct config
3. Sync effect tries to update `templateConfig`
4. But React Strict Mode double-mounting or re-renders could interrupt this flow
5. Result: Stale config values shown in UI

**Fix**: Simplified to single source of truth with derived state:
```typescript
// Source of truth: savedConfig from database
const [liveConfigChanges, setLiveConfigChanges] = useState<Partial<TemplateConfig> | null>(null)

// Computed config (derived state, not stored)
const baseConfig = savedConfig || activeTemplate?.default_config || DEFAULT_TEMPLATE_CONFIG
const effectiveConfig = liveConfigChanges
  ? deepMergeConfig(baseConfig, liveConfigChanges)
  : baseConfig
```

**Benefits**:
- No sync effects needed
- No race conditions
- Always reflects latest database state immediately
- Live preview changes tracked separately and cleared after save

### 3. **Migration Logic Overwriting Saved Changes**
**Location**: `frontend/src/hooks/useCVEditor.ts:148-180`

**Issue**: Initial migration check used reference equality:
```typescript
if (migratedConfig && migratedConfig !== cvData.config)
```

This ALWAYS returned true (different object references), causing the migration to run and potentially overwrite user changes with migrated defaults.

**Fix**: Check for structural presence of new fields:
```typescript
const needsMigration = cvData.config &&
  (!cvData.config.typography?.baseFontSize || !cvData.config.typography?.fontScale)
```

## Key Files Modified

1. **`frontend/src/hooks/useCVEditor.ts`**
   - Implemented deep merge in `updateConfig()`
   - Fixed migration check to only run when actually needed

2. **`frontend/src/pages/CVEditorPage.tsx`**
   - Removed complex `templateConfig` state with sync effect
   - Introduced `liveConfigChanges` for temporary preview updates
   - Simplified to `effectiveConfig` as derived state
   - Moved `deepMergeConfig` helper to be reusable

3. **`frontend/src/components/controls/ColorControl.tsx`**
   - Already had optimized `onChange`/`onChangeComplete` pattern
   - Reduces database writes from 50+ to 1 per color change

## Testing Checklist

- ✅ Load CV with saved accent color → shows correct color
- ✅ Change accent color → live preview updates
- ✅ Release mouse → saves to database
- ✅ Close and reopen CV → color persists
- ✅ baseFontSize remains '10pt' through all operations
- ✅ No migration runs on already-migrated configs
- ✅ Settings panel shows correct values on open

## Architecture Principles Applied

1. **Single Source of Truth**: `savedConfig` from database
2. **Derived State**: Compute `effectiveConfig` on every render, don't store it
3. **Deep Merge**: Preserve all nested properties when updating partial configs
4. **Structural Checks**: Test for field presence, not reference equality
5. **Optimistic UI**: Track live changes separately, merge with saved config for display

## Prevention Guidelines

When working with nested configuration objects:

1. **Never use shallow merge** (`{...prev, ...new}`) on nested objects
2. **Always deep merge** at least one level for sections like colors, typography
3. **Prefer derived state** over synchronized state with useEffect
4. **Test structural equality** for migrations, not reference equality
5. **Separate concerns**: Live changes vs. persisted changes
