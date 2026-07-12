import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchUrl } from '../src/marketplace/search';
import { PRODUCT_CATEGORIES, SORT_ORDERS } from '../src/marketplace/collect';

// URL contract verified live 2026-07-12 (RESEARCH-IMPROVEMENTS-PLAN.md §2.1).
test('defaults: all departments, top selling, mature content excluded', () => {
  const url = new URL(buildSearchUrl('dog mom'));
  assert.equal(url.origin + url.pathname, 'https://www.redbubble.com/shop');
  assert.equal(url.searchParams.get('iaCode'), 'all-departments');
  assert.equal(url.searchParams.get('sortOrder'), 'top selling');
  assert.equal(url.searchParams.get('includeMatureContent'), 'false');
  assert.equal(url.searchParams.get('query'), 'dog mom');
});

test('category and sort combinations produce the verified format', () => {
  const url = new URL(buildSearchUrl('dog mom christmas', { iaCode: 'u-tees', sortOrder: 'top selling' }));
  assert.equal(url.searchParams.get('iaCode'), 'u-tees');
  assert.equal(url.searchParams.get('sortOrder'), 'top selling');
  assert.equal(url.searchParams.get('query'), 'dog mom christmas');

  const recent = new URL(buildSearchUrl('k', { iaCode: 'all-stickers', sortOrder: 'recent' }));
  assert.equal(recent.searchParams.get('iaCode'), 'all-stickers');
  assert.equal(recent.searchParams.get('sortOrder'), 'recent');
});

test('category map contains only live-verified iaCodes', () => {
  assert.deepEqual(
    PRODUCT_CATEGORIES.map((c) => c.iaCode),
    ['all-departments', 'u-tees', 'all-stickers', 'u-sweatshirts', 'u-mugs', 'u-phone-cases'],
  );
  assert.deepEqual(SORT_ORDERS, ['top selling', 'relevant', 'recent']);
});
