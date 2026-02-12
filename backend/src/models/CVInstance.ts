/**
 * CVInstance Model
 * 
 * Data model for CV instances with SQLite operations and validation
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { CVInstance, TemplateConfig, TemplateSettings, ParsedCVContent } from '../../../shared/types';

export interface CreateCVInstanceData {
  name: string;
  content: string;
  parsed_content?: ParsedCVContent;
  template_id: string;
  photo_asset_id?: string;
  config?: TemplateConfig;
  settings?: TemplateSettings;
  metadata?: Record<string, any>;
}

export interface UpdateCVInstanceData {
  name?: string;
  content?: string;
  parsed_content?: ParsedCVContent;
  template_id?: string;
  photo_asset_id?: string | null;
  config?: TemplateConfig;
  settings?: TemplateSettings;
  status?: 'active' | 'archived';
  metadata?: Record<string, any>;
}

export interface ListCVInstancesOptions {
  status?: 'active' | 'archived' | 'deleted';
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'name';
  orderDirection?: 'ASC' | 'DESC';
}

const ALLOWED_ORDER_COLUMNS = ['created_at', 'updated_at', 'name', 'status'] as const;
const ALLOWED_DIRECTIONS = ['ASC', 'DESC'] as const;

export class CVInstanceModel {
  constructor(private db: Database.Database) {}

  /**
   * Create a new CV instance
   */
  async create(data: CreateCVInstanceData): Promise<CVInstance> {
    const now = Date.now();
    const id = uuidv4();

    // Validate required fields
    this.validateCreateData(data);

    // Prepare data for insertion
    const insertData = {
      id,
      name: data.name.trim(),
      content: data.content,
      parsed_content: data.parsed_content ? JSON.stringify(data.parsed_content) : null,
      template_id: data.template_id,
      photo_asset_id: data.photo_asset_id || null,
      config: data.config ? JSON.stringify(data.config) : null,
      settings: data.settings ? JSON.stringify(data.settings) : null,
      status: 'active',
      created_at: now,
      updated_at: now,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    };

    // Use transaction to ensure atomicity
    const transaction = this.db.transaction(() => {
      // Verify template exists
      const template = this.db.prepare('SELECT id FROM templates WHERE id = ? AND is_active = 1').get(data.template_id);
      if (!template) {
        throw new CVInstanceError('Template not found or inactive', 'INVALID_TEMPLATE');
      }

      // Verify photo asset exists if provided
      if (data.photo_asset_id) {
        const asset = this.db.prepare('SELECT id FROM assets WHERE id = ? AND file_type = ?').get(data.photo_asset_id, 'image');
        if (!asset) {
          throw new CVInstanceError('Photo asset not found or is not an image', 'INVALID_ASSET');
        }
      }

      // Insert CV instance
      const stmt = this.db.prepare(`
        INSERT INTO cv_instances (
          id, name, content, parsed_content, template_id, photo_asset_id, config, settings, status, created_at, updated_at, metadata
        ) VALUES (
          @id, @name, @content, @parsed_content, @template_id, @photo_asset_id, @config, @settings, @status, @created_at, @updated_at, @metadata
        )
      `);

      stmt.run(insertData);
    });

    try {
      transaction();
      // Return the created instance
      return this.findById(id)!;
    } catch (error) {
      if (error instanceof CVInstanceError) {
        throw error;
      }
      throw new CVInstanceError(`Failed to create CV instance: ${error}`, 'DATABASE_ERROR');
    }
  }

  /**
   * Find CV instance by ID
   */
  findById(id: string): CVInstance | null {
    const stmt = this.db.prepare(`
      SELECT * FROM cv_instances WHERE id = ? AND status != 'deleted'
    `);
    
    const row = stmt.get(id);
    if (!row) return null;

    return this.mapRowToCVInstance(row);
  }

  /**
   * Find CV instance by name and status
   */
  findByNameAndStatus(name: string, status: string): CVInstance | null {
    const stmt = this.db.prepare(`
      SELECT * FROM cv_instances WHERE name = ? AND status = ?
    `);
    
    const row = stmt.get(name, status);
    if (!row) return null;

    return this.mapRowToCVInstance(row);
  }

  /**
   * List CV instances with pagination and filtering
   */
  list(options: ListCVInstancesOptions = {}): { data: CVInstance[]; total: number } {
    const {
      status,
      limit = 50,
      offset = 0,
      orderBy: rawOrderBy = 'updated_at',
      orderDirection: rawDirection = 'DESC'
    } = options;

    // Validate ORDER BY against whitelist to prevent SQL injection
    const orderBy = (ALLOWED_ORDER_COLUMNS as readonly string[]).includes(rawOrderBy) ? rawOrderBy : 'updated_at';
    const orderDirection = (ALLOWED_DIRECTIONS as readonly string[]).includes(rawDirection) ? rawDirection : 'DESC';

    // Validate parameters
    if (limit < 1 || limit > 100) {
      throw new CVInstanceError('Limit must be between 1 and 100', 'INVALID_PARAMS');
    }
    if (offset < 0) {
      throw new CVInstanceError('Offset must be non-negative', 'INVALID_PARAMS');
    }

    // Build WHERE clause
    let whereClause = "status != 'deleted'";
    const params: any[] = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Count total
    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM cv_instances WHERE ${whereClause}`);
    const { count: total } = countStmt.get(...params) as { count: number };

    // Get data with pagination
    const dataStmt = this.db.prepare(`
      SELECT * FROM cv_instances
      WHERE ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `);

    const rows = dataStmt.all(...params, limit, offset);
    const data = rows.map(row => this.mapRowToCVInstance(row));

    return { data, total };
  }

  /**
   * Update CV instance
   */
  async update(id: string, data: UpdateCVInstanceData): Promise<CVInstance> {
    const existing = this.findById(id);
    if (!existing) {
      throw new CVInstanceError('CV instance not found', 'NOT_FOUND');
    }

    // Validate update data
    this.validateUpdateData(data);

    // Build update query
    const updates: string[] = [];
    const params: Record<string, string | number | null> = { id };

    if (data.name !== undefined) {
      updates.push('name = @name');
      params.name = data.name.trim();
    }
    if (data.content !== undefined) {
      updates.push('content = @content');
      params.content = data.content;
    }
    if (data.parsed_content !== undefined) {
      updates.push('parsed_content = @parsed_content');
      params.parsed_content = JSON.stringify(data.parsed_content);
    }
    if (data.template_id !== undefined) {
      updates.push('template_id = @template_id');
      params.template_id = data.template_id;
    }
    if (data.photo_asset_id !== undefined) {
      updates.push('photo_asset_id = @photo_asset_id');
      params.photo_asset_id = data.photo_asset_id || null;
    }
    if (data.config !== undefined) {
      updates.push('config = @config');
      params.config = JSON.stringify(data.config);
    }
    if (data.settings !== undefined) {
      updates.push('settings = @settings');
      params.settings = JSON.stringify(data.settings);
    }
    if (data.status !== undefined) {
      updates.push('status = @status');
      params.status = data.status;
    }
    if (data.metadata !== undefined) {
      updates.push('metadata = @metadata');
      params.metadata = JSON.stringify(data.metadata);
    }

    if (updates.length === 0) {
      return existing; // No changes
    }

    updates.push('updated_at = @updated_at');
    params.updated_at = Date.now();

    // Use transaction for atomic update with validation
    const transaction = this.db.transaction(() => {
      // Verify template exists if template is being changed
      if (data.template_id && data.template_id !== existing.template_id) {
        const template = this.db.prepare('SELECT id FROM templates WHERE id = ? AND is_active = 1').get(data.template_id);
        if (!template) {
          throw new CVInstanceError('Template not found or inactive', 'INVALID_TEMPLATE');
        }
      }

      const stmt = this.db.prepare(`
        UPDATE cv_instances
        SET ${updates.join(', ')}
        WHERE id = @id
      `);

      const result = stmt.run(params);
      if (result.changes === 0) {
        throw new CVInstanceError('CV instance not found', 'NOT_FOUND');
      }
    });

    try {
      transaction();
      return this.findById(id)!;
    } catch (error) {
      if (error instanceof CVInstanceError) {
        throw error;
      }
      throw new CVInstanceError(`Failed to update CV instance: ${error}`, 'DATABASE_ERROR');
    }
  }

  /**
   * Delete CV instance (soft delete - mark as deleted)
   */
  async delete(id: string): Promise<void> {
    const existing = this.findById(id);
    if (!existing) {
      throw new CVInstanceError('CV instance not found', 'NOT_FOUND');
    }

    // Check for dependencies (exports, assets)
    const hasExports = this.db.prepare('SELECT COUNT(*) as count FROM exports WHERE cv_id = ?').get(id) as { count: number };
    const hasAssets = this.db.prepare('SELECT COUNT(*) as count FROM assets WHERE cv_id = ?').get(id) as { count: number };

    if (hasExports.count > 0 || hasAssets.count > 0) {
      throw new CVInstanceError('Cannot delete CV with existing exports or assets', 'HAS_DEPENDENCIES');
    }

    try {
      const stmt = this.db.prepare(`
        UPDATE cv_instances 
        SET status = 'deleted', updated_at = ?
        WHERE id = ?
      `);

      const result = stmt.run(Date.now(), id);
      if (result.changes === 0) {
        throw new CVInstanceError('CV instance not found', 'NOT_FOUND');
      }
    } catch (error) {
      if (error instanceof CVInstanceError) {
        throw error;
      }
      throw new CVInstanceError(`Failed to delete CV instance: ${error}`, 'DATABASE_ERROR');
    }
  }

  /**
   * Duplicate CV instance
   */
  async duplicate(id: string, newName: string): Promise<CVInstance> {
    const original = this.findById(id);
    if (!original) {
      throw new CVInstanceError('Original CV instance not found', 'NOT_FOUND');
    }

    // Create duplicate with new name, carrying over config and photo
    const duplicateData: CreateCVInstanceData = {
      name: newName.trim(),
      content: original.content,
      parsed_content: original.parsed_content,
      template_id: original.template_id,
      photo_asset_id: original.photo_asset_id || undefined,
      config: original.config,
      settings: original.settings,
      metadata: {
        ...original.metadata,
        duplicated_from: original.id,
        duplicated_at: new Date().toISOString()
      }
    };

    return this.create(duplicateData);
  }

  /**
   * Map database row to CVInstance object
   */
  private mapRowToCVInstance(row: any): CVInstance {
    return {
      id: row.id,
      name: row.name,
      content: row.content,
      parsed_content: row.parsed_content ? JSON.parse(row.parsed_content) : undefined,
      template_id: row.template_id,
      photo_asset_id: row.photo_asset_id || undefined,
      config: row.config ? JSON.parse(row.config) : undefined,
      settings: row.settings ? JSON.parse(row.settings) : {},
      status: row.status,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  /**
   * Validate create data
   */
  private validateCreateData(data: CreateCVInstanceData): void {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new CVInstanceError('Name is required and must be a non-empty string', 'VALIDATION_ERROR');
    }

    if (data.name.trim().length > 100) {
      throw new CVInstanceError('Name must be 100 characters or less', 'VALIDATION_ERROR');
    }

    if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
      throw new CVInstanceError('Content is required and must be a non-empty string', 'VALIDATION_ERROR');
    }

    if (!data.template_id || typeof data.template_id !== 'string') {
      throw new CVInstanceError('Template ID is required and must be a string', 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate update data
   */
  private validateUpdateData(data: UpdateCVInstanceData): void {
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        throw new CVInstanceError('Name must be a non-empty string', 'VALIDATION_ERROR');
      }
      if (data.name.trim().length > 100) {
        throw new CVInstanceError('Name must be 100 characters or less', 'VALIDATION_ERROR');
      }
    }

    if (data.content !== undefined) {
      if (typeof data.content !== 'string' || data.content.trim().length === 0) {
        throw new CVInstanceError('Content must be a non-empty string', 'VALIDATION_ERROR');
      }
    }

    if (data.template_id !== undefined) {
      if (typeof data.template_id !== 'string') {
        throw new CVInstanceError('Template ID must be a string', 'VALIDATION_ERROR');
      }
    }

    if (data.status !== undefined) {
      if (!['active', 'archived'].includes(data.status)) {
        throw new CVInstanceError('Status must be either "active" or "archived"', 'VALIDATION_ERROR');
      }
    }
  }
}

/**
 * Custom error class for CV instance operations
 */
export class CVInstanceError extends Error {
  constructor(message: string, public code: string, public cause?: Error) {
    super(message);
    this.name = 'CVInstanceError';
  }
}

/**
 * Helper function to create CVInstanceModel with database connection
 */
export function createCVInstanceModel(db: Database.Database): CVInstanceModel {
  return new CVInstanceModel(db);
}