import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { initializeDatabase } from '../src/storage/initialize';
import { openDatabase, closeDatabase } from '../src/storage/database';
import { createSchema } from '../src/storage/schema';
import {
  saveResearchData,
  saveAiAnalysis,
  finalizeResearchSession,
  saveReportMetadata,
  type ProductInput,
} from '../src/storage/persistence';
import { loadResearchData } from '../src/storage/research-data';
import { testLogger, tempDir } from './util';

const logger = testLogger('storage');
const dir = tempDir();
after(() => rmSync(dir, { recursive: true, force: true }));

const session = {
  id: 'sess-1',
  keyword: 'dog mom',
  marketplace: 'Redbubble',
  status: 'completed',
  aiProvider: 'prov',
  aiModel: 'model',
  startedAt: '2026-07-12T10:00:00Z',
  completedAt: '2026-07-12T10:05:00Z',
};

const products: ProductInput[] = [
  { title: 'Cool Mug', url: 'https://rb/i/mug/1', artistName: 'A', description: 'd', productType: 'mug',
    price: 12.5, currency: 'USD', imageUrls: ['https://img/1', 'https://img/2'], tags: ['a', 'b'] },
  { title: 'Sticker', url: 'https://rb/i/st/2', artistName: null, description: null, productType: null,
    price: null, currency: null, imageUrls: [], tags: ['c'] },
];

// Doc 007 / Doc 008 §12, §17 — schema, persistence, atomicity.
test('initialization creates all 7 documented tables', () => {
  const db = initializeDatabase(join(dir, 'init.db'), logger);
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((r) => (r as { name: string }).name);
  assert.deepEqual(tables, [
    'ai_analysis', 'product_images', 'product_statistics', 'product_tags', 'products', 'reports', 'research_sessions',
  ]);
  closeDatabase(db);
});

test('saveResearchData persists session, products, images, tags atomically', () => {
  const db = initializeDatabase(join(dir, 'save.db'), logger);
  const result = saveResearchData(db, session, products, logger);
  assert.deepEqual(result, { sessionId: 'sess-1', productCount: 2 });
  const count = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
  assert.equal(count('SELECT COUNT(*) c FROM research_sessions'), 1);
  assert.equal(count("SELECT COUNT(*) c FROM products WHERE session_id='sess-1'"), 2);
  assert.equal(count('SELECT COUNT(*) c FROM product_images'), 2);
  assert.equal(count('SELECT COUNT(*) c FROM product_tags'), 3);
  assert.equal(count('SELECT COUNT(*) c FROM product_statistics'), 0);
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
  closeDatabase(db);
});

test('a mid-transaction failure rolls back everything (no partial writes)', () => {
  const db = initializeDatabase(join(dir, 'rollback.db'), logger);
  const bad = [products[0], { ...products[1], title: null as unknown as string }];
  assert.throws(() => saveResearchData(db, { ...session, id: 'sess-2' }, bad, logger));
  const count = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
  assert.equal(count('SELECT COUNT(*) c FROM research_sessions'), 0);
  assert.equal(count('SELECT COUNT(*) c FROM products'), 0);
  assert.equal(count('SELECT COUNT(*) c FROM product_images'), 0);
  closeDatabase(db);
});

test('saveAiAnalysis links the analysis to its session; orphans are rejected', () => {
  const db = initializeDatabase(join(dir, 'analysis.db'), logger);
  saveResearchData(db, session, products, logger);
  saveAiAnalysis(db, { sessionId: 'sess-1', provider: 'openai', model: 'm', prompt: 'P', response: 'R' }, logger);
  const row = db.prepare('SELECT * FROM ai_analysis').get() as Record<string, unknown>;
  assert.equal(row.session_id, 'sess-1');
  assert.equal(row.response, 'R');
  assert.ok(row.generated_at);
  assert.throws(() =>
    saveAiAnalysis(db, { sessionId: 'nope', provider: 'p', model: 'm', prompt: 'P', response: 'R' }, logger),
  );
  closeDatabase(db);
});

test('finalizeResearchSession updates status and completedAt of the stored row', () => {
  const db = initializeDatabase(join(dir, 'finalize.db'), logger);
  saveResearchData(db, { ...session, status: 'analyzing', completedAt: null }, products, logger);
  finalizeResearchSession(db, 'sess-1', 'completed', '2026-07-12T11:00:00Z', logger);
  const row = db.prepare("SELECT status, completed_at FROM research_sessions WHERE id='sess-1'").get() as {
    status: string; completed_at: string | null;
  };
  assert.equal(row.status, 'completed');
  assert.equal(row.completed_at, '2026-07-12T11:00:00Z');
  closeDatabase(db);
});

test('loadResearchData returns the full session tree in collection order', () => {
  const db = initializeDatabase(join(dir, 'load.db'), logger);
  saveResearchData(db, session, products, logger);
  saveAiAnalysis(db, { sessionId: 'sess-1', provider: 'openai', model: 'm', prompt: 'P', response: 'R' }, logger);

  const data = loadResearchData(db, 'sess-1');
  assert.ok(data.session);
  assert.equal(data.session?.keyword, 'dog mom');
  assert.equal(data.session?.aiProvider, 'prov');
  assert.equal(data.products.length, 2);
  assert.equal(data.products[0].title, 'Cool Mug', 'collection order preserved');
  assert.equal(data.products[0].images.length, 2);
  assert.deepEqual(data.products[0].tags, ['a', 'b']);
  assert.equal(data.products[0].statistics, null);
  assert.equal(data.analysis?.response, 'R');

  const missing = loadResearchData(db, 'nope');
  assert.equal(missing.session, null);
  assert.equal(missing.products.length, 0);
  assert.equal(missing.analysis, null);
  closeDatabase(db);
});

test('saveReportMetadata records the report and links the session atomically', () => {
  const db = initializeDatabase(join(dir, 'report.db'), logger);
  saveResearchData(db, session, products, logger);
  const result = saveReportMetadata(db, { sessionId: 'sess-1', reportPath: '/reports/r.html' }, logger);
  const report = db.prepare('SELECT * FROM reports').get() as Record<string, unknown>;
  assert.equal(report.id, result.reportId);
  assert.equal(report.session_id, 'sess-1');
  assert.equal(report.report_path, '/reports/r.html');
  assert.ok(report.generated_at);
  const sess = db.prepare("SELECT report_id FROM research_sessions WHERE id='sess-1'").get() as { report_id: string };
  assert.equal(sess.report_id, result.reportId);
  // Orphan session id is rejected by the FK, and the transaction leaves nothing.
  assert.throws(() => saveReportMetadata(db, { sessionId: 'nope', reportPath: '/x.html' }, logger));
  assert.equal((db.prepare('SELECT COUNT(*) c FROM reports').get() as { c: number }).c, 1);
  closeDatabase(db);
});

test('guarded ALTER adds new columns to pre-existing databases', () => {
  const db = openDatabase(join(dir, 'old-schema.db'), logger);
  // Simulate a database created before the research-improvements columns.
  db.exec(`CREATE TABLE research_sessions (
    id TEXT PRIMARY KEY NOT NULL, keyword TEXT NOT NULL, marketplace TEXT NOT NULL,
    status TEXT NOT NULL, ai_provider TEXT NOT NULL, ai_model TEXT NOT NULL,
    started_at DATETIME NOT NULL, completed_at DATETIME, report_id TEXT)`);
  db.exec(`CREATE TABLE product_statistics (
    product_id TEXT PRIMARY KEY NOT NULL, favorites INTEGER, available_products INTEGER)`);

  createSchema(db);
  createSchema(db); // idempotent second run

  const sessionCols = (db.prepare('PRAGMA table_info(research_sessions)').all() as { name: string }[]).map((c) => c.name);
  const statsCols = (db.prepare('PRAGMA table_info(product_statistics)').all() as { name: string }[]).map((c) => c.name);
  assert.ok(sessionCols.includes('product_type') && sessionCols.includes('sort_order'));
  assert.ok(statsCols.includes('rank') && statsCols.includes('artist_design_count'));
  closeDatabase(db);
});

test('rank and competition signals are persisted; session stores search scope', () => {
  const db = initializeDatabase(join(dir, 'signals.db'), logger);
  const withSignals = [
    { ...products[0], rank: 1, availableProducts: 73, artistDesignCount: 5691 },
    { ...products[1], rank: 2 },
  ];
  saveResearchData(db, { ...session, productType: 'T-Shirts', sortOrder: 'top selling' }, withSignals, logger);

  const sess = db.prepare("SELECT product_type, sort_order FROM research_sessions WHERE id='sess-1'").get() as Record<string, unknown>;
  assert.equal(sess.product_type, 'T-Shirts');
  assert.equal(sess.sort_order, 'top selling');

  const stats = db.prepare('SELECT * FROM product_statistics ORDER BY rank').all() as Record<string, unknown>[];
  assert.equal(stats.length, 2);
  assert.equal(stats[0].rank, 1);
  assert.equal(stats[0].available_products, 73);
  assert.equal(stats[0].artist_design_count, 5691);
  assert.equal(stats[1].rank, 2);
  assert.equal(stats[1].available_products, null);

  const loaded = loadResearchData(db, 'sess-1');
  assert.equal(loaded.session?.productType, 'T-Shirts');
  assert.equal(loaded.products[0].statistics?.rank, 1);
  assert.equal(loaded.products[0].statistics?.artistDesignCount, 5691);
  closeDatabase(db);
});

test('deleting a session cascades to all children', () => {
  const db = initializeDatabase(join(dir, 'cascade.db'), logger);
  saveResearchData(db, session, products, logger);
  db.prepare("DELETE FROM research_sessions WHERE id='sess-1'").run();
  const count = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
  assert.equal(count('SELECT COUNT(*) c FROM products'), 0);
  assert.equal(count('SELECT COUNT(*) c FROM product_images'), 0);
  assert.equal(count('SELECT COUNT(*) c FROM product_tags'), 0);
  closeDatabase(db);
});
