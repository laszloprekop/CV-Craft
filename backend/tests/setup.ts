// Vitest setup for backend tests
import { beforeAll, afterAll, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Global test database
let testDb: Database.Database;

beforeAll(() => {
  // Create test database in memory
  testDb = new Database(':memory:');
  
  // Load schema
  const schemaPath = path.join(__dirname, '../src/database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  testDb.exec(schema);
  
  // Make test database available globally
  (global as any).testDb = testDb;
});

afterAll(() => {
  if (testDb) {
    testDb.close();
  }
});

beforeEach(() => {
  // Clean up test data before each test (except templates)
  testDb.exec(`
    DELETE FROM exports;
    DELETE FROM assets;
    DELETE FROM cv_instances;
  `);
});