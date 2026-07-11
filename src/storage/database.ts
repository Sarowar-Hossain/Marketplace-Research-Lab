import Database, { type Database as DatabaseConnection } from 'better-sqlite3';

// Opens (creating it if absent) the SQLite database file at the provided path.
// The path is always supplied by the caller so the Storage module never reads
// configuration directly. Foreign key enforcement is enabled on every
// connection because the schema relies on referential integrity (Doc 007 §8).
export function openDatabase(databaseFilePath: string): DatabaseConnection {
  const db = new Database(databaseFilePath);
  db.pragma('foreign_keys = ON');
  return db;
}

export function closeDatabase(db: DatabaseConnection): void {
  db.close();
}
