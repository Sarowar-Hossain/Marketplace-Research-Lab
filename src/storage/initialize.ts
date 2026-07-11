import type { Database } from 'better-sqlite3';
import type { Logger } from 'pino';
import { openDatabase } from './database';
import { createSchema } from './schema';

// Brings the database to a ready-to-use state by composing the existing
// connection and schema steps: open the connection (Doc 007 §8 foreign keys,
// Doc 012 §6 logging) and ensure the documented tables exist. The schema
// statements are idempotent, so re-initializing an existing database preserves
// its data. Path and logger are injected; no config or filesystem preparation.
export function initializeDatabase(databaseFilePath: string, logger: Logger): Database {
  const db = openDatabase(databaseFilePath, logger);
  createSchema(db);
  return db;
}
