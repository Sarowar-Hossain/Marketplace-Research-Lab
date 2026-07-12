import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalysisPrompt, type AnalysisProduct } from '../src/ai/prompt';
import { analyzeProducts } from '../src/ai/analyze';
import { createAiProvider } from '../src/ai/provider';
import { testLogger } from './util';

const logger = testLogger('ai');

const products: AnalysisProduct[] = [
  { url: 'https://rb/i/a/1', title: 'Cool Mug', description: 'A very cool mug', artistName: 'ArtistX',
    productType: 'mug', price: 12.5, currency: 'USD', tags: ['coffee', 'funny'] },
];

// Doc 009 §8 — prompt construction is deterministic and includes the context.
test('prompt is deterministic and contains keyword, sections, and product data', () => {
  const p1 = buildAnalysisPrompt('dog mom', products);
  const p2 = buildAnalysisPrompt('dog mom', products);
  assert.equal(p1, p2);
  assert.match(p1, /"dog mom"/);
  assert.match(p1, /Niche Summary/);
  assert.match(p1, /Strategic Recommendations/);
  assert.match(p1, /Cool Mug/);
  assert.match(p1, /coffee/);
});

test('long descriptions are truncated deterministically', () => {
  const long = { ...products[0], description: 'x'.repeat(1000) };
  const prompt = buildAnalysisPrompt('k', [long]);
  assert.ok(!prompt.includes('x'.repeat(400)));
});

// Doc 009 §6 — input validation.
test('analysis with zero products fails before any request', async () => {
  let called = false;
  const provider = { sendPrompt: async () => { called = true; return 'r'; } };
  await assert.rejects(() => analyzeProducts('k', [], provider, logger), /at least one/);
  assert.equal(called, false);
});

// Doc 009 §10 — response validation.
test('empty AI response is rejected and not returned', async () => {
  const provider = { sendPrompt: async () => '   ' };
  await assert.rejects(() => analyzeProducts('k', products, provider, logger), /validation failed/);
});

test('successful analysis returns prompt and response', async () => {
  const provider = { sendPrompt: async (p: string) => `analysis for: ${p.slice(0, 20)}` };
  const result = await analyzeProducts('dog mom', products, provider, logger);
  assert.match(result.response, /^analysis for:/);
  assert.match(result.prompt, /dog mom/);
});

// Doc 006 §18 — provider abstraction.
test('unknown provider is rejected at creation', () => {
  assert.throws(() => createAiProvider({ provider: 'nope', model: 'm', apiKey: 'k' }), /Unknown AI provider/);
  assert.throws(() => createAiProvider({ provider: 'openai', model: '', apiKey: 'k' }), /model and API key/);
});

test('provider sends OpenAI-compatible request to the per-provider endpoint', async () => {
  const seen: { url: string; body: Record<string, unknown>; auth: string | null }[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
    seen.push({
      url: String(url),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      auth: new Headers(init?.headers).get('authorization'),
    });
    return new Response(JSON.stringify({ choices: [{ message: { content: 'the analysis' } }] }), { status: 200 });
  }) as typeof fetch;
  try {
    for (const [provider, expectedHost] of [
      ['openai', 'api.openai.com'],
      ['deepseek', 'api.deepseek.com'],
      ['glm', 'open.bigmodel.cn'],
    ] as const) {
      const ai = createAiProvider({ provider, model: 'test-model', apiKey: 'secret' });
      const out = await ai.sendPrompt('hello');
      assert.equal(out, 'the analysis');
      const last = seen[seen.length - 1];
      assert.ok(last.url.includes(expectedHost));
      assert.equal(last.body.model, 'test-model');
      assert.equal(last.auth, 'Bearer secret');
    }
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('provider surfaces HTTP errors and malformed payloads', async () => {
  const realFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () => new Response('quota exceeded', { status: 429 })) as typeof fetch;
    const ai = createAiProvider({ provider: 'openai', model: 'm', apiKey: 'k' });
    await assert.rejects(() => ai.sendPrompt('p'), /HTTP 429/);

    globalThis.fetch = (async () => new Response(JSON.stringify({ choices: [] }), { status: 200 })) as typeof fetch;
    await assert.rejects(() => ai.sendPrompt('p'), /did not contain message content/);
  } finally {
    globalThis.fetch = realFetch;
  }
});
