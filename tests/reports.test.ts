import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, rmSync, existsSync } from 'node:fs';
import { generateReportHtml, type ReportData } from '../src/reports/generate';
import { saveReportFile } from '../src/reports/save';
import { tempDir } from './util';

const dir = tempDir('mrl-report-');
after(() => rmSync(dir, { recursive: true, force: true }));

const data = (): ReportData => ({
  projectName: 'Marketplace Research Lab',
  generatedAt: '2026-07-12T12:00:00Z',
  session: {
    id: 's1', keyword: 'dog mom', marketplace: 'Redbubble', status: 'completed',
    aiProvider: 'openai', aiModel: 'gpt-test', startedAt: '2026-07-12T11:00:00Z', completedAt: '2026-07-12T11:05:00Z',
    productType: 'T-Shirts', sortOrder: 'top selling',
  },
  products: [
    { id: 'p1', title: 'Cool Mug', productUrl: 'https://rb/i/mug/1', artistName: 'ArtistX', description: null,
      productType: 'mug', price: 12.5, currency: 'USD',
      images: [{ imageUrl: 'https://img/1', localPath: null, displayOrder: 0 }],
      tags: ['coffee', 'funny'],
      statistics: { favorites: null, availableProducts: 73, rank: 1, artistDesignCount: 5691 } },
    { id: 'p2', title: 'Second', productUrl: 'https://rb/i/st/2', artistName: null, description: null,
      productType: null, price: null, currency: null,
      images: [{ imageUrl: 'https://img/2', localPath: 'images/p2.jpg', displayOrder: 0 }],
      tags: [], statistics: { favorites: 42, availableProducts: null, rank: 2, artistDesignCount: null } },
  ],
  analysis: {
    provider: 'openai', model: 'gpt-test', prompt: 'P',
    response: '## Niche Summary\nInsightful analysis.', generatedAt: '2026-07-12T11:04:00Z',
  },
});

// Doc 010 §6 — all four sections with their documented contents.
test('report contains header, summary, products in order, and verbatim analysis', () => {
  const html = generateReportHtml(data());
  for (const expected of [
    'Marketplace Research Lab', 'dog mom', 'Redbubble', '2026-07-12T12:00:00Z', 'openai', 'gpt-test',
    'Products Collected', 'completed',
    'Cool Mug', 'ArtistX', 'mug', '12.5', 'USD', 'coffee', 'Favorites', '42',
    'Insightful analysis.',
  ]) {
    assert.ok(html.includes(expected), `missing: ${expected}`);
  }
  assert.ok(html.indexOf('Cool Mug') < html.indexOf('Second'), 'collection order preserved');
});

// Doc 010 §9 — offline: only local images referenced, never remote URLs.
// Root-relative stored paths get a "../" prefix because the report file lives
// one level down in reports/.
test('only locally stored images are referenced, relative to the report location', () => {
  const html = generateReportHtml(data());
  assert.ok(!html.includes('src="https://img/1"'), 'remote image must not be referenced');
  assert.ok(html.includes('src="../images/p2.jpg"'), 'local image referenced relative to reports/');
});

// Doc 010 §2 — deterministic for identical input.
test('generation is deterministic', () => {
  assert.equal(generateReportHtml(data()), generateReportHtml(data()));
});

test('HTML in titles, tags, and analysis is escaped', () => {
  const d = data();
  d.products[0].title = '<script>alert(1)</script>';
  d.products[0].tags = ['<b>tag</b>'];
  d.analysis.response = '<img src=x onerror=alert(1)>';
  const html = generateReportHtml(d);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(!html.includes('<b>tag</b>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;script&gt;'));
});

// Doc 010 §11 — missing inputs stop generation.
test('missing products or empty analysis stop generation', () => {
  const noProducts = { ...data(), products: [] };
  assert.throws(() => generateReportHtml(noProducts), /product data/);
  const d = data();
  d.analysis.response = '   ';
  assert.throws(() => generateReportHtml(d), /AI analysis/);
});

// Doc 010 §10 — file export.
test('saveReportFile writes the html and returns the path', () => {
  const path = saveReportFile('<html>x</html>', dir, 'r.html');
  assert.ok(existsSync(path));
  assert.equal(readFileSync(path, 'utf8'), '<html>x</html>');
});
