import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createResearchSession,
  updateSessionStatus,
  completeResearchSession,
  failResearchSession,
} from '../src/research/session';

// Doc 004 §5 — Research Session lifecycle.
test('creates a session with all required fields', () => {
  const s = createResearchSession('dog mom', 'Redbubble', 'prov', 'model');
  assert.match(s.id, /^[0-9a-f-]{36}$/i);
  assert.equal(s.keyword, 'dog mom');
  assert.equal(s.marketplace, 'Redbubble');
  assert.equal(s.aiProvider, 'prov');
  assert.equal(s.aiModel, 'model');
  assert.equal(s.status, 'created');
  assert.equal(s.completedAt, null);
  assert.equal(new Date(s.startedAt).toISOString(), s.startedAt);
});

test('transitions return new objects and never mutate the original', () => {
  const s = createResearchSession('k', 'm', 'p', 'mo');
  const next = updateSessionStatus(s, 'searching');
  assert.equal(next.status, 'searching');
  assert.equal(s.status, 'created');
  assert.notEqual(next, s);
});

test('complete and fail set terminal status and completedAt', () => {
  const s = createResearchSession('k', 'm', 'p', 'mo');
  const done = completeResearchSession(s);
  const failed = failResearchSession(s);
  assert.equal(done.status, 'completed');
  assert.ok(done.completedAt);
  assert.equal(failed.status, 'failed');
  assert.ok(failed.completedAt);
  assert.equal(s.completedAt, null);
});

test('session ids are unique', () => {
  const ids = new Set(Array.from({ length: 100 }, () => createResearchSession('k', 'm', 'p', 'mo').id));
  assert.equal(ids.size, 100);
});
