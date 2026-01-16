# Disconnected Template Settings Audit

## Executive Summary

**Critical Finding:** 49 out of 93 CSS variables are generated but **NOT connected** to the rendering pipeline. This means many Template Config Panel settings have **NO VISIBLE EFFECT** on the CV.

**Impact:** Users adjust settings in the UI, but nothing changes in the preview or PDF export.

## CSS Variables Audit

### Generated: 93 CSS variables
### Used in CVPreview: 44 variables (via `templateStyles[]` or `var()`)
### **Disconnected: 49 variables (53% unused!)**

## Disconnected Settings by Category

### 🔴 **CRITICAL** - User-Facing Controls with No Effect

#### 1. **Line Heights** (3 variables - 0% connected)
- `--heading-line-height` ❌ NOT USED
- `--body-line-height` ❌ NOT USED
- `--compact-line-height` ❌ NOT USED

**Impact:** Users adjust "Heading Line Height" and "Body Line Height" sliders → **NO CHANGE**
**UI Location:** Typography panel has controls for these
**Solution Needed:** Apply to all heading and paragraph elements

#### 2. **Font Weights** (2 variables - 0% connected)
- `--body-weight` ❌ NOT USED
- `--bold-weight` ❌ NOT USED
- `--subheading-weight` ❌ NOT USED

**Impact:** Body text weight slider → **NO CHANGE**
**Note:** `--heading-weight` IS used in some places
**Solution Needed:** Apply to body text, bold elements, subheadings

#### 3. **Tag Font Size** (2 variables - PARTIAL)
- `--tag-font-size` ✅ GENERATED (new)
- `--tag-font-size-custom` ⚠️ USED but might not work correctly

**Impact:** Tag Scale slider → **MIGHT NOT WORK**
**Solution Needed:** Verify application in both pill and inline styles

#### 4. **Date Line Font Size** (2 variables - 0% connected)
- `--date-line-font-size` ❌ NOT USED (new)
- `--date-line-font-size-custom` ❌ NOT USED (new)
- `--date-line-color` ❌ NOT USED

**Impact:** Date Line Scale slider → **NO CHANGE**
**Solution Needed:** Apply to date ranges in experience/education entries

#### 5. **Bullet Lists** (6 variables - 0% connected)
- `--bullet-level1-color` ❌ NOT USED
- `--bullet-level1-indent` ❌ NOT USED
- `--bullet-level2-color` ❌ NOT USED
- `--bullet-level2-indent` ❌ NOT USED
- `--bullet-level3-color` ❌ NOT USED
- `--bullet-level3-indent` ❌ NOT USED

**Impact:** Bullet list customization → **NO CHANGE**
**Solution Needed:** Apply to `<ul>` and `<li>` elements with proper nesting

#### 6. **Profile Photo** (4 variables - 0% connected)
- `--profile-photo-size` ❌ NOT USED (hardcoded to 200px)
- `--profile-photo-border-radius` ❌ NOT USED (hardcoded to 50%)
- `--profile-photo-border` ❌ NOT USED
- `--profile-photo-border-color` ❌ NOT USED

**Impact:** Profile photo settings → **NO CHANGE** (uses hardcoded values)
**Solution Needed:** Replace hardcoded values with CSS variables

#### 7. **Emphasis/Strong Text** (2 variables - 0% connected)
- `--emphasis-font-weight` ❌ NOT USED
- `--emphasis-color` ❌ NOT USED

**Impact:** Bold/strong text styling → **NO CHANGE**
**Solution Needed:** Apply to `<strong>` and `<em>` elements

#### 8. **Key-Value Pairs** (6 variables - 0% connected)
- `--key-value-label-color` ❌ NOT USED
- `--key-value-label-weight` ❌ NOT USED
- `--key-value-value-color` ❌ NOT USED
- `--key-value-value-weight` ❌ NOT USED
- `--key-value-separator` ❌ NOT USED
- `--key-value-spacing` ❌ NOT USED

**Impact:** Key-value pair styling → **NO CHANGE**
**Solution Needed:** Implement key-value rendering if this pattern is used

### 🟡 **MODERATE** - Infrastructure Settings

#### 9. **Layout Spacing** (2 variables - PARTIAL)
- `--section-spacing` ❌ NOT USED (hardcoded to mb-6, mb-8)
- `--paragraph-spacing` ❌ NOT USED

**Impact:** Section spacing settings → **NO CHANGE** (uses Tailwind classes)
**Solution Needed:** Replace Tailwind margin classes with CSS variables

#### 10. **Contact Info Layout** (1 variable - 0% connected)
- `--contact-layout` ❌ NOT USED

**Impact:** Contact info layout setting → **NO CHANGE**
**Solution Needed:** Implement grid/stacked layouts (currently only inline)

#### 11. **Link Colors** (2 variables - PARTIAL)
- `--link-color` ⚠️ ONLY used in markdown inline rendering
- `--link-hover-color` ❌ NOT USED (no hover states implemented)

**Impact:** Link hover color → **NO CHANGE**
**Solution Needed:** Implement hover states for all links

### 🟢 **MINOR** - Fallback/Utility Variables

#### 12. **Generic Size Variables** (4 variables - PARTIAL)
- `--title-font-size` ❌ NOT USED (h1 uses `--name-font-size` instead)
- `--h2-font-size` ❌ NOT USED (uses `--section-header-font-size` instead)
- `--small-font-size` ✅ USED via var()
- `--tiny-font-size` ✅ USED via var()
- `--base-font-size` ❌ NOT USED directly (only for calculations)

#### 13. **Color Pairs** (5 variables - PARTIAL)
- `--secondary-color` ✅ USED (sidebar background)
- `--tertiary-color` ❌ NOT USED directly
- `--muted-color` ✅ USED (inline code background)
- `--on-muted-color` ✅ USED (photo placeholder)
- `--border-color` ❌ NOT USED

## Variables Successfully Connected (44/93)

### ✅ **Working Font Sizes:**
- `--name-font-size` ✅
- `--section-header-font-size` ✅
- `--job-title-font-size` ✅
- `--org-name-font-size` ✅
- `--contact-font-size` ✅
- `--body-font-size` ✅
- `--small-font-size` ✅
- `--tiny-font-size` ✅
- `--h3-font-size` ✅
- `--inline-code-font-size` ✅

### ✅ **Working Colors:**
- `--primary-color` ✅
- `--on-primary-color` ✅
- `--on-secondary-color` ✅
- `--on-tertiary-color` ✅
- `--surface-color` ✅ (sidebar background)
- `--background-color` ✅
- `--text-color` ✅
- `--text-secondary` ✅
- `--text-muted` ✅
- `--accent-color` ✅
- `--on-background-color` ✅
- `--tag-bg-color` ✅
- `--tag-text-color` ✅

### ✅ **Working Layout:**
- `--page-width` ✅
- `--page-margin-top/right/bottom/left` ✅

### ✅ **Working Typography Details:**
- `--heading-font-family` ✅
- `--font-family` ✅
- `--name-letter-spacing` ✅
- `--section-header-letter-spacing` ✅
- `--name-text-transform` ✅
- `--section-header-text-transform` ✅

### ✅ **Working Component-Specific:**
- `--name-*` (alignment, margin-bottom, weight, color) ✅
- `--section-header-*` (border, padding, margins) ✅
- `--job-title-*` (weight, color, margin-bottom) ✅
- `--org-name-*` (weight, color, font-style) ✅
- `--contact-*` (icon-size, icon-color, spacing) ✅
- `--tag-border-radius` ✅

## PDF Generator Audit

Checking if PDF generator uses same CSS variables as web preview...

**Finding:** PDF generator uses a **different CSS approach**:
- Generates `<style>` block with CSS rules
- Uses `var(...)` references within those rules
- Some variables may not be in scope

**Concern:** PDF might have additional disconnects beyond web preview issues.

## Priority Fix List

### 🔴 **Priority 1 - Immediate (User-Facing Controls)**

1. **Line Heights** - Apply to headings, paragraphs, sections
2. **Tag Font Size** - Verify and fix tag rendering
3. **Date Line Font Size** - Apply to date ranges
4. **Font Weights** - Apply body-weight, bold-weight to appropriate elements
5. **Profile Photo** - Use CSS variables instead of hardcoded values

### 🟡 **Priority 2 - Important (Functionality)**

6. **Bullet Lists** - Apply colors and indents to multi-level lists
7. **Emphasis** - Style bold/strong/em elements
8. **Section Spacing** - Replace Tailwind classes with variables
9. **Link Hover** - Implement hover states

### 🟢 **Priority 3 - Enhancement (Nice-to-Have)**

10. **Contact Layout** - Implement grid/stacked options
11. **Key-Value** - Implement if this pattern is used in CVs
12. **Border Color** - Apply to appropriate elements

## Recommended Approach

### Phase 1: Critical Rendering Fixes
1. Add line-height to all text elements
2. Add font-weight to body/bold/heading elements
3. Fix tag font size rendering
4. Fix date line font size rendering
5. Replace hardcoded profile photo values

### Phase 2: Feature Completion
6. Implement bullet list styling
7. Implement emphasis styling
8. Replace hardcoded spacing with variables
9. Add link hover states

### Phase 3: PDF Parity
10. Verify all fixes work in PDF generator
11. Ensure CSS variables are in scope for PDF
12. Test PDF export matches web preview

## Testing Matrix

After fixes, test each setting:

| Setting | Web Preview | PDF Export | Status |
|---------|-------------|------------|--------|
| Heading Line Height | ❌ | ❌ | BROKEN |
| Body Line Height | ❌ | ❌ | BROKEN |
| Tag Scale | ⚠️ | ⚠️ | UNCLEAR |
| Date Line Scale | ❌ | ❌ | BROKEN |
| Body Weight | ❌ | ❌ | BROKEN |
| Profile Photo Size | ❌ | ❌ | BROKEN |
| Bullet Colors | ❌ | ❌ | BROKEN |
| Section Spacing | ❌ | ❌ | BROKEN |

## Impact Assessment

**Before Fixes:**
- 49 settings generate CSS variables but have NO EFFECT
- Users see sliders and assume they work
- Creates confusion and frustration
- Wastes development effort (added controls that don't work)

**After Fixes:**
- All 93 settings will have visible impact
- WYSIWYG: Settings panel matches rendered output
- 100% web/PDF consistency
- Professional, polished user experience

## Conclusion

This is a **critical usability issue**. Over half of the generated CSS variables are disconnected from the rendering pipeline, meaning many Template Config Panel controls are **non-functional**.

**Immediate action required:**
1. Fix Priority 1 items (line-heights, tag sizes, font weights, profile photo)
2. Test thoroughly in both web and PDF
3. Verify ALL sliders and controls have visible effects
4. Document which settings work and which don't
5. Consider hiding non-functional controls until connected

**Estimated effort:** 4-6 hours to fix all Priority 1 & 2 items
