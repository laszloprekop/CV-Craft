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

    // Migration: add photo_asset_id column if missing (for existing databases)
    try {
      const columns = this.db!.pragma('table_info(cv_instances)') as { name: string }[];
      const hasPhotoColumn = columns.some(c => c.name === 'photo_asset_id');
      if (!hasPhotoColumn) {
        this.db!.exec('ALTER TABLE cv_instances ADD COLUMN photo_asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL');
        this.db!.exec('CREATE INDEX IF NOT EXISTS idx_cv_photo_asset ON cv_instances(photo_asset_id)');
        console.log('Migration: added photo_asset_id column');
      }
    } catch {
      // Column may already exist, ignore
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
      // Template exists — still check if sample CV needs seeding
      this.seedSampleCV();
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

    const now = Date.now();

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
        now,
        defaultTemplate.version
      );

    });

    transaction();

    // Seed sample CV
    this.seedSampleCV();

    console.log('Initial data loaded successfully');
  }

  /**
   * Seed a sample CV if it doesn't already exist
   */
  private seedSampleCV(): void {
    if (!this.db) return;

    const SAMPLE_CV_ID = '00000000-0000-4000-a000-000000000001';
    const existing = this.db.prepare('SELECT id FROM cv_instances WHERE id = ?').get(SAMPLE_CV_ID);
    if (existing) return;

    // Get default config from template
    const template = this.db.prepare('SELECT default_config, default_settings FROM templates WHERE id = ?').get('default-modern') as any;
    if (!template) return;

    const sampleCVContent = `---
name: Alex Morgan
title: Senior Full-Stack Developer
email: alex.morgan@example.com
phone: +1-555-0199
location: San Francisco, CA
website: alexmorgan.dev
linkedin: linkedin.com/in/alexmorgan
github: github.com/alexmorgan
---

## Professional Summary

Versatile full-stack developer with 8+ years of experience building **scalable web applications** and leading cross-functional teams. Specialized in *modern JavaScript frameworks*, cloud architecture, and developer experience tooling. Proven track record of delivering high-impact solutions that improve performance, reliability, and user engagement.

## Experience

### Senior Full-Stack Developer | Acme Technologies
*Jan 2021 — Present*
San Francisco, CA

Architected and delivered the company's next-generation SaaS platform serving 50,000+ active users.

- Led migration from monolithic architecture to **microservices**, reducing deployment time by 70%
- Designed real-time collaboration features using WebSockets and \`Redis Pub/Sub\`
- Mentored a team of 6 junior developers through code reviews and pair programming
- **Key Achievement:** Improved application load time from 4.2s to 1.1s through code splitting and caching strategies
  - Implemented lazy loading for all route-level components
  - Added service worker caching for static assets

### Front-End Developer | Digital Solutions Inc.
*Mar 2018 — Dec 2020*
New York, NY

Built customer-facing dashboards and internal tools for a fintech startup.

- Developed responsive [React](https://react.dev) dashboard processing 100K+ daily transactions
- Created a reusable component library adopted across 3 product teams
- Integrated third-party APIs including Stripe, Plaid, and Twilio
- Reduced frontend bundle size by 45% through tree-shaking and dynamic imports

### Junior Web Developer | CreativeWeb Agency
*Jun 2016 — Feb 2018*
Austin, TX

- Built 30+ client websites using modern HTML5, CSS3, and JavaScript
- Developed custom *WordPress themes* and plugins for e-commerce clients
- Collaborated with UX designers to translate Figma mockups into pixel-perfect implementations

## Education

### B.Sc. Computer Science | University of California, Berkeley
*2012 — 2016*
Berkeley, CA

- GPA: 3.7/4.0, Dean's List (6 semesters)
- Senior thesis: *"Optimizing Real-Time Data Pipelines for Web Applications"*

### Professional Development
*2020 — 2024*

- **AWS Solutions Architect Associate** — Amazon Web Services
- **Advanced React Patterns** — Frontend Masters
- **System Design for Interviews** — Educative.io

## Technical Skills

**Languages:** TypeScript, JavaScript, Python, Go, SQL, HTML5, CSS3
**Frontend:** React, Next.js, Vue.js, Tailwind CSS, Storybook
**Backend:** Node.js, Express, Django, GraphQL, REST APIs
**Cloud & DevOps:** AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, CI/CD
**Databases:** PostgreSQL, MongoDB, Redis, Elasticsearch
**Tools:** Git, VS Code, Figma, Jira, Datadog

## Projects

### Open Source CLI Tool
A developer productivity tool built with **Node.js** and \`TypeScript\` that automates common project scaffolding tasks. Featured on [Hacker News](https://news.ycombinator.com) with 500+ GitHub stars.

- Supports 12 project templates including React, Vue, and Express
- Published as an \`npm\` package with 10K+ monthly downloads

### Real-Time Analytics Dashboard
End-to-end analytics platform for monitoring application performance metrics.

- Built with React, D3.js, and WebSocket for live data streaming
- Handles 1M+ events per hour with sub-second visualization latency
- Deployed on AWS using *ECS Fargate* with auto-scaling

## Certifications & Awards

- **AWS Solutions Architect Associate** — Amazon Web Services, 2023
- **Best Technical Innovation Award** — Acme Technologies Hackathon, 2022
- **Google Developer Expert** — Web Technologies, 2021

## Languages

**English:** Native
**Spanish:** Professional proficiency
**Mandarin:** Conversational

## Interests

Open source development, tech mentorship, competitive programming, hiking, photography
`;

    const now = Date.now();
    this.db.prepare(`
      INSERT OR IGNORE INTO cv_instances (
        id, name, content, template_id, config, settings, status, created_at, updated_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      SAMPLE_CV_ID,
      'Sample CV',
      sampleCVContent,
      'default-modern',
      template.default_config,
      template.default_settings,
      'active',
      now,
      now,
      JSON.stringify({ sections_count: 9, word_count: 450 })
    );

    console.log('Sample CV seeded successfully');
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