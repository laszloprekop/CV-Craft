/**
 * Database Connection and Setup
 * 
 * Handles SQLite database connection, initialization, and migrations
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database connection and schema
   */
  async initialize(dbPath?: string): Promise<Database.Database> {
    if (this.db) {
      return this.db;
    }

    const finalDbPath = dbPath || process.env.DATABASE_PATH || 'cv-craft.db';
    
    // Create database connection
    this.db = new Database(finalDbPath);
    
    // Enable WAL mode for better concurrent performance
    this.db.pragma('journal_mode = WAL');
    
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Initialize schema
    await this.initializeSchema();
    
    // Load initial data
    await this.loadInitialData();
    
    console.log(`Database initialized: ${finalDbPath}`);
    return this.db;
  }

  /**
   * Get database connection
   */
  getConnection(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Initialize database schema from SQL file
   */
  private async initializeSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema in a transaction
    const transaction = this.db.transaction(() => {
      // Split by statements and execute each one
      const statements = schema.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            this.db!.exec(statement);
          } catch (error) {
            console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }
    });

    transaction();

    // Migration: drop unique name constraint on cv_instances (allow duplicate names)
    try {
      this.db!.exec('DROP INDEX IF EXISTS idx_cv_name_active');
    } catch {
      // Index may not exist, ignore
    }

    console.log('Database schema initialized successfully');
  }

  /**
   * Load initial data (templates, etc.)
   */
  private async loadInitialData(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    // Check if default template already exists
    const existingTemplate = this.db.prepare('SELECT id FROM templates WHERE id = ?').get('default-modern');
    if (existingTemplate) {
      console.log('Initial data already loaded');
      return;
    }

    // Insert default template using prepared statement (ignore if already exists)
    const insertTemplate = this.db.prepare(`
      INSERT OR IGNORE INTO templates (
        id, name, description, css, config_schema, default_config, default_settings, is_active, created_at, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Import default config
    const { DEFAULT_TEMPLATE_CONFIG } = require('../../../shared/types/defaultTemplateConfig');

    const defaultTemplate = {
      id: 'default-modern',
      name: 'Modern Professional',
      description: 'A clean, modern template with professional styling suitable for most industries.',
      css: '.cv-container { font-family: var(--font-family, "Inter", system-ui, sans-serif); font-size: var(--body-font-size, 14px); line-height: 1.6; color: var(--text-color, #1f2937); background: var(--surface-color, #ffffff); max-width: 210mm; margin: 0 auto; padding: var(--page-margin-top, 2cm) var(--page-margin-right, 2cm) var(--page-margin-bottom, 2cm) var(--page-margin-left, 2cm); } .cv-header { text-align: center; margin-bottom: 2rem; border-bottom: 2px solid var(--primary-color, #2563eb); padding-bottom: 1.5rem; } .cv-header h1 { font-size: var(--title-font-size, 24px); color: var(--primary-color, #2563eb); margin: 0 0 0.5rem 0; font-weight: 700; } .cv-section { margin-bottom: 2rem; } .cv-section h2 { font-size: var(--section-font-size, 18px); color: var(--primary-color, #2563eb); margin: 0 0 1rem 0; padding-bottom: 0.5rem; border-bottom: var(--separator-style, solid) 1px var(--accent-color, #e5e7eb); }',
      config_schema: JSON.stringify({
        type: "object",
        properties: {
          primaryColor: { type: "string", default: "#2563eb" },
          accentColor: { type: "string", default: "#059669" },
          backgroundColor: { type: "string", default: "#ffffff" },
          surfaceColor: { type: "string", default: "#ffffff" },
          fontFamily: { type: "string", enum: ["Inter", "Roboto", "Georgia", "Times New Roman", "Arial"], default: "Inter" },
          titleFontSize: { type: "number", default: 24 },
          bodyFontSize: { type: "number", default: 14 }
        }
      }),
      default_config: JSON.stringify(DEFAULT_TEMPLATE_CONFIG),
      default_settings: JSON.stringify({
        primaryColor: "#2563eb",
        accentColor: "#059669",
        backgroundColor: "#ffffff",
        surfaceColor: "#ffffff",
        fontFamily: "Inter",
        titleFontSize: 24,
        bodyFontSize: 14,
        useTagDesign: true,
        useUnderlinedLinks: false,
        separatorStyle: "solid",
        showPageNumbers: true,
        showDate: true,
        emojiStyle: "none",
        pageMargins: {
          top: "2cm",
          bottom: "2cm",
          left: "2cm",
          right: "2cm"
        }
      }),
      is_active: 1,
      created_at: Date.now(),
      version: '1.0.0'
    };

    // Execute in transaction
    const transaction = this.db.transaction(() => {
      insertTemplate.run(
        defaultTemplate.id,
        defaultTemplate.name,
        defaultTemplate.description,
        defaultTemplate.css,
        defaultTemplate.config_schema,
        defaultTemplate.default_config,
        defaultTemplate.default_settings,
        defaultTemplate.is_active,
        defaultTemplate.created_at,
        defaultTemplate.version
      );
    });

    transaction();
    console.log('Initial data loaded successfully');
  }

  /**
   * Run database health check
   */
  healthCheck(): { healthy: boolean; error?: string } {
    try {
      if (!this.db) {
        return { healthy: false, error: 'Database not initialized' };
      }

      // Test basic query
      const result = this.db.prepare('SELECT 1 as test').get() as { test: number } | undefined;
      if (!result || result.test !== 1) {
        return { healthy: false, error: 'Database query failed' };
      }

      // Check schema integrity
      const integrityResult = this.db.pragma('integrity_check') as unknown;
      const integrityArray = Array.isArray(integrityResult) ? integrityResult : [integrityResult];
      if (!integrityArray || integrityArray[0] !== 'ok') {
        return { healthy: false, error: 'Database integrity check failed' };
      }

      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get database statistics
   */
  getStats(): Record<string, number | string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stats: Record<string, number | string> = {};

    // Table counts - whitelist table names to prevent SQL injection
    const ALLOWED_TABLES = ['cv_instances', 'templates', 'assets', 'exports', 'saved_themes'] as const;
    for (const table of ALLOWED_TABLES) {
      const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
      stats[`${table}_count`] = result.count;
    }

    // Database size
    const pageCount = this.db.pragma('page_count', { simple: true }) as number;
    const pageSize = this.db.pragma('page_size', { simple: true }) as number;
    stats.size_bytes = pageCount * pageSize;
    stats.size_mb = Math.round((stats.size_bytes / (1024 * 1024)) * 100) / 100;

    // WAL mode info
    stats.journal_mode = this.db.pragma('journal_mode', { simple: true }) as string;
    stats.foreign_keys = this.db.pragma('foreign_keys', { simple: true }) as number;

    return stats;
  }
}

/**
 * Convenience function to get database connection
 */
export function getDatabase(): Database.Database {
  return DatabaseManager.getInstance().getConnection();
}

/**
 * Initialize database (convenience function)
 */
export async function initializeDatabase(dbPath?: string): Promise<Database.Database> {
  return DatabaseManager.getInstance().initialize(dbPath);
}

/**
 * Close database connection (convenience function)
 */
export function closeDatabase(): void {
  DatabaseManager.getInstance().close();
}