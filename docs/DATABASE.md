# CV-Craft Database Schema

**Database:** SQLite
**Location:** `backend/cv-craft.db`

## Overview

CV-Craft uses SQLite for data persistence with the following key features:
- Foreign key constraints enabled
- WAL mode for better concurrency
- Indexed columns for query performance
- JSON columns for flexible data storage

---

## Tables

### cv_instances

Stores CV documents with content, configuration, and metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID identifier |
| name | TEXT | NOT NULL, max 100 chars | CV display name |
| content | TEXT | NOT NULL | Markdown source content |
| parsed_content | TEXT | - | JSON: Parsed CV structure |
| template_id | TEXT | NOT NULL, FK → templates | Associated template |
| config | TEXT | - | JSON: TemplateConfig (comprehensive) |
| settings | TEXT | - | JSON: TemplateSettings (legacy) |
| status | TEXT | CHECK: active/archived/deleted | CV status |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |
| metadata | TEXT | - | JSON: Custom metadata |

**Foreign Keys:**
- `template_id` → `templates(id)` ON DELETE RESTRICT

---

### templates

Stores CV template definitions and default configurations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Template identifier (e.g., "default") |
| name | TEXT | NOT NULL, UNIQUE, max 50 chars | Display name |
| description | TEXT | - | Template description |
| css | TEXT | NOT NULL | Template CSS stylesheet |
| config_schema | TEXT | NOT NULL | JSON Schema for validation |
| default_config | TEXT | NOT NULL | JSON: Default TemplateConfig |
| default_settings | TEXT | NOT NULL | JSON: Default TemplateSettings (legacy) |
| preview_image | TEXT | - | Preview image URL |
| is_active | INTEGER | DEFAULT 1 | Active flag (0/1) |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| version | TEXT | NOT NULL, semantic version | e.g., "1.0.0" |

**Constraints:**
- `version` must match pattern `X.Y.Z`

---

### assets

Stores files associated with CV instances (photos, documents).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID identifier |
| cv_id | TEXT | NOT NULL, FK → cv_instances | Associated CV |
| filename | TEXT | NOT NULL, max 255 chars | Original filename |
| file_type | TEXT | CHECK: image/document/other | File category |
| mime_type | TEXT | NOT NULL | MIME type (e.g., image/jpeg) |
| file_size | INTEGER | NOT NULL, 1-10485760 | Size in bytes (max 10MB) |
| storage_path | TEXT | NOT NULL | Filesystem path |
| usage_context | TEXT | - | Usage: profile_image, etc. |
| uploaded_at | INTEGER | NOT NULL | Unix timestamp |
| metadata | TEXT | - | JSON: width, height, alt_text |

**Foreign Keys:**
- `cv_id` → `cv_instances(id)` ON DELETE CASCADE

---

### exports

Tracks generated PDF and web package exports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID identifier |
| cv_id | TEXT | NOT NULL, FK → cv_instances | Source CV |
| export_type | TEXT | CHECK: pdf/web_package | Export format |
| filename | TEXT | NOT NULL | Generated filename |
| file_path | TEXT | NOT NULL | Filesystem path |
| file_size | INTEGER | CHECK: > 0 | Size in bytes |
| settings_snapshot | TEXT | - | JSON: Settings at export time |
| generated_at | INTEGER | NOT NULL | Unix timestamp |
| expires_at | INTEGER | - | Optional expiration timestamp |
| metadata | TEXT | - | JSON: Additional metadata |

**Foreign Keys:**
- `cv_id` → `cv_instances(id)` ON DELETE CASCADE

---

## Indexes

### Performance Indexes

| Name | Table | Columns | Purpose |
|------|-------|---------|---------|
| idx_cv_status_updated | cv_instances | status, updated_at | Filter by status and sort by date |
| idx_cv_name_active | cv_instances | name (WHERE status='active') | Unique names per active CVs |
| idx_assets_cv_type | assets | cv_id, file_type | Lookup assets by CV and type |
| idx_assets_uploaded | assets | uploaded_at | Find old assets for cleanup |
| idx_exports_cv_type | exports | cv_id, export_type | Lookup exports by CV and type |
| idx_exports_expires | exports | expires_at (WHERE NOT NULL) | Find expired exports |
| idx_templates_active | templates | is_active (WHERE is_active=1) | Active templates lookup |
| idx_templates_name | templates | name | Template name searches |

---

## JSON Structures

### ParsedCVContent (parsed_content)

```typescript
{
  frontmatter: {
    name: string,
    email: string,
    phone?: string,
    location?: string,
    linkedin?: string,
    github?: string,
    website?: string,
    summary?: string
  },
  sections: [
    {
      title: string,
      type: "experience" | "education" | "skills" | "custom",
      content: string,
      items?: [...]
    }
  ],
  html: string,
  cssVariables: Record<string, string>
}
```

### TemplateConfig (config)

```typescript
{
  colors: {
    primary: string,      // hex color
    onPrimary: string,
    secondary: string,
    onSecondary: string,
    tertiary: string,
    onTertiary: string,
    muted: string,
    onMuted: string,
    text: string,
    textSecondary: string,
    textMuted: string,
    background: string
  },
  typography: {
    baseFontSize: string,   // e.g., "10pt"
    headingFontFamily: string,
    bodyFontFamily: string,
    fontScale: {
      h1: number,
      h2: number,
      h3: number,
      small: number,
      tiny: number
    },
    fontWeights: {
      normal: number,
      medium: number,
      semibold: number,
      bold: number
    },
    lineHeight: number
  },
  layout: {
    pageWidth: string,      // e.g., "210mm"
    margins: { top, right, bottom, left },
    sectionSpacing: string,
    itemSpacing: string,
    columnGap: string
  },
  components: {
    name: { ... },
    header: { ... },
    sectionHeader: { ... },
    jobTitle: { ... },
    company: { ... },
    date: { ... },
    tags: { ... },
    bullets: { ... }
  },
  pdf: {
    format: string,
    margins: { ... }
  },
  advanced: {
    customCSS: string
  }
}
```

### TemplateSettings (settings) - Legacy

```typescript
{
  primaryColor: string,
  accentColor: string,
  backgroundColor: string,
  fontFamily: string,
  fontSize: {
    h1: string,
    h2: string,
    h3: string,
    body: string,
    small: string
  },
  margins: { top, right, bottom, left },
  showPhoto: boolean,
  photoPosition: "left" | "right",
  sectionStyle: "default" | "bordered" | "underlined",
  bulletStyle: "disc" | "circle" | "square" | "none"
}
```

### Asset Metadata

```typescript
{
  width?: number,    // For images
  height?: number,   // For images
  alt_text?: string,
  thumbnails?: {
    small: string,   // Path to thumbnail
    medium: string
  }
}
```

---

## Relationships

```
templates (1) ←──── (N) cv_instances
                          │
                          ├──── (N) assets
                          │
                          └──── (N) exports
```

- A **template** can be used by many **CVs**
- A **CV** can have many **assets** (cascade delete)
- A **CV** can have many **exports** (cascade delete)
- Deleting a template with CVs is prevented (RESTRICT)

---

## Common Queries

### List Active CVs (sorted by recent)
```sql
SELECT * FROM cv_instances
WHERE status = 'active'
ORDER BY updated_at DESC
LIMIT 50 OFFSET 0;
```

### Get CV with Template
```sql
SELECT cv.*, t.name as template_name, t.css as template_css
FROM cv_instances cv
JOIN templates t ON cv.template_id = t.id
WHERE cv.id = ?;
```

### Get Assets for CV
```sql
SELECT * FROM assets
WHERE cv_id = ?
ORDER BY uploaded_at DESC;
```

### Search CVs
```sql
SELECT * FROM cv_instances
WHERE status = 'active'
AND (name LIKE '%query%' OR content LIKE '%query%')
ORDER BY updated_at DESC;
```

### Get Storage Usage
```sql
SELECT
  cv_id,
  COUNT(*) as file_count,
  SUM(file_size) as total_size
FROM assets
GROUP BY cv_id;
```

### Cleanup Expired Exports
```sql
DELETE FROM exports
WHERE expires_at IS NOT NULL
AND expires_at < strftime('%s', 'now');
```

---

## Maintenance

### Backup
```bash
# Simple file copy (stop server first)
cp backend/cv-craft.db backup/cv-craft-$(date +%Y%m%d).db

# Include WAL files if present
cp backend/cv-craft.db-wal backup/
cp backend/cv-craft.db-shm backup/
```

### Integrity Check
```sql
PRAGMA integrity_check;
```

### Vacuum (reclaim space)
```sql
VACUUM;
```

### Analyze (update query planner stats)
```sql
ANALYZE;
```

---

## Schema Initialization

Schema is created automatically on first run via:
- `backend/src/database/schema.sql` - Table definitions
- `backend/src/database/init-data.sql` - Default template data

The `DatabaseManager` class handles:
1. Creating database file if missing
2. Running schema SQL
3. Inserting default data
4. Enabling WAL mode and foreign keys
