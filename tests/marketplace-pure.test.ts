import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateProduct } from '../src/marketplace/validation';
import { normalizeProduct } from '../src/marketplace/normalization';
import type { ExtractedProduct } from '../src/marketplace/extraction';
import { testLogger } from './util';

const logger = testLogger('marketplace');

const base = (): ExtractedProduct => ({
  url: 'https://www.redbubble.com/i/mug/Cool/111.abc',
  title: 'Cool Mug',
  description: null,
  artistName: null,
  productType: null,
  price: null,
  currency: null,
  imageUrls: [],
  tags: [],
});

// Doc 008 §10 — Stage 5 validation.
test('valid product passes with unchanged reference', () => {
  const input = base();
  const result = validateProduct(input, logger);
  assert.ok(result.valid && result.product === input);
});

test('missing or whitespace-only title/url are rejected without mutation', () => {
  const ws = { ...base(), title: '   ' };
  const r1 = validateProduct(ws, logger);
  assert.ok(!r1.valid && r1.reasons.includes('missing title'));
  assert.equal(ws.title, '   ');

  const r2 = validateProduct({ ...base(), url: '' }, logger);
  assert.ok(!r2.valid && r2.reasons.includes('missing url'));

  const r3 = validateProduct({ ...base(), title: null, url: '' }, logger);
  assert.ok(!r3.valid && r3.reasons.length === 2);
});

// Doc 008 §11 — Stage 6 normalization.
test('normalization trims, normalizes line endings, preserves case and internal spacing', () => {
  const out = normalizeProduct({ ...base(), title: '  My   DeSiGn  ', description: 'a\r\nb\rc' });
  assert.equal(out.title, 'My   DeSiGn');
  assert.equal(out.description, 'a\nb\nc');
});

test('empty optional text becomes null; currency is trimmed only', () => {
  const out = normalizeProduct({ ...base(), description: '  ', artistName: '', currency: ' usd ' });
  assert.equal(out.description, null);
  assert.equal(out.artistName, null);
  assert.equal(out.currency, 'usd');
});

test('tags and image urls are trimmed, de-emptied, and deduped case-sensitively', () => {
  const out = normalizeProduct({ ...base(), tags: ['Dog', ' Dog ', 'dog', ''], imageUrls: [' u ', 'u', ''] });
  assert.deepEqual(out.tags, ['Dog', 'dog']);
  assert.deepEqual(out.imageUrls, ['u']);
});

test('normalization never mutates the input', () => {
  const input = { ...base(), title: ' Raw ', tags: ['A', ' A '] };
  const snapshot = JSON.stringify(input);
  const out = normalizeProduct(input);
  assert.equal(JSON.stringify(input), snapshot);
  assert.notEqual(out.tags, input.tags);
});
