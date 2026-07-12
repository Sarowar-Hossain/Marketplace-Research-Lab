import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateKeyword } from '../src/research/keyword';

// Doc 008 §5 — Stage 1 keyword validation.
test('valid keyword passes through', () => {
  assert.deepEqual(validateKeyword('dog mom'), { valid: true, keyword: 'dog mom' });
});

test('trims leading/trailing whitespace', () => {
  assert.deepEqual(validateKeyword('   dog mom   '), { valid: true, keyword: 'dog mom' });
});

test('collapses internal whitespace including tabs/newlines', () => {
  assert.deepEqual(validateKeyword('dog \t\n mom'), { valid: true, keyword: 'dog mom' });
});

test('rejects empty and whitespace-only keywords', () => {
  assert.equal(validateKeyword('').valid, false);
  assert.equal(validateKeyword('      ').valid, false);
});

test('rejects keywords over the maximum length', () => {
  const result = validateKeyword('x'.repeat(300));
  assert.equal(result.valid, false);
});

test('does not modify the original input', () => {
  const original = '  dog mom  ';
  validateKeyword(original);
  assert.equal(original, '  dog mom  ');
});
