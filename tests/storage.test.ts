import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { initializeDatabase } from '../src/storage/initialize';
import { closeDatabase } from '../src/storage/database';
import {
  saveResearchData,
  saveAiAnalysis,
  finalizeResearchSession,
  type ProductInput,
} from '../src/storage/persistence';
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
