import type { Database } from 'better-sqlite3';

// SQLite schema for Marketplace Research Lab Version 0.1, defined exactly as
// specified in Document 007 (Database Design): 7 tables and 10 indexes.
// Foreign key columns are NOT NULL so every child record belongs to a valid
// parent (Doc 007 §14); relationships cascade on delete (Doc 007 §11).
// Foreign key enforcement itself is enabled on the connection (Doc 007 §8).
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS research_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  keyword TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  status TEXT NOT NULL,
  ai_provider TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  report_id TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  product_url TEXT NOT NULL,
  artist_name TEXT,
  description TEXT,
  product_type TEXT,
  price REAL,
  currency TEXT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (session_id) REFERENCES research_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  local_path TEXT,
  display_order INTEGER,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_tags (
  id TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_statistics (
  product_id TEXT PRIMARY KEY NOT NULL,
  favorites INTEGER,
  available_products INTEGER,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_analysis (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  generated_at DATETIME NOT NULL,
  FOREIGN KEY (session_id) REFERENCES research_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  report_path TEXT NOT NULL,
  generated_at DATETIME NOT NULL,
  FOREIGN KEY (session_id) REFERENCES research_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_research_sessions_keyword ON research_sessions(keyword);
CREATE INDEX IF NOT EXISTS idx_research_sessions_started_at ON research_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_research_sessions_status ON research_sessions(status);
CREATE INDEX IF NOT EXISTS idx_products_session_id ON products(session_id);
CREATE INDEX IF NOT EXISTS idx_products_product_url ON products(product_url);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_session_id ON ai_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_session_id ON reports(session_id);
`;

// Creates the documented tables and indexes on the provided connection. The
// statements are idempotent (IF NOT EXISTS) so applying the schema to an
// already-initialized database is safe.
export function createSchema(db: Database): void {
  db.exec(SCHEMA_SQL);
}
