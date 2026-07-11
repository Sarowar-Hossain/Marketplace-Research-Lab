import Database, { type Database as DatabaseConnection } from 'better-sqlite3';
import type { Logger } from 'pino';

// Opens (creating it if absent) the SQLite database file at the provided path.
// The path and logger are supplied by the caller so the Storage module never
// reads configuration or creates loggers itself. Foreign key enforcement is
// enabled on every connection because the schema relies on referential
// integrity (Doc 007 §8). The open outcome is logged per Doc 012 §6.
export function openDatabase(databaseFilePath: string, logger: Logger): DatabaseConnection {
  try {
    const db = new Database(databaseFilePath);
    db.pragma('foreign_keys = ON');
    logger.info({ operation: 'open' }, 'Database opened');
    return db;
  } catch (error) {
    logger.error(
      { operation: 'open', error: error instanceof Error ? error.message : String(error) },
      'Database error',
    );
    throw error;
  }
}

export function closeDatabase(db: DatabaseConnection): void {
  db.close();
}
