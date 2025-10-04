# Implementation Plan: Figma-Style Components Panel Redesign

**Version**: 1.6.0 → 1.7.0+
**Date**: 2025-10-04
**Status**: In Progress

## Overview
Redesign the Components tab in TemplateConfigPanel with a Figma-inspired UI featuring collapsible sections, persistent state, space-optimized controls, and comprehensive component customization.

---

## Phase 1: Core Infrastructure ✅ MILESTONE 1

**1.1 Create Collapsible Section Component**
- **File**: `frontend/src/components/controls/CollapsibleSection.tsx` (NEW)
- **Features**:
  - Chevron icon animation (rotate on open/close)
  - Header with label and optional badge/count
  - Smooth height animation using CSS transitions
  - Click handler for toggle
  - Props: `label`, `isOpen`, `onToggle`, `children`
- **Styling**: Match Figma screenshot - subtle borders, padding, hover states

**1.2 Implement Persistent State Management**
- **File**: `frontend/src/components/TemplateConfigPanel.tsx`
- **Approach**: Use localStorage to persist section open/closed states
- **State Shape**:
  ```typescript
  {
    'components-name': true,
    'components-headers': false,
    'components-body-text': true,
    // etc.
  }
  ```
- **Hook**: Custom hook `useCollapsibleState(sectionId: string)` that syncs with localStorage
- **Default Behavior**: First 2-3 sections open by default on first visit

**1.3 Export CollapsibleSection**
- **File**: `frontend/src/components/controls/index.ts`
- Add export for CollapsibleSection component

**Commit**: v1.6.1 - Add CollapsibleSection component with persistent state

---

## Phase 2: Component Section Reorganization

**2.1 Define Component Groups**
Based on Figma reference and CV structure:
1. **Name** (H1) - Font, size, weight, color, letter spacing, transform
2. **Section Headers** (H2) - Font, size, weight, color, spacing, divider
3. **Job Titles** (H3) - Font, size, weight, color, style
4. **Body Text** (paragraphs) - Font, size, line height, color
5. **Lists** - Bullet style (multi-level), spacing, indentation
6. **Tags/Skills** - Color pair, opacity, border radius, style, separator
7. **Contact Info** - Layout, spacing, icon style, colors
8. **Dates** - Format, position, color, font style
9. **Links** - Color, underline, hover state
10. **Header Section** - Alignment, spacing, background

**2.2 Identify Missing Controls**
Current missing controls to add:
- **Name (H1)**: Font selector, size, weight, color, letter-spacing, text-transform
- **Section Headers (H2)**: Font, size, weight, color, underline/divider options
- **Job Titles (H3)**: Font, size, weight, color, italic option
- **Body Text**: Font family, line height multiplier
- **Contact Info**: Icon visibility, separator character, layout (inline/stacked)
- **Dates**: Date format, alignment (left/right), color
- **Links**: Hover color, underline style

---

## Phase 3: Update Type Definitions ✅ MILESTONE 2

**3.1 Extend TemplateConfig Types**
- **File**: `shared/types/index.ts`
- Add missing fields to `components` section:
  ```typescript
  components: {
    name: {
      fontFamily?: string;
      fontSize?: string;
      fontWeight?: number;
      color?: string;
      letterSpacing?: string;
      textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    };
    sectionHeaders: {
      fontFamily?: string;
      fontSize?: string;
      fontWeight?: number;
      color?: string;
      dividerStyle?: 'none' | 'underline' | 'full-width' | 'accent-bar';
      dividerColor?: string;
      marginTop?: string;
      marginBottom?: string;
    };
    jobTitles: {
      fontFamily?: string;
      fontSize?: string;
      fontWeight?: number;
      color?: string;
      fontStyle?: 'normal' | 'italic';
    };
    bodyText: {
      fontFamily?: string;
      lineHeight?: number;
    };
    contactInfo: {
      showIcons?: boolean;
      separator?: '·' | '|' | '•' | 'none';
      layout?: 'inline' | 'stacked';
      iconColor?: string;
      textColor?: string;
    };
    dates: {
      format?: 'full' | 'short' | 'year-only';
      alignment?: 'left' | 'right';
      color?: string;
      fontStyle?: 'normal' | 'italic';
    };
    links: {
      color?: string;
      hoverColor?: string;
      underline?: 'none' | 'always' | 'hover';
    };
    // Keep existing: header, tags
  }
  ```

**3.2 Update Default Values**
- **File**: `shared/types/defaultTemplateConfig.ts`
- Add sensible defaults for all new component fields

**Commit**: v1.6.2 - Extend component type definitions with comprehensive controls

---

## Phase 4: UI Implementation ✅ MILESTONE 3

**4.1 Redesign Components Tab Layout**
- **File**: `frontend/src/components/TemplateConfigPanel.tsx`
- Replace current flat list with CollapsibleSection groups
- Implement all component sections with new controls

**4.2 Create Space-Optimized Control Variants**
- Smaller labels (10px font)
- Compact padding (1-2px gaps)
- Inline value displays
- Two-column grids for related controls

**4.3 Add Visual Previews Where Appropriate**
- Section Divider Styles: Mini preview tiles
- Text Transform: Preview text
- Date Formats: Example dates
- Link Underline: Preview styles

**Commit**: v1.7.0 - Redesign Components panel with Figma-style collapsible sections

---

## Phase 5: Backend Synchronization ✅ MILESTONE 4

**5.1 Update PDF Generator**
- **File**: `backend/src/lib/pdf-generator/index.ts`
- Add CSS variable generation for new component properties

**5.2 Update CSS Variable Application**
- Ensure all new CSS variables are properly applied to HTML elements
- Match frontend CVPreview rendering exactly

**Commit**: v1.7.1 - Sync backend PDF generator with new component settings

---

## Phase 6: Frontend CV Preview Updates ✅ MILESTONE 5

**6.1 Apply New CSS Variables**
- **File**: `frontend/src/components/CVPreview.tsx`
- Update `templateStyles` calculation to include all new variables
- Apply variables to appropriate HTML elements

**6.2 Implement Dynamic Rendering**
- Section Dividers: Conditional rendering based on style
- Contact Separators: Insert separator characters
- Date Formatting: Transform date strings
- Link Underlines: Apply text-decoration

**Commit**: v1.7.2 - Apply new component settings to CV preview rendering

---

## Phase 7: Testing & Polish

**7.1 Functionality Testing**
- Verify all collapsible sections toggle correctly
- Test state persistence across page refreshes
- Ensure all controls update live preview
- Confirm debounced save works

**7.2 Visual Polish**
- Match Figma spacing/padding exactly
- Ensure hover states are subtle and professional
- Verify chevron icon animations are smooth
- Check scroll behavior

**7.3 Accessibility**
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers

---

## File Checklist

**New Files:**
- ✅ `frontend/src/components/controls/CollapsibleSection.tsx`
- `IMPLEMENTATION-PLAN-COMPONENTS-PANEL.md` (this file)

**Modified Files:**
- `frontend/src/components/controls/index.ts`
- `frontend/src/components/TemplateConfigPanel.tsx`
- `frontend/src/components/CVPreview.tsx`
- `shared/types/index.ts`
- `shared/types/defaultTemplateConfig.ts`
- `backend/src/lib/pdf-generator/index.ts`

---

## Success Criteria

✅ All component sections are collapsible with smooth animations
✅ Section open/closed states persist across page refreshes
✅ All missing component controls are present and functional
✅ Live preview updates instantly for all controls
✅ Changes save to database after 1-second debounce
✅ PDF export matches frontend preview exactly
✅ UI matches Figma design aesthetic (spacing, hierarchy, polish)
✅ No regression in existing features (fonts, colors, layout tabs)

---

## Progress Tracking

- [x] Plan documented
- [ ] Phase 1: Core Infrastructure (Milestone 1)
- [ ] Phase 3: Type Definitions (Milestone 2)
- [ ] Phase 4: UI Implementation (Milestone 3)
- [ ] Phase 5: Backend Sync (Milestone 4)
- [ ] Phase 6: Frontend Preview (Milestone 5)
- [ ] Phase 7: Testing & Polish
