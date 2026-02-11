# CV-Craft API Reference

**Base URL:** `http://localhost:4201/api`

## Response Formats

### Standard Response
```json
{
  "data": { ... },
  "success": true,
  "message": "Optional success message"
}
```

### Paginated Response
```json
{
  "data": [ ... ],
  "total": 100,
  "limit": 50,
  "offset": 0,
  "success": true
}
```

### Error Response
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": { ... }
}
```

---

## CV Endpoints

### List CVs
```
GET /api/cvs
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | - | Filter by status: `active`, `archived`, `deleted` |
| limit | number | 50 | Max results per page (1-100) |
| offset | number | 0 | Pagination offset |
| orderBy | string | updated_at | Sort field: `created_at`, `updated_at`, `name` |
| orderDirection | string | DESC | Sort direction: `ASC`, `DESC` |

**Response:** Paginated list of CVInstance objects

---

### Create CV
```
POST /api/cvs
```

**Request Body:**
```json
{
  "name": "My CV",
  "content": "---\nname: John Doe\n---\n# Experience\n...",
  "template_id": "default",
  "settings": { ... }
}
```

**Response:** `201 Created` with CVInstance

---

### Get CV
```
GET /api/cvs/:id
```

**Response:** CVInstance object with all data

---

### Update CV
```
PUT /api/cvs/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "content": "...",
  "template_id": "default",
  "photo_asset_id": "uuid",
  "settings": { ... },
  "config": { ... },
  "status": "active"
}
```

All fields are optional.

**Response:** Updated CVInstance

---

### Delete CV
```
DELETE /api/cvs/:id
```

**Response:** `204 No Content`

Performs soft delete (sets status to `deleted`).

---

### Duplicate CV
```
POST /api/cvs/:id/duplicate
```

**Request Body:**
```json
{
  "name": "Copy of My CV"
}
```

**Response:** `201 Created` with new CVInstance

---

### Archive CV
```
POST /api/cvs/:id/archive
```

**Response:** Archived CVInstance

---

### Restore CV
```
POST /api/cvs/:id/restore
```

**Response:** Restored CVInstance (status: `active`)

---

### Get CV Statistics
```
GET /api/cvs/:id/stats
```

**Response:**
```json
{
  "data": {
    "word_count": 450,
    "section_count": 5,
    "character_count": 2500,
    "last_modified": "2026-01-15T10:30:00Z"
  }
}
```

---

### Re-parse CV Content
```
POST /api/cvs/:id/reparse
```

Re-parses the markdown content (useful after parser updates).

**Response:** Updated CVInstance with new `parsed_content`

---

### Search CVs
```
GET /api/cvs/search?q=developer
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (name, content) |
| status | string | Filter by status |
| limit | number | Max results |
| offset | number | Pagination offset |

**Response:** Paginated search results

---

### Validate CV Content
```
POST /api/cvs/validate
```

**Request Body:**
```json
{
  "content": "---\nname: John Doe\n---\n..."
}
```

**Response:**
```json
{
  "data": {
    "valid": true,
    "errors": []
  }
}
```

---

### Export CV
```
POST /api/cvs/:id/export
```

**Request Body:**
```json
{
  "type": "pdf"
}
```

Types: `pdf`, `web_package`

**Response:**
```json
{
  "data": {
    "filename": "my-cv.pdf",
    "file_path": "/exports/uuid.pdf",
    "export_type": "pdf",
    "size": 102400,
    "generated_at": "2026-01-15T10:30:00Z"
  }
}
```

---

## Template Endpoints

### List Templates
```
GET /api/templates
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| active_only | boolean | true | Only return active templates |
| limit | number | 50 | Max results |
| offset | number | 0 | Pagination offset |
| orderBy | string | created_at | Sort: `created_at`, `name`, `version` |
| orderDirection | string | DESC | Sort direction |

---

### Create Template
```
POST /api/templates
```

**Request Body:**
```json
{
  "name": "Modern Template",
  "description": "A clean, modern CV template",
  "css": ".cv-container { ... }",
  "config_schema": { ... },
  "default_settings": { ... },
  "preview_image": "https://...",
  "version": "1.0.0"
}
```

**Response:** `201 Created` with Template

---

### Get Template
```
GET /api/templates/:id
```

**Response:** Template object

---

### Update Template
```
PUT /api/templates/:id
```

**Request Body:** Same as create (all fields optional)

**Response:** Updated Template

---

### Delete Template
```
DELETE /api/templates/:id
```

**Response:** `204 No Content`

---

### Activate Template
```
POST /api/templates/:id/activate
```

Makes template available for use.

**Response:** Updated Template

---

### Deactivate Template
```
POST /api/templates/:id/deactivate
```

Hides template from selection (existing CVs unaffected).

**Response:** Updated Template

---

### Get Template Usage
```
GET /api/templates/:id/usage
```

**Response:**
```json
{
  "data": {
    "total_cvs": 15,
    "active_cvs": 12,
    "archived_cvs": 3
  }
}
```

---

### Search Templates
```
GET /api/templates/search?q=modern
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (required) |
| active_only | boolean | Filter to active templates |

---

### Validate Template
```
POST /api/templates/validate
```

**Request Body:**
```json
{
  "config_schema": { ... },
  "default_settings": { ... }
}
```

**Response:**
```json
{
  "data": {
    "valid": true,
    "message": "Template data is valid"
  }
}
```

---

## Saved Theme Endpoints

### List Saved Themes
```
GET /api/saved-themes
```

**Response:** Array of SavedTheme objects (ordered by updated_at DESC)

---

### Create Saved Theme
```
POST /api/saved-themes
```

**Request Body:**
```json
{
  "name": "My Custom Theme",
  "config": { ... },
  "template_id": "default-modern"
}
```

**Response:** `201 Created` with SavedTheme

---

### Get Saved Theme
```
GET /api/saved-themes/:id
```

**Response:** SavedTheme object

---

### Update Saved Theme
```
PUT /api/saved-themes/:id
```

**Request Body:**
```json
{
  "name": "Renamed Theme",
  "config": { ... }
}
```

All fields are optional.

**Response:** Updated SavedTheme

---

### Delete Saved Theme
```
DELETE /api/saved-themes/:id
```

**Response:** `204 No Content`

---

## Asset Endpoints

### Upload Asset
```
POST /api/assets/upload
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | The file to upload |
| cv_id | UUID | Yes | Associated CV ID |
| usage_context | string | No | Context: `profile_image`, `document`, etc. |
| generate_thumbnails | boolean | No | Generate image thumbnails |

**Response:** `201 Created` with Asset

---

### Upload Multiple Assets
```
POST /api/assets/upload-multiple
Content-Type: multipart/form-data
```

Same fields as single upload. Max 5 files.

**Response:** Array of Asset objects

---

### Upload Profile Image
```
POST /api/assets/upload-image
Content-Type: multipart/form-data
```

Specialized endpoint for profile images with automatic thumbnail generation.

---

### Upload Document
```
POST /api/assets/upload-document
Content-Type: multipart/form-data
```

Specialized endpoint for document uploads (PDF, DOC, etc.).

---

### List Assets
```
GET /api/assets
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cv_id | UUID | Filter by CV |
| file_type | string | Filter: `image`, `document`, `other` |
| usage_context | string | Filter by usage |
| limit | number | Max results (1-100) |
| offset | number | Pagination offset |
| orderBy | string | Sort: `uploaded_at`, `filename`, `file_size` |
| orderDirection | string | Sort direction |

---

### Get Asset
```
GET /api/assets/:id
```

**Response:** Asset metadata

---

### Update Asset
```
PUT /api/assets/:id
```

**Request Body:**
```json
{
  "filename": "new-name.jpg",
  "usage_context": "profile_image",
  "metadata": {
    "alt_text": "Profile photo"
  }
}
```

---

### Delete Asset
```
DELETE /api/assets/:id
```

**Response:** `204 No Content`

Deletes both database record and file.

---

### Download/Serve Asset File
```
GET /api/assets/:id/file
```

Returns the actual file with appropriate headers.

- Images: `Content-Disposition: inline`
- Documents: `Content-Disposition: attachment`

---

### Get Asset Info
```
GET /api/assets/:id/info
```

Returns asset metadata with public URL.

---

### Get Assets for CV
```
GET /api/assets/cv/:cv_id
```

Returns all assets associated with a CV.

---

### Delete All CV Assets
```
DELETE /api/assets/cv/:cv_id
```

Deletes all assets for a CV.

**Response:**
```json
{
  "data": {
    "deleted_count": 3
  }
}
```

---

### Get Storage Statistics
```
GET /api/assets/stats/overview
```

**Response:**
```json
{
  "data": {
    "total_files": 150,
    "total_size_bytes": 52428800,
    "by_type": {
      "image": { "count": 100, "size": 40000000 },
      "document": { "count": 50, "size": 12428800 }
    }
  }
}
```

---

### Get CV Storage Usage
```
GET /api/assets/stats/cv/:cv_id
```

**Response:**
```json
{
  "data": {
    "cv_id": "uuid",
    "storage_used": 1048576,
    "storage_used_mb": 1.0
  }
}
```

---

### Cleanup Orphaned Files
```
POST /api/assets/cleanup
```

Removes files not referenced in database.

---

### Get Supported File Types
```
GET /api/assets/types/supported
```

**Response:**
```json
{
  "data": {
    "images": {
      "mime_types": ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
      "extensions": [".jpg", ".jpeg", ".png", ".webp", ".svg"],
      "max_size": "10MB"
    },
    "documents": {
      "mime_types": ["application/pdf", "text/plain", "text/markdown", ...],
      "extensions": [".pdf", ".txt", ".md", ".doc", ".docx"],
      "max_size": "20MB"
    }
  }
}
```

---

## Health & Info Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 3600
}
```

---

### API Info
```
GET /
```

Returns API version and available endpoints.

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 422 | Invalid request data |
| DUPLICATE_NAME | 409 | Name already exists |
| INVALID_CONTENT | 422 | Invalid markdown content |
| FILE_NOT_FOUND | 404 | Asset file missing |
| FILE_TOO_LARGE | 413 | Upload exceeds size limit |
| INVALID_FILE_TYPE | 415 | Unsupported file type |
| TEMPLATE_IN_USE | 409 | Cannot delete template with CVs |
| DATABASE_ERROR | 500 | Database operation failed |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## Rate Limiting

| Environment | Limit |
|-------------|-------|
| Development | 1000 requests / 15 minutes |
| Production | 100 requests / 15 minutes |

Headers returned:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
