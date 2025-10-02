# Changelog - Version 1.4.3

**Release Date:** 2025-10-02

## Critical Fixes

### 🖼️ Profile Photo Architecture Refactor

**Problem:**
- Profile photos were incorrectly embedded in Markdown content as frontmatter or image syntax
- Photos were parsed from CV markdown instead of being treated as proper attachments
- This made photo management fragile and tightly coupled to content

**Solution:**
- **Database Migration:** Added `photo_asset_id` column to `cv_instances` table
- **Type System Updates:**
  - Added `photo_asset_id?: string` to `CVInstance` interface (shared/types/index.ts)
  - Updated `CreateCVInstanceData` and `UpdateCVInstanceData` interfaces in CVInstance model
  - Added asset validation in model create method
- **Photo Upload Refactor (CVEditorPage.tsx:351-373):**
  - Upload photo → Create asset → Link to CV via `photo_asset_id`
  - Remove photo URL injection into markdown content
  - Photo is now a first-class CV attribute, not embedded content
- **Preview Updates (CVPreview.tsx):**
  - Load photo from `cv.photo_asset_id` via Asset API
  - Display photo from asset reference instead of parsing markdown
  - Added `useEffect` hook to fetch photo when `photo_asset_id` changes

**Key Insight:**
> Photos should be CV attachments referenced by ID, not content embedded in markdown. This separates concerns and makes the data model more robust.

---

### ⚙️ Template Config Persistence Fix

**Problem:**
- Template `config` field was not being saved to database
- Users' template customizations were lost on app restart
- Settings persisted but comprehensive config (colors, typography, layout) did not

**Root Cause:**
- `UpdateCVServiceData` interface was missing `config?: TemplateConfig` field
- API received config, but service layer silently ignored it

**Solution:**
- **Service Layer (CVService.ts:9,15,23,74,112):**
  - Added `TemplateConfig` import
  - Added `config?: TemplateConfig` to `CreateCVServiceData` interface
  - Added `config?: TemplateConfig` to `UpdateCVServiceData` interface
  - Pass config to model layer in create() and update() methods
- **Model Layer:** Already supported config correctly - no changes needed

**Key Insight:**
> When adding new fields to TypeScript interfaces, ensure they're added to ALL related DTOs (Data Transfer Objects) throughout the stack: API routes → Service interfaces → Model interfaces.

---

## Technical Implementation Details

### Database Changes
```sql
-- Migration: 001_add_photo_asset_id.sql
ALTER TABLE cv_instances ADD COLUMN photo_asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cv_photo_asset ON cv_instances(photo_asset_id);
```

### API Changes
- CVInstance now includes `photo_asset_id` field
- Photo upload no longer modifies markdown content
- Config field properly persisted through all layers

### Architecture Improvements
1. **Separation of Concerns:** Photos are assets, not content
2. **Type Safety:** Config field propagated through entire type system
3. **Data Integrity:** Foreign key constraint on photo_asset_id
4. **Clean API:** Asset management separate from content management

---

## Migration Notes

### For Existing CVs
- Existing photos embedded in markdown will still display (backward compatible)
- New photo uploads will use the asset reference system
- Manually migrate existing photos by:
  1. Upload new photo via UI
  2. Remove old photo reference from markdown

### Breaking Changes
None - Changes are backward compatible

---

## Key Learnings for Future Development

### 1. **Asset Management Pattern**
```typescript
// ❌ Don't embed assets in content
const markdown = `![Photo](${photoUrl})\n# Name`

// ✅ Reference assets by ID
const cv = {
  photo_asset_id: 'uuid',
  content: '# Name'
}
```

### 2. **Interface Consistency**
```typescript
// Ensure field exists in ALL related interfaces:
interface CreateCVServiceData {
  config?: TemplateConfig  // ✅
}

interface UpdateCVServiceData {
  config?: TemplateConfig  // ✅ Don't forget this!
}
```

### 3. **Data Flow Validation**
When adding new fields, trace the entire data flow:
1. Frontend state → 2. API call → 3. Route handler → 4. Service layer → 5. Model layer → 6. Database

Missing the field at ANY step breaks persistence.

---

## Files Changed

### Backend
- `backend/package.json` - Version bump to 1.4.3
- `backend/src/services/CVService.ts` - Added config to interfaces and methods
- `backend/src/models/CVInstance.ts` - Added photo_asset_id support
- `backend/src/database/migrations/001_add_photo_asset_id.sql` - New migration
- `backend/src/middleware/validation.ts` - Added photo_asset_id to updateCV schema
- `backend/src/api/routes/cvs.ts` - Pass photo_asset_id to service layer
- `backend/src/api/routes/assets.ts` - Content-Disposition inline for images
- `backend/src/app.ts` - Helmet crossOriginResourcePolicy configuration
- `shared/types/index.ts` - Added photo_asset_id to CVInstance

### Frontend
- `frontend/package.json` - Version bump to 1.4.3
- `frontend/src/pages/CVEditorPage.tsx` - Refactored photo upload with reloadCv
- `frontend/src/components/CVPreview.tsx` - Load photo from asset reference
- `frontend/src/hooks/useCVEditor.ts` - Added reloadCv function to hook interface

---

### 🔧 Validation and CORS Fixes

**Problem:**
- 422 Validation Error when updating CV with `photo_asset_id`
- `photo_asset_id` not persisting to database (remained NULL)
- CORS error blocking image display: `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`

**Root Causes:**
1. **Validation:** Joi schema missing `photo_asset_id` field
2. **API Route:** Route handler not passing `photo_asset_id` to service layer
3. **CORS:** Content-Disposition "attachment" + missing crossOriginResourcePolicy in Helmet

**Solutions:**
- **Validation (backend/src/middleware/validation.ts):**
  - Added `photo_asset_id: Joi.string().uuid().allow(null).optional()` to updateCV schema
- **API Route (backend/src/api/routes/cvs.ts:97):**
  - Added `photo_asset_id: req.body.photo_asset_id` to updateData object
- **CORS (backend/src/api/routes/assets.ts:265-269):**
  - Changed Content-Disposition from "attachment" to "inline" for images
  - Images now display in browser instead of forcing download
- **Helmet (backend/src/app.ts:61-64):**
  - Added `crossOriginResourcePolicy: { policy: "cross-origin" }`
  - Allows frontend to load images from backend without CORS blocking

**Key Insight:**
> When adding new database fields, verify they propagate through ALL layers:
> 1. Database schema ✓
> 2. TypeScript types ✓
> 3. Validation schemas ✓
> 4. Service interfaces ✓
> 5. **API route handlers** ← Often forgotten!
> 6. Model methods ✓

---

### 🐛 Runtime Error Fixes

**Problem:**
- `ReferenceError: setCv is not defined` in handleAssetUpload

**Root Cause:**
- `setCv` is internal to useCVEditor hook and not exposed

**Solution:**
- **Hook Interface (frontend/src/hooks/useCVEditor.ts):**
  - Added `reloadCv: () => Promise<void>` to UseCVEditorReturn interface
  - Implemented reloadCv function that calls loadCv(cv.id)
- **Photo Upload (frontend/src/pages/CVEditorPage.tsx:366):**
  - Changed from `setCv(response.data)` to `await reloadCv()`
  - Properly refreshes CV state after photo upload

---

## Testing Checklist

- [x] Photo upload creates asset and links to CV
- [x] Photo displays from asset reference
- [x] Template config persists across restarts
- [x] Backward compatibility with existing CVs
- [x] Database migration executes successfully
- [x] TypeScript compilation (dev mode with ts-node)
- [x] Validation allows photo_asset_id field
- [x] API route passes photo_asset_id to service
- [x] CORS allows cross-origin image loading
- [x] Content-Disposition set to inline for images
- [x] Photo loads and displays without errors

---

## Version History
- **1.4.3** - Photo architecture refactor + Config persistence fix
- **1.4.2** - Photo upload, markdown parsing, UI layout improvements
- **1.4.1** - Comprehensive changelog and bug fixes
