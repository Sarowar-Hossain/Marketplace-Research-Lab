import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { rmSync, existsSync, readFileSync } from 'node:fs';
import { initializeDatabase } from '../src/storage/initialize';
import { closeDatabase } from '../src/storage/database';
import { saveResearchData } from '../src/storage/persistence';
import { downloadProductImages } from '../src/storage/images';
import { testLogger, tempDir } from './util';

const dir = tempDir('mrl-images-');
const logger = testLogger('storage');
after(() => rmSync(dir, { recursive: true, force: true }));

const session = {
  id: 'sess-1', keyword: 'k', marketplace: 'Redbubble', status: 'completed',
  aiProvider: 'p', aiModel: 'm', startedAt: '2026-07-12T10:00:00Z',
};
const products = [
  { title: 'A', url: 'https://rb/i/a/1', artistName: null, description: null, productType: null,
    price: null, currency: null, imageUrls: ['https://cdn/ok.jpg', 'https://cdn/fail.jpg'], tags: [] },
];

test('downloads images, writes files, records relative local_path; failures are skipped', async () => {
  const db = initializeDatabase(join(dir, 'img.db'), logger);
  saveResearchData(db, session, products, logger);

  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: unknown) => {
    if (String(url).includes('fail')) return new Response('nope', { status: 404 });
    return new Response(Buffer.from([0xff, 0xd8, 0xff, 0x00]), { status: 200, headers: { 'content-type': 'image/jpeg' } });
  }) as typeof fetch;

  try {
    const imagesDir = join(dir, 'images-out');
    const count = await downloadProductImages(db, 'sess-1', imagesDir, logger);
    assert.equal(count, 1, 'one downloaded, one skipped');

    const rows = db.prepare('SELECT image_url, local_path FROM product_images ORDER BY image_url').all() as {
      image_url: string; local_path: string | null;
    }[];
    const failed = rows.find((r) => r.image_url.includes('fail'));
    const ok = rows.find((r) => r.image_url.includes('ok'));
    assert.equal(failed?.local_path, null, 'failed image keeps null local_path');
    assert.ok(ok?.local_path?.startsWith('images/'), 'stored path is root-relative');
    assert.ok(ok?.local_path?.endsWith('.jpg'));
    const file = join(imagesDir, (ok?.local_path as string).replace('images/', ''));
    assert.ok(existsSync(file), 'file written to the images directory');
    assert.equal(readFileSync(file).length, 4);

    // Second run: already-downloaded images are not re-fetched.
    let fetches = 0;
    globalThis.fetch = (async () => { fetches += 1; return new Response('x', { status: 404 }); }) as typeof fetch;
    const again = await downloadProductImages(db, 'sess-1', imagesDir, logger);
    assert.equal(again, 0);
    assert.equal(fetches, 1, 'only the still-null image is retried');
  } finally {
    globalThis.fetch = realFetch;
    closeDatabase(db);
  }
});
