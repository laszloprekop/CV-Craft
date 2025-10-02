-- Migration: Add photo_asset_id to cv_instances
-- Date: 2025-10-02
-- Purpose: Separate photo management from markdown content

-- Add photo_asset_id column to cv_instances table
ALTER TABLE cv_instances ADD COLUMN photo_asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL;

-- Create index for photo asset lookups
CREATE INDEX IF NOT EXISTS idx_cv_photo_asset ON cv_instances(photo_asset_id);

-- Migration complete
