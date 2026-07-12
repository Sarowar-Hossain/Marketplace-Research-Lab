import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { rmSync, existsSync, readFileSync } from 'node:fs';
import { chromium, type Browser, type LaunchOptions, type Route } from 'playwright';
import Database from 'better-sqlite3';
import { createResearchRunner } from '../src/research/bootstrap';
import { testLogger, tempDir } from './util';

// End-to-end research workflow (Doc 014 / Doc 016 "Verify complete research
// workflow" + Doc 013 §7): real engine → real Marketplace collection (fixture-
// routed Chromium) → real AI pipeline (fetch mocked at the HTTP layer) → real
// Storage persistence into a real SQLite file.
//
// chromium.launch is patched: tests always use bundled headless Chromium with
// request interception, regardless of the production headed-Chrome settings.
// globalThis.fetch is patched so the AI provider call never leaves the machine.

const SEARCH_PAGE = `<!doctype html><html><body>
<a href="https://www.redbubble.com/i/mug/Cool-by-FixtureArtist/111.abc">p1</a>
<a href="https://www.redbubble.com/i/sticker/Fun/222.def">p2</a>
<a href="https://www.redbubble.com/about">not-a-product</a>
</body></html>`;

const PRODUCT_PAGES: Record<string, string> = {
  'https://www.redbubble.com/i/mug/Cool-by-FixtureArtist/111.abc': `<!doctype html><html><head>
    <script type="application/ld+json">{"@type":"Product","name":" Cool Mug ","keywords":["a","a","b"],
    "image":["https://img/1"],"offers":{"price":"12.50","priceCurrency":"USD"}}</script></head><body>
    <p>View this design on +40 products</p><p>9876 designs</p></body></html>`,
  'https://www.redbubble.com/i/sticker/Fun/222.def': `<!doctype html><html><head>
    <meta property="og:title" content="&quot;Fun Sticker&quot; Sticker for Sale by TestArtist"></head><body>
    <div><span>All Product Tags</span><a href="https://www.redbubble.com/shop/fun">fun tag</a><a href="https://www.redbubble.com/shop/cute">cute tag</a></div>
    </body></html>`,
};

let browserMode: 'ok' | 'fail' = 'ok';
let aiMode: 'ok' | 'fail' = 'ok';
let browserLaunches = 0;
let lastSearchUrl: string | null = null;
const realLaunch = chromium.launch.bind(chromium);
const realFetch = globalThis.fetch;
const dir = tempDir('mrl-e2e-');
const logger = testLogger('research');

before(() => {
  (chromium as { launch: (options?: LaunchOptions) => Promise<Browser> }).launch = async () => {
    browserLaunches += 1;
    const browser = await realLaunch({ headless: true });
    const realNewPage = browser.newPage.bind(browser);
    (browser as { newPage: typeof browser.newPage }).newPage = async () => {
      const page = await realNewPage();
      await page.route('**/*', (route: Route) => {
        if (browserMode === 'fail') return route.abort();
        const url = route.request().url().split('?')[0].split('#')[0];
        if (url.startsWith('https://www.redbubble.com/shop')) {
          lastSearchUrl = route.request().url();
          return route.fulfill({ status: 200, contentType: 'text/html', body: SEARCH_PAGE });
        }
        const html = PRODUCT_PAGES[url];
        return html
          ? route.fulfill({ status: 200, contentType: 'text/html', body: html })
          : route.abort();
      });
      return page;
    };
    return browser;
  };

  globalThis.fetch = (async (url: unknown) => {
    // Image CDN fetches (downloadProductImages) get bytes; AI calls get JSON.
    if (String(url).includes('img/')) {
      return new Response(Buffer.from([0xff, 0xd8, 0xff, 0x00]), { status: 200, headers: { 'content-type': 'image/jpeg' } });
    }
    if (aiMode === 'fail') return new Response('server error', { status: 500 });
    return new Response(
      JSON.stringify({ choices: [{ message: { content: 'Structured research analysis text.' } }] }),
      { status: 200 },
    );
  }) as typeof fetch;
});

after(() => {
  (chromium as { launch: typeof realLaunch }).launch = realLaunch;
  globalThis.fetch = realFetch;
  rmSync(dir, { recursive: true, force: true });
});

const progressLog: string[] = [];
const imagesDir = join(dir, 'images');
const runnerFor = (dbPath: string) =>
  createResearchRunner({
    databaseFilePath: dbPath, reportsDirectory: dir, imagesDirectory: imagesDir, marketplace: 'Redbubble',
    aiProvider: 'openai', aiModel: 'test-model', aiApiKey: 'test-key', logger,
    onProgress: (stage) => progressLog.push(stage),
    productTypeIaCode: 'u-tees', sortOrder: 'top selling',
  });

test('complete workflow persists products, AI analysis, a completed session, and an HTML report', async () => {
  const dbPath = join(dir, 'e2e.db');
  const runner = runnerFor(dbPath);
  progressLog.length = 0;
  const result = await runner.research('  dog   mom ');
  runner.close();

  assert.ok(result.ok);
  assert.equal(result.ok && result.productsSaved, 2);
  // Progress channel reports every workflow phase in order (UI consumes this).
  assert.deepEqual(progressLog, [
    'searching', 'discovering', 'extracting', 'normalizing', 'analyzing', 'downloading-images', 'generating-report',
  ]);

  const db = new Database(dbPath, { readonly: true });
  const sess = db.prepare('SELECT * FROM research_sessions').all() as Record<string, unknown>[];
  assert.equal(sess.length, 1);
  assert.equal(sess[0].status, 'completed');
  assert.ok(sess[0].completed_at);
  assert.equal(sess[0].keyword, 'dog mom');
  const count = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
  assert.equal(count('SELECT COUNT(*) c FROM products'), 2);
  assert.ok(db.prepare("SELECT 1 FROM products WHERE title='Cool Mug'").get());
  // Search URL contract (RESEARCH-IMPROVEMENTS-PLAN §2.1): category + sort.
  assert.ok(lastSearchUrl);
  const searchUrl = new URL(lastSearchUrl as string);
  assert.equal(searchUrl.searchParams.get('iaCode'), 'u-tees');
  assert.equal(searchUrl.searchParams.get('sortOrder'), 'top selling');
  assert.equal(searchUrl.searchParams.get('includeMatureContent'), 'false');
  // Session records the search scope.
  assert.equal(sess[0].product_type, 'T-Shirts');
  assert.equal(sess[0].sort_order, 'top selling');
  // Extraction fallbacks verified end-to-end: URL slug artist beats og:title;
  // og:title artist used when no slug; type from URL.
  const mugRow = db.prepare("SELECT artist_name FROM products WHERE product_url LIKE '%111.abc%'").get() as { artist_name: string | null };
  assert.equal(mugRow.artist_name, 'FixtureArtist');
  const sticker = db.prepare("SELECT artist_name, product_type FROM products WHERE product_url LIKE '%sticker%'").get() as {
    artist_name: string | null; product_type: string | null;
  };
  assert.equal(sticker.artist_name, 'TestArtist');
  assert.equal(sticker.product_type, 'sticker');
  // Demand/competition signals persisted: rank for both, page-text counts for the mug.
  const stats = db.prepare('SELECT * FROM product_statistics ORDER BY rank').all() as Record<string, unknown>[];
  assert.equal(stats.length, 2);
  assert.deepEqual(stats.map((s) => s.rank), [1, 2]);
  assert.equal(stats[0].available_products, 40);
  assert.equal(stats[0].artist_design_count, 9876);
  // On-page "All Product Tags" section wins over meta keywords for the sticker.
  const stickerTags = db.prepare(
    "SELECT tag FROM product_tags WHERE product_id = (SELECT id FROM products WHERE product_url LIKE '%sticker%') ORDER BY tag",
  ).all() as { tag: string }[];
  assert.deepEqual(stickerTags.map((t) => t.tag), ['cute tag', 'fun tag']);
  const analysis = db.prepare('SELECT * FROM ai_analysis').all() as Record<string, unknown>[];
  assert.equal(analysis.length, 1);
  assert.equal(analysis[0].session_id, sess[0].id);
  assert.equal(analysis[0].provider, 'openai');
  assert.equal(analysis[0].response, 'Structured research analysis text.');
  assert.match(String(analysis[0].prompt), /dog mom/);

  // Report file exists, is offline-safe, and its metadata is linked (Doc 010 §10, §13).
  assert.ok(result.ok && existsSync(result.reportPath));
  const html = readFileSync(result.ok ? result.reportPath : '', 'utf8');
  assert.match(html, /dog mom/);
  assert.match(html, /Cool Mug/);
  assert.match(html, /Structured research analysis text\./);
  assert.ok(!/img src="http/.test(html), 'report must not reference remote images');
  // Research-improvements report additions: metrics panel, rank badges, scope.
  assert.match(html, /Market Metrics/);
  assert.match(html, /#1/);
  assert.match(html, /T-Shirts/);
  assert.match(html, /top selling/);
  // Image pipeline: downloaded locally, stored as root-relative path, and the
  // report references it relative to reports/ (offline, no remote URLs).
  const imgRow = db.prepare('SELECT local_path FROM product_images WHERE local_path IS NOT NULL').get() as
    | { local_path: string }
    | undefined;
  assert.ok(imgRow, 'at least one image downloaded');
  assert.ok(imgRow!.local_path.startsWith('images/'));
  assert.ok(existsSync(join(imagesDir, imgRow!.local_path.replace('images/', ''))), 'image file exists');
  assert.match(html, /src="\.\.\/images\//);
  const report = db.prepare('SELECT * FROM reports').all() as Record<string, unknown>[];
  assert.equal(report.length, 1);
  assert.equal(report[0].session_id, sess[0].id);
  assert.equal(sess[0].report_id, report[0].id);
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
  db.close();
});

test('AI failure preserves collected data and marks the session failed', async () => {
  const dbPath = join(dir, 'aifail.db');
  const runner = runnerFor(dbPath);
  aiMode = 'fail';
  await assert.rejects(() => runner.research('dog mom'), /HTTP 500/);
  aiMode = 'ok';
  runner.close();

  const db = new Database(dbPath, { readonly: true });
  const sess = db.prepare('SELECT * FROM research_sessions').all() as Record<string, unknown>[];
  assert.equal(sess.length, 1);
  assert.equal(sess[0].status, 'failed');
  const count = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
  assert.equal(count('SELECT COUNT(*) c FROM products'), 2, 'collected products must survive AI failure');
  assert.equal(count('SELECT COUNT(*) c FROM ai_analysis'), 0);
  assert.equal(count('SELECT COUNT(*) c FROM reports'), 0, 'no report record without analysis');
  db.close();
});

test('invalid keyword: no browser launch, no database rows', async () => {
  const dbPath = join(dir, 'invalid.db');
  const runner = runnerFor(dbPath);
  const launchesBefore = browserLaunches;
  const result = await runner.research('     ');
  runner.close();

  assert.equal(result.ok, false);
  assert.equal(browserLaunches, launchesBefore);
  const db = new Database(dbPath, { readonly: true });
  assert.equal((db.prepare('SELECT COUNT(*) c FROM research_sessions').get() as { c: number }).c, 0);
  db.close();
});

test('collection failure leaves the database clean', async () => {
  const dbPath = join(dir, 'fail.db');
  const runner = runnerFor(dbPath);
  browserMode = 'fail';
  await assert.rejects(() => runner.research('dog mom'));
  browserMode = 'ok';
  runner.close();

  const db = new Database(dbPath, { readonly: true });
  assert.equal((db.prepare('SELECT COUNT(*) c FROM research_sessions').get() as { c: number }).c, 0);
  db.close();
});

test('research after close fails fast without launching a browser', async () => {
  const runner = runnerFor(join(dir, 'closed.db'));
  runner.close();
  const launchesBefore = browserLaunches;
  await assert.rejects(() => runner.research('dog mom'), /Database connection is closed/);
  assert.equal(browserLaunches, launchesBefore);
});
