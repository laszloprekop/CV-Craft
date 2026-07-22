/**
 * Shared SQL typing helpers for the model layer.
 *
 * Rows come back from better-sqlite3 untyped, so each model declares the shape
 * of its own table and maps it into the domain type. Columns are stored the way
 * SQLite holds them: JSON blobs are strings, booleans are 0/1, timestamps are
 * epoch milliseconds.
 */

/** Values better-sqlite3 accepts as a bound statement parameter. */
export type SqlParam = string | number | bigint | Buffer | null

/** Free-form JSON object parsed out of a TEXT column. */
export type JsonRecord = Record<string, unknown>
