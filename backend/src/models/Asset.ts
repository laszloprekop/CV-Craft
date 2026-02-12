/**
 * Asset Model
 * 
 * Data access layer for CV assets (files, images, documents) with database operations
 */

import Database from 'better-sqlite3';
import type { Asset } from '../../../shared/types';

export interface CreateAssetData {
  id: string;
  cv_id: string;
  filename: string;
  file_type: 'image' | 'document' | 'other';
  mime_type: string;
  file_size: number;
  storage_path: string;
  usage_context?: string;
  metadata?: {
    width?: number;
    height?: number;
    alt_text?: string;
    [key: string]: any;
  };
}

export interface UpdateAssetData {
  filename?: string;
  usage_context?: string;
  metadata?: {
    width?: number;
    height?: number;
    alt_text?: string;
    [key: string]: any;
  };
}

export interface ListAssetsOptions {
  cv_id?: string;
  file_type?: 'image' | 'document' | 'other';
  usage_context?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'uploaded_at' | 'filename' | 'file_size';
  orderDirection?: 'ASC' | 'DESC';
}

const ALLOWED_ORDER_COLUMNS = ['uploaded_at', 'filename', 'file_size', 'mime_type', 'created_at'] as const;
const ALLOWED_DIRECTIONS = ['ASC', 'DESC'] as const;

export class AssetModel {
  constructor(private db: Database.Database) {}

  /**
   * Create a new asset
   */
  create(data: CreateAssetData): Asset {
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT INTO assets (
        id, cv_id, filename, file_type, mime_type, file_size,
        storage_path, usage_context, uploaded_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.id,
      data.cv_id,
      data.filename,
      data.file_type,
      data.mime_type,
      data.file_size,
      data.storage_path,
      data.usage_context || null,
      now,
      data.metadata ? JSON.stringify(data.metadata) : null
    );

    if (result.changes === 0) {
      throw new Error('Failed to create asset');
    }

    return this.findById(data.id)!;
  }

  /**
   * Find asset by ID
   */
  findById(id: string): Asset | null {
    const stmt = this.db.prepare('SELECT * FROM assets WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.mapRowToAsset(row);
  }

  /**
   * List assets with filtering and pagination
   */
  list(options: ListAssetsOptions = {}): { data: Asset[]; total: number } {
    const {
      cv_id,
      file_type,
      usage_context,
      limit = 50,
      offset = 0,
      orderBy: rawOrderBy = 'uploaded_at',
      orderDirection: rawDirection = 'DESC'
    } = options;

    // Validate ORDER BY against whitelist to prevent SQL injection
    const orderBy = (ALLOWED_ORDER_COLUMNS as readonly string[]).includes(rawOrderBy) ? rawOrderBy : 'uploaded_at';
    const orderDirection = (ALLOWED_DIRECTIONS as readonly string[]).includes(rawDirection) ? rawDirection : 'DESC';

    // Build query conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (cv_id) {
      conditions.push('cv_id = ?');
      params.push(cv_id);
    }

    if (file_type) {
      conditions.push('file_type = ?');
      params.push(file_type);
    }

    if (usage_context) {
      conditions.push('usage_context = ?');
      params.push(usage_context);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM assets ${whereClause}`);
    const countResult = countStmt.get(...params) as { count: number };
    const total = countResult.count;

    // Data query
    const dataStmt = this.db.prepare(`
      SELECT * FROM assets
      ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `);

    const rows = dataStmt.all(...params, limit, offset) as any[];
    const data = rows.map(row => this.mapRowToAsset(row));

    return { data, total };
  }

  /**
   * Update asset
   */
  update(id: string, data: UpdateAssetData): Asset {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (data.filename !== undefined) {
      updateFields.push('filename = ?');
      updateValues.push(data.filename);
    }

    if (data.usage_context !== undefined) {
      updateFields.push('usage_context = ?');
      updateValues.push(data.usage_context);
    }

    if (data.metadata !== undefined) {
      updateFields.push('metadata = ?');
      updateValues.push(data.metadata ? JSON.stringify(data.metadata) : null);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    const stmt = this.db.prepare(`
      UPDATE assets 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...updateValues, id);

    if (result.changes === 0) {
      throw new Error('Asset not found or no changes made');
    }

    return this.findById(id)!;
  }

  /**
   * Delete asset
   */
  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM assets WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new Error('Asset not found');
    }
  }

  /**
   * Find assets by CV ID
   */
  findByCV(cvId: string): Asset[] {
    const stmt = this.db.prepare('SELECT * FROM assets WHERE cv_id = ? ORDER BY uploaded_at DESC');
    const rows = stmt.all(cvId) as any[];
    return rows.map(row => this.mapRowToAsset(row));
  }

  /**
   * Find assets by file type
   */
  findByFileType(fileType: 'image' | 'document' | 'other'): Asset[] {
    const stmt = this.db.prepare('SELECT * FROM assets WHERE file_type = ? ORDER BY uploaded_at DESC');
    const rows = stmt.all(fileType) as any[];
    return rows.map(row => this.mapRowToAsset(row));
  }

  /**
   * Find assets by usage context
   */
  findByUsageContext(context: string): Asset[] {
    const stmt = this.db.prepare('SELECT * FROM assets WHERE usage_context = ? ORDER BY uploaded_at DESC');
    const rows = stmt.all(context) as any[];
    return rows.map(row => this.mapRowToAsset(row));
  }

  /**
   * Get total storage used by CV
   */
  getStorageUsedByCV(cvId: string): number {
    const stmt = this.db.prepare('SELECT SUM(file_size) as total FROM assets WHERE cv_id = ?');
    const result = stmt.get(cvId) as { total: number | null };
    return result.total || 0;
  }

  /**
   * Get total storage used globally
   */
  getTotalStorageUsed(): number {
    const stmt = this.db.prepare('SELECT SUM(file_size) as total FROM assets');
    const result = stmt.get() as { total: number | null };
    return result.total || 0;
  }

  /**
   * Delete all assets for a CV (cascade delete)
   */
  deleteAllForCV(cvId: string): number {
    const stmt = this.db.prepare('DELETE FROM assets WHERE cv_id = ?');
    const result = stmt.run(cvId);
    return result.changes;
  }

  /**
   * Check if asset exists
   */
  exists(id: string): boolean {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM assets WHERE id = ?');
    const result = stmt.get(id) as { count: number };
    return result.count > 0;
  }

  /**
   * Get asset statistics
   */
  getStats(): {
    total_count: number;
    total_size: number;
    by_type: { type: string; count: number; size: number }[];
    by_cv: { cv_id: string; count: number; size: number }[];
  } {
    // Total counts and size
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count, SUM(file_size) as size FROM assets');
    const totalResult = totalStmt.get() as { count: number; size: number | null };

    // By type
    const typeStmt = this.db.prepare(`
      SELECT file_type as type, COUNT(*) as count, SUM(file_size) as size 
      FROM assets 
      GROUP BY file_type
    `);
    const byType = typeStmt.all() as { type: string; count: number; size: number }[];

    // By CV
    const cvStmt = this.db.prepare(`
      SELECT cv_id, COUNT(*) as count, SUM(file_size) as size 
      FROM assets 
      GROUP BY cv_id 
      ORDER BY size DESC 
      LIMIT 10
    `);
    const byCV = cvStmt.all() as { cv_id: string; count: number; size: number }[];

    return {
      total_count: totalResult.count,
      total_size: totalResult.size || 0,
      by_type: byType,
      by_cv: byCV
    };
  }

  /**
   * Map database row to Asset object
   */
  private mapRowToAsset(row: any): Asset {
    return {
      id: row.id,
      cv_id: row.cv_id,
      filename: row.filename,
      file_type: row.file_type as 'image' | 'document' | 'other',
      mime_type: row.mime_type,
      file_size: row.file_size,
      storage_path: row.storage_path,
      usage_context: row.usage_context,
      uploaded_at: new Date(row.uploaded_at).toISOString(),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }
}

/**
 * Factory function to create Asset model
 */
export function createAssetModel(db: Database.Database): AssetModel {
  return new AssetModel(db);
}