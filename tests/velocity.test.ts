import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTrendVelocity } from '../src/research/velocity';

const top = [
  { url: 'u1', artistName: 'A' },
  { url: 'u2', artistName: 'B' },
  { url: 'u3', artistName: 'C' },
  { url: 'u4', artistName: null },
];

test('overlap and incumbent metrics computed correctly', () => {
  const recent = [
    { url: 'u1', artistName: 'A' },   // fresh top seller + incumbent
    { url: 'r1', artistName: 'A' },   // incumbent upload
    { url: 'r2', artistName: 'X' },   // new entrant
    { url: 'r3', artistName: 'Y' },   // new entrant
    { url: 'r4', artistName: null },  // no artist signal
  ];
  const v = computeTrendVelocity(top, recent);
  assert.equal(v.recentSampleSize, 5);
  assert.equal(v.freshTopSellerCount, 1);
  assert.equal(v.freshTopSellerPct, 25);       // 1 of 4 top sellers
  assert.equal(v.incumbentUploadPct, 50);      // 2 of 4 recent-with-artist
  assert.equal(v.newEntrantArtists, 2);        // X, Y
});

test('empty inputs produce zeroes, never division errors', () => {
  const v = computeTrendVelocity([], []);
  assert.deepEqual(v, {
    recentSampleSize: 0, freshTopSellerCount: 0, freshTopSellerPct: 0,
    incumbentUploadPct: 0, newEntrantArtists: 0,
  });
});

test('stale niche: no overlap, all new entrants', () => {
  const recent = [
    { url: 'r1', artistName: 'X' },
    { url: 'r2', artistName: 'Y' },
  ];
  const v = computeTrendVelocity(top, recent);
  assert.equal(v.freshTopSellerCount, 0);
  assert.equal(v.incumbentUploadPct, 0);
  assert.equal(v.newEntrantArtists, 2);
});
