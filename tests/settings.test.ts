import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { rmSync, writeFileSync } from 'node:fs';
import { loadSettings, saveSettings } from '../src/application/settings';
import { tempDir } from './util';

const dir = tempDir('mrl-settings-');
after(() => rmSync(dir, { recursive: true, force: true }));

const valid = { ai: { provider: 'openai' as const, model: 'gpt-test', apiKey: 'secret' } };

test('missing settings file loads as null (not configured)', () => {
  assert.equal(loadSettings(join(dir, 'nope.json')), null);
});

test('save/load roundtrip preserves settings', () => {
  const path = join(dir, 'settings.json');
  saveSettings(path, valid);
  assert.deepEqual(loadSettings(path), valid);
});

test('invalid settings are rejected on save with a clear message', () => {
  const path = join(dir, 'invalid-save.json');
  assert.throws(() => saveSettings(path, { ai: { provider: 'openai', model: '', apiKey: 'k' } }), /model/);
  assert.throws(() => saveSettings(path, { ai: { provider: 'unknown', model: 'm', apiKey: 'k' } }), /provider/);
});

test('malformed or invalid stored files load as null', () => {
  const broken = join(dir, 'broken.json');
  writeFileSync(broken, '{not json');
  assert.equal(loadSettings(broken), null);
  const wrongShape = join(dir, 'wrong.json');
  writeFileSync(wrongShape, JSON.stringify({ ai: { provider: 'openai' } }));
  assert.equal(loadSettings(wrongShape), null);
});
