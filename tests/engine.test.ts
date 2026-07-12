import { test } from 'node:test';
import assert from 'node:assert/strict';
import { research, type ResearchDependencies, type CollectedProduct } from '../src/research/engine';
import type { ResearchSession } from '../src/research/session';
import { testLogger } from './util';

const logger = testLogger('research');

const FAKE_PRODUCTS: CollectedProduct[] = [
  { url: 'https://rb/i/a/1', title: 'A', description: null, artistName: null, productType: null, price: 1, currency: 'USD', imageUrls: [], tags: [] },
  { url: 'https://rb/i/b/2', title: 'B', description: null, artistName: null, productType: null, price: null, currency: null, imageUrls: ['u'], tags: ['t'] },
];

type Calls = {
  collect: string[];
  save: { session: ResearchSession; products: CollectedProduct[] }[];
  analyze: string[];
  saveAnalysis: { sessionId: string; prompt: string; response: string }[];
  finalize: { sessionId: string; status: string; completedAt: string | null }[];
  report: string[];
};

function makeDeps(overrides: Partial<ResearchDependencies> = {}): { deps: ResearchDependencies; calls: Calls } {
  const calls: Calls = { collect: [], save: [], analyze: [], saveAnalysis: [], finalize: [], report: [] };
  const deps: ResearchDependencies = {
    marketplace: 'Redbubble', aiProvider: 'openai', aiModel: 'gpt-test', logger,
    searchOptions: { productTypeLabel: 'T-Shirts', iaCode: 'u-tees', sortOrder: 'top selling' },
    collectProducts: async (kw, _log, onStage) => {
      calls.collect.push(kw);
      onStage?.('searching'); onStage?.('discovering'); onStage?.('extracting'); onStage?.('normalizing');
      return FAKE_PRODUCTS;
    },
    saveResearchData: (session, products) => { calls.save.push({ session, products }); return {}; },
    analyzeProducts: async (kw) => { calls.analyze.push(kw); return { prompt: 'P', response: 'R' }; },
    saveAiAnalysis: (sessionId, analysis) => { calls.saveAnalysis.push({ sessionId, ...analysis }); return {}; },
    finalizeSession: (sessionId, status, completedAt) => { calls.finalize.push({ sessionId, status, completedAt }); return {}; },
    downloadImages: async () => 0,
    generateReport: (sessionId) => { calls.report.push(sessionId); return { reportPath: '/reports/r.html' }; },
    ...overrides,
  };
  return { deps, calls };
}

test('successful workflow: collect → persist(analyzing) → analyze → save analysis → finalize completed → report', async () => {
  const { deps, calls } = makeDeps();
  const result = await research('  dog   mom ', deps);
  assert.ok(result.ok);
  assert.equal(result.ok && result.productsSaved, 2);
  assert.equal(result.ok && result.reportPath, '/reports/r.html');
  assert.deepEqual(calls.collect, ['dog mom']);
  // Research data is persisted BEFORE analysis, carrying 'analyzing'.
  assert.equal(calls.save.length, 1);
  assert.equal(calls.save[0].session.status, 'analyzing');
  assert.deepEqual(calls.analyze, ['dog mom']);
  assert.equal(calls.saveAnalysis.length, 1);
  assert.equal(calls.saveAnalysis[0].response, 'R');
  assert.equal(calls.finalize.length, 1);
  assert.equal(calls.finalize[0].status, 'completed');
  assert.ok(calls.finalize[0].completedAt);
  assert.equal(calls.report.length, 1);
});

test('invalid keyword: nothing runs', async () => {
  const { deps, calls } = makeDeps();
  const result = await research('    ', deps);
  assert.deepEqual(result, { ok: false, reason: 'invalid-keyword', detail: 'keyword is empty' });
  assert.equal(calls.collect.length + calls.save.length + calls.analyze.length + calls.finalize.length, 0);
});

test('collection failure: no persistence, no analysis, no finalize; error propagates', async () => {
  const { deps, calls } = makeDeps({ collectProducts: async () => { throw new Error('blocked'); } });
  await assert.rejects(() => research('dog mom', deps), /blocked/);
  assert.equal(calls.save.length, 0);
  assert.equal(calls.analyze.length, 0);
  assert.equal(calls.finalize.length, 0);
});

test('AI failure preserves persisted data, finalizes failed, and skips the report', async () => {
  const { deps, calls } = makeDeps({ analyzeProducts: async () => { throw new Error('provider down'); } });
  await assert.rejects(() => research('dog mom', deps), /provider down/);
  // Data was persisted before the AI step and is never rolled back.
  assert.equal(calls.save.length, 1);
  assert.equal(calls.saveAnalysis.length, 0);
  assert.deepEqual(calls.finalize.map((f) => f.status), ['failed']);
  assert.equal(calls.report.length, 0);
});

test('report failure propagates but the session stays completed (not re-finalized)', async () => {
  const { deps, calls } = makeDeps({ generateReport: () => { throw new Error('disk full'); } });
  await assert.rejects(() => research('dog mom', deps), /disk full/);
  // The session was finalized 'completed' before the report stage and the
  // failure must not flip it to failed (Doc 010 §11: stop the report only).
  assert.deepEqual(calls.finalize.map((f) => f.status), ['completed']);
  assert.equal(calls.saveAnalysis.length, 1);
});

test('persistence failure of research data: no analysis, no finalize', async () => {
  const { deps, calls } = makeDeps({ saveResearchData: () => { throw new Error('db down'); } });
  await assert.rejects(() => research('dog mom', deps), /db down/);
  assert.equal(calls.analyze.length, 0);
  assert.equal(calls.finalize.length, 0);
});

test('interaction order is collect, save, analyze, saveAnalysis, finalize, images, report', async () => {
  const order: string[] = [];
  const { deps } = makeDeps({
    collectProducts: async () => { order.push('collect'); return FAKE_PRODUCTS; },
    saveResearchData: (session) => { order.push(`save:${session.status}`); return {}; },
    analyzeProducts: async () => { order.push('analyze'); return { prompt: 'P', response: 'R' }; },
    saveAiAnalysis: () => { order.push('saveAnalysis'); return {}; },
    finalizeSession: (_id, status) => { order.push(`finalize:${status}`); return {}; },
    downloadImages: async () => { order.push('images'); return 0; },
    generateReport: () => { order.push('report'); return { reportPath: '/r.html' }; },
  });
  await research('dog mom', deps);
  assert.deepEqual(order, ['collect', 'save:analyzing', 'analyze', 'saveAnalysis', 'finalize:completed', 'images', 'report']);
});

test('trend velocity flows to analysis and report; scout failure is tolerated', async () => {
  const velocity = { recentSampleSize: 10, freshTopSellerCount: 2, freshTopSellerPct: 100, incumbentUploadPct: 50, newEntrantArtists: 3 };
  const seen: unknown[] = [];
  const { deps } = makeDeps({
    assessTrendVelocity: async () => velocity,
    analyzeProducts: async (_kw, _p, _log, v) => { seen.push(v); return { prompt: 'P', response: 'R' }; },
    generateReport: (_id, v) => { seen.push(v); return { reportPath: '/r.html' }; },
  });
  const result = await research('dog mom', deps);
  assert.ok(result.ok);
  assert.deepEqual(seen, [velocity, velocity]);

  // Scout failure: workflow continues with null velocity.
  const { deps: failing } = makeDeps({ assessTrendVelocity: async () => { throw new Error('scout blocked'); } });
  const result2 = await research('dog mom', failing);
  assert.ok(result2.ok);
});

test('image download failure is tolerated: research still succeeds with a report', async () => {
  const { deps, calls } = makeDeps({ downloadImages: async () => { throw new Error('cdn down'); } });
  const result = await research('dog mom', deps);
  assert.ok(result.ok);
  assert.equal(calls.report.length, 1, 'report still generated');
});
