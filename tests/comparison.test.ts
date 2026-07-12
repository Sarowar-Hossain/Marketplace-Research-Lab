import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { rmSync, existsSync, readFileSync } from 'node:fs';
import { chromium, type Browser, type LaunchOptions, type Route } from 'playwright';
import Database from 'better-sqlite3';
import { createResearchRunner } from '../src/research/bootstrap';
import { collectProducts } from '../src/marketplace/collect';
import { buildComparisonPrompt, computeKeywordMetrics } from '../src/ai/comparison-prompt';
import { generateComparisonHtml } from '../src/reports/comparison';
import { testLogger, tempDir } from './util';

const dir = tempDir('mrl-compare-');
const logger = testLogger('research');

// Distinct fixture results per keyword, served by query param.
const SEARCH_PAGES: Record<string, string> = {
  'dog mom': `<!doctype html><html><body>
    <a href="https://www.redbubble.com/i/t-shirt/Dog-Tee-by-DogArtist/111.aa">p</a>
    <a href="https://www.redbubble.com/i/t-shirt/Dog-Two-by-DogArtist/112.bb">p</a>
    <a href="https://www.redbubble.com/i/t-shirt/Dog-Three-by-OtherArtist/113.cc">p</a></body></html>`,
  'cat dad': `<!doctype html><html><body>
    <a href="https://www.redbubble.com/i/t-shirt/Cat-Tee-by-CatArtist/221.dd">p</a>
    <a href="https://www.redbubble.com/i/t-shirt/Cat-Two-by-CatArtist/222.ee">p</a></body></html>`,
};

const productPage = (name: string, price: string) => `<!doctype html><html><head>
  <script type="application/ld+json">{"@type":"Product","name":"${name}","keywords":["tag-a","tag-b"],
  "offers":{"price":"${price}","priceCurrency":"USD"}}</script></head><body></body></html>`;

let aiCalls = 0;
const realLaunch = chromium.launch.bind(chromium);
const realFetch = globalThis.fetch;

before(() => {
  (chromium as { launch: (options?: LaunchOptions) => Promise<Browser> }).launch = async () => {
    const browser = await realLaunch({ headless: true });
    const realNewPage = browser.newPage.bind(browser);
    (browser as { newPage: typeof browser.newPage }).newPage = async () => {
      const page = await realNewPage();
      await page.route('**/*', (route: Route) => {
        const full = route.request().url();
        const url = full.split('?')[0];
        if (url.startsWith('https://www.redbubble.com/shop')) {
          const query = new URL(full).searchParams.get('query') ?? '';
          const body = SEARCH_PAGES[query] ?? '<html><body></body></html>';
          return route.fulfill({ status: 200, contentType: 'text/html', body });
        }
        if (url.includes('/i/')) {
          return route.fulfill({
            status: 200, contentType: 'text/html',
            body: productPage(url.includes('Cat') ? 'Cat Product' : 'Dog Product', url.includes('Cat') ? '25.00' : '29.00'),
          });
        }
        return route.abort();
      });
      return page;
    };
    return browser;
  };
  globalThis.fetch = (async () => {
    aiCalls += 1;
    return new Response(
      JSON.stringify({ choices: [{ message: { content: 'Recommended Keyword: cat dad. ENTER.' } }] }),
      { status: 200 },
    );
  }) as typeof fetch;
});

after(() => {
  (chromium as { launch: typeof realLaunch }).launch = realLaunch;
  globalThis.fetch = realFetch;
  rmSync(dir, { recursive: true, force: true });
});

test('comparison prompt and metrics are deterministic and complete', () => {
  const entry = {
    keyword: 'dog mom',
    products: [
      { url: 'u1', title: 'A', description: null, artistName: 'X', productType: 't-shirt', price: 20,
        currency: 'USD', tags: ['a', 'b'], rank: 1, artistDesignCount: 100, availableProducts: 50 },
      { url: 'u2', title: 'B', description: null, artistName: 'X', productType: 't-shirt', price: 30,
        currency: 'USD', tags: ['a'], rank: 2, artistDesignCount: 200, availableProducts: null },
    ],
  };
  const metrics = computeKeywordMetrics(entry);
  assert.equal(metrics.productCount, 2);
  assert.equal(metrics.priceMedian, 25);
  assert.equal(metrics.uniqueArtists, 1);
  assert.equal(metrics.avgPortfolioSize, 150);
  assert.deepEqual(metrics.topTags.slice(0, 1), ['a']);

  const p1 = buildComparisonPrompt([entry], 'T-Shirts');
  assert.equal(p1, buildComparisonPrompt([entry], 'T-Shirts'));
  for (const section of ['Comparison Table', 'Keyword Verdicts', 'Recommended Keyword', 'Suggested Angle', 'Cross-Keyword Tag Opportunities']) {
    assert.ok(p1.includes(section), `missing: ${section}`);
  }
});

test('comparison report requires results and analysis', () => {
  assert.throws(() =>
    generateComparisonHtml({
      projectName: 'x', productType: 't', sortOrder: 's', generatedAt: 'g',
      keywords: [], skippedKeywords: [], analysis: 'a',
    }),
  );
});

test('collectProducts honors maxProducts cap', async () => {
  const products = await collectProducts('dog mom', logger, { iaCode: 'u-tees', sortOrder: 'top selling', maxProducts: 1 });
  assert.equal(products.length, 1);
  assert.equal(products[0].rank, 1);
});

test('end-to-end comparison: sessions persisted, one AI call, report written, no reports-table rows', async () => {
  const dbPath = join(dir, 'compare.db');
  const runner = createResearchRunner({
    databaseFilePath: dbPath, reportsDirectory: dir, imagesDirectory: join(dir, 'img'),
    marketplace: 'Redbubble', aiProvider: 'openai', aiModel: 'm', aiApiKey: 'k', logger,
    productTypeIaCode: 'u-tees', sortOrder: 'top selling',
  });
  aiCalls = 0;
  const result = await runner.compare(['dog mom', 'cat dad', '   ']);
  runner.close();

  assert.equal(result.keywords.length, 2);
  assert.deepEqual(result.skippedKeywords, ['   ']);
  assert.equal(aiCalls, 1, 'exactly one comparative AI call');
  assert.ok(existsSync(result.reportPath));

  const html = readFileSync(result.reportPath, 'utf8');
  assert.match(html, /Keyword Comparison/);
  assert.match(html, /Metrics Comparison/);
  assert.match(html, /dog mom/);
  assert.match(html, /cat dad/);
  assert.match(html, /Recommended Keyword: cat dad/);

  const db = new Database(dbPath, { readonly: true });
  const sessions = db.prepare('SELECT keyword, status, ai_provider, product_type FROM research_sessions ORDER BY keyword').all() as Record<string, unknown>[];
  assert.equal(sessions.length, 2, 'each keyword persisted as its own session');
  assert.equal(sessions[0].keyword, 'cat dad');
  assert.equal(sessions[0].status, 'completed');
  assert.equal(sessions[0].ai_provider, 'comparison');
  assert.equal(sessions[0].product_type, 'T-Shirts');
  assert.ok((db.prepare('SELECT COUNT(*) c FROM products').get() as { c: number }).c >= 5);
  assert.equal((db.prepare('SELECT COUNT(*) c FROM reports').get() as { c: number }).c, 0, 'comparison is report-file only');
  assert.equal((db.prepare('SELECT COUNT(*) c FROM ai_analysis').get() as { c: number }).c, 0, 'no per-keyword analysis rows');
  db.close();
});
