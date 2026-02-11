/**
 * SavedTheme Model
 *
 * Data access layer for saved theme presets (named TemplateConfig snapshots)
 */

import Database from 'better-sqlite3';
import type { TemplateConfig } from '../../../shared/types';

export interface SavedThemeRow {
  id: string;
  name: string;
  config: string; // JSON
  template_id: string;
  created_at: number;
  updated_at: number;
}

export interface SavedThemeData {
  id: string;
  name: string;
  config: TemplateConfig;
  template_id: string;
  created_at: string;
  updated_at: string;
}

export class SavedThemeModel {
  constructor(private db: Database.Database) {}

  create(data: { id: string; name: string; config: TemplateConfig; template_id: string }): SavedThemeData {
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO saved_themes (id, name, config, template_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.id,
      data.name,
      JSON.stringify(data.config),
      data.template_id,
      now,
      now
    );

    if (result.changes === 0) {
      throw new Error('Failed to create saved theme');
    }

    return this.findById(data.id)!;
  }

  findById(id: string): SavedThemeData | null {
    const stmt = this.db.prepare('SELECT * FROM saved_themes WHERE id = ?');
    const row = stmt.get(id) as SavedThemeRow | undefined;
    if (!row) return null;
    return this.mapRow(row);
  }

  findByName(name: string): SavedThemeData | null {
    const stmt = this.db.prepare('SELECT * FROM saved_themes WHERE name = ?');
    const row = stmt.get(name) as SavedThemeRow | undefined;
    if (!row) return null;
    return this.mapRow(row);
  }

  list(): SavedThemeData[] {
    const stmt = this.db.prepare('SELECT * FROM saved_themes ORDER BY updated_at DESC');
    const rows = stmt.all() as SavedThemeRow[];
    return rows.map(row => this.mapRow(row));
  }

  update(id: string, data: { name?: string; config?: TemplateConfig }): SavedThemeData {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }

    if (data.config !== undefined) {
      fields.push('config = ?');
      values.push(JSON.stringify(data.config));
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = ?');
    values.push(Date.now());

    const stmt = this.db.prepare(`
      UPDATE saved_themes SET ${fields.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...values, id);

    if (result.changes === 0) {
      throw new Error('Saved theme not found');
    }

    return this.findById(id)!;
  }

  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM saved_themes WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new Error('Saved theme not found');
    }
  }

  private mapRow(row: SavedThemeRow): SavedThemeData {
    return {
      id: row.id,
      name: row.name,
      config: JSON.parse(row.config),
      template_id: row.template_id,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }
}

export function createSavedThemeModel(db: Database.Database): SavedThemeModel {
  return new SavedThemeModel(db);
}
