/**
 * Template Model
 * 
 * Data access layer for CV templates with database operations
 */

import Database from 'better-sqlite3';
import type { Template, TemplateConfig, TemplateConfigSchema, TemplateSettings } from '../../../shared/types';

export interface CreateTemplateData {
  id: string;
  name: string;
  description?: string;
  css: string;
  config_schema: TemplateConfigSchema;
  default_config: TemplateConfig;
  default_settings: TemplateSettings;
  preview_image?: string;
  version: string;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  css?: string;
  config_schema?: TemplateConfigSchema;
  default_config?: TemplateConfig;
  default_settings?: TemplateSettings;
  preview_image?: string;
  is_active?: boolean;
  version?: string;
}

export interface ListTemplatesOptions {
  active_only?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'name' | 'version';
  orderDirection?: 'ASC' | 'DESC';
}

export class TemplateModel {
  constructor(private db: Database.Database) {}

  /**
   * Create a new template
   */
  create(data: CreateTemplateData): Template {
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT INTO templates (
        id, name, description, css, config_schema, default_config, default_settings,
        preview_image, is_active, created_at, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    const result = stmt.run(
      data.id,
      data.name,
      data.description || null,
      data.css,
      JSON.stringify(data.config_schema),
      JSON.stringify(data.default_config),
      JSON.stringify(data.default_settings),
      data.preview_image || null,
      now,
      data.version
    );

    if (result.changes === 0) {
      throw new Error('Failed to create template');
    }

    return this.findById(data.id)!;
  }

  /**
   * Find template by ID
   */
  findById(id: string): Template | null {
    const stmt = this.db.prepare('SELECT * FROM templates WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.mapRowToTemplate(row);
  }

  /**
   * List templates with filtering and pagination
   */
  list(options: ListTemplatesOptions = {}): { data: Template[]; total: number } {
    const {
      active_only = true,
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'DESC'
    } = options;

    // Build query conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (active_only) {
      conditions.push('is_active = 1');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM templates ${whereClause}`);
    const countResult = countStmt.get(...params) as { count: number };
    const total = countResult.count;

    // Data query
    const dataStmt = this.db.prepare(`
      SELECT * FROM templates 
      ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `);

    const rows = dataStmt.all(...params, limit, offset) as any[];
    const data = rows.map(row => this.mapRowToTemplate(row));

    return { data, total };
  }

  /**
   * Update template
   */
  update(id: string, data: UpdateTemplateData): Template {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }

    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(data.description);
    }

    if (data.css !== undefined) {
      updateFields.push('css = ?');
      updateValues.push(data.css);
    }

    if (data.config_schema !== undefined) {
      updateFields.push('config_schema = ?');
      updateValues.push(JSON.stringify(data.config_schema));
    }

    if (data.default_config !== undefined) {
      updateFields.push('default_config = ?');
      updateValues.push(JSON.stringify(data.default_config));
    }

    if (data.default_settings !== undefined) {
      updateFields.push('default_settings = ?');
      updateValues.push(JSON.stringify(data.default_settings));
    }

    if (data.preview_image !== undefined) {
      updateFields.push('preview_image = ?');
      updateValues.push(data.preview_image);
    }

    if (data.is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(data.is_active ? 1 : 0);
    }

    if (data.version !== undefined) {
      updateFields.push('version = ?');
      updateValues.push(data.version);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    const stmt = this.db.prepare(`
      UPDATE templates 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...updateValues, id);

    if (result.changes === 0) {
      throw new Error('Template not found or no changes made');
    }

    return this.findById(id)!;
  }

  /**
   * Delete template (hard delete)
   */
  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM templates WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new Error('Template not found');
    }
  }

  /**
   * Deactivate template (soft delete)
   */
  deactivate(id: string): Template {
    return this.update(id, { is_active: false });
  }

  /**
   * Activate template
   */
  activate(id: string): Template {
    return this.update(id, { is_active: true });
  }

  /**
   * Find templates by name (partial match)
   */
  findByName(name: string, activeOnly: boolean = true): Template[] {
    const whereClause = activeOnly ? 'WHERE name LIKE ? AND is_active = 1' : 'WHERE name LIKE ?';
    const stmt = this.db.prepare(`SELECT * FROM templates ${whereClause} ORDER BY name`);
    const rows = stmt.all(`%${name}%`) as any[];
    return rows.map(row => this.mapRowToTemplate(row));
  }

  /**
   * Check if template is in use by any CVs
   */
  isInUse(id: string): boolean {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM cv_instances WHERE template_id = ?');
    const result = stmt.get(id) as { count: number };
    return result.count > 0;
  }

  /**
   * Map database row to Template object
   */
  private mapRowToTemplate(row: any): Template {
    // Import DEFAULT_TEMPLATE_CONFIG for fallback
    const { DEFAULT_TEMPLATE_CONFIG } = require('../../../shared/types/defaultTemplateConfig');

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      css: row.css,
      config_schema: JSON.parse(row.config_schema),
      default_config: row.default_config ? JSON.parse(row.default_config) : DEFAULT_TEMPLATE_CONFIG,
      default_settings: JSON.parse(row.default_settings),
      preview_image: row.preview_image,
      is_active: Boolean(row.is_active),
      created_at: new Date(row.created_at).toISOString(),
      version: row.version
    };
  }
}

/**
 * Factory function to create Template model
 */
export function createTemplateModel(db: Database.Database): TemplateModel {
  return new TemplateModel(db);
}