-- CV Craft Database Schema
-- SQLite database schema for CV generator application
-- Created: 2025-09-11

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- CV Instances table
-- Stores CV configuration, content, and metadata
CREATE TABLE IF NOT EXISTS cv_instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK(LENGTH(name) <= 100),
    content TEXT NOT NULL,
    parsed_content TEXT, -- JSON
    template_id TEXT NOT NULL,
    config TEXT, -- JSON (TemplateConfig) - new comprehensive configuration
    settings TEXT, -- JSON (TemplateSettings) - legacy support
    status TEXT CHECK(status IN ('active', 'archived', 'deleted')) DEFAULT 'active',
    created_at INTEGER NOT NULL, -- Unix timestamp
    updated_at INTEGER NOT NULL, -- Unix timestamp
    metadata TEXT, -- JSON
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE RESTRICT
);

-- Templates table
-- Stores CV template definitions and configurations
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK(LENGTH(name) <= 50),
    description TEXT,
    css TEXT NOT NULL,
    config_schema TEXT NOT NULL, -- JSON Schema
    default_config TEXT NOT NULL, -- JSON (TemplateConfig) - new comprehensive configuration
    default_settings TEXT NOT NULL, -- JSON (TemplateSettings) - legacy support
    preview_image TEXT,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    version TEXT NOT NULL CHECK(version GLOB '[0-9]*.[0-9]*.[0-9]*') -- Semantic versioning
);

-- Assets table
-- Stores files associated with CV instances (photos, documents, etc.)
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    cv_id TEXT NOT NULL,
    filename TEXT NOT NULL CHECK(LENGTH(filename) <= 255),
    file_type TEXT CHECK(file_type IN ('image', 'document', 'other')) NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL CHECK(file_size > 0 AND file_size <= 10485760), -- 10MB max
    storage_path TEXT NOT NULL,
    usage_context TEXT,
    uploaded_at INTEGER NOT NULL,
    metadata TEXT, -- JSON
    FOREIGN KEY (cv_id) REFERENCES cv_instances(id) ON DELETE CASCADE
);

-- Exports table
-- Tracks generated exports (PDF and web packages)
CREATE TABLE IF NOT EXISTS exports (
    id TEXT PRIMARY KEY,
    cv_id TEXT NOT NULL,
    export_type TEXT CHECK(export_type IN ('pdf', 'web_package')) NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER CHECK(file_size > 0),
    settings_snapshot TEXT, -- JSON (TemplateSettings at time of export)
    generated_at INTEGER NOT NULL,
    expires_at INTEGER, -- Optional expiration for cleanup
    metadata TEXT, -- JSON
    FOREIGN KEY (cv_id) REFERENCES cv_instances(id) ON DELETE CASCADE
);

-- Performance indexes
-- CV lookups by status and date
CREATE INDEX IF NOT EXISTS idx_cv_status_updated ON cv_instances(status, updated_at);

-- CV name uniqueness within active status
CREATE UNIQUE INDEX IF NOT EXISTS idx_cv_name_active ON cv_instances(name) WHERE status = 'active';

-- Asset lookups by CV and type
CREATE INDEX IF NOT EXISTS idx_assets_cv_type ON assets(cv_id, file_type);

-- Asset cleanup - find orphaned assets
CREATE INDEX IF NOT EXISTS idx_assets_uploaded ON assets(uploaded_at);

-- Export lookups by CV and type
CREATE INDEX IF NOT EXISTS idx_exports_cv_type ON exports(cv_id, export_type);

-- Export cleanup - find expired exports
CREATE INDEX IF NOT EXISTS idx_exports_expires ON exports(expires_at) WHERE expires_at IS NOT NULL;

-- Template active lookup
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active) WHERE is_active = 1;

-- Template name lookup for uniqueness
CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);

-- Saved themes table
-- Stores named TemplateConfig presets that users can save, load, and reuse
CREATE TABLE IF NOT EXISTS saved_themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK(LENGTH(name) <= 100),
    config TEXT NOT NULL,  -- JSON TemplateConfig
    template_id TEXT NOT NULL DEFAULT 'default-modern',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_saved_themes_name ON saved_themes(name);
CREATE INDEX IF NOT EXISTS idx_saved_themes_updated ON saved_themes(updated_at);

-- Schema setup complete
-- Note: Default template data is inserted separately via init-data.sql

-- Verify schema integrity
PRAGMA integrity_check;