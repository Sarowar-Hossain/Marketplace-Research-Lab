import type { ResearchProduct } from '../api';

// Aggregated market metrics computed at view time from the stored product rows
// (pure presentation aggregation — the source rows are never modified).
export type Metrics = {
  productCount: number;
  priceMin: number | null;
  priceMedian: number | null;
  priceMax: number | null;
  uniqueArtistCount: number;
  topArtist: { name: string; count: number; share: number } | null;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeMetrics(products: ResearchProduct[]): Metrics {
  const prices = products
    .map((product) => product.price)
    .filter((price): price is number => price !== null);

  const artistCounts = new Map<string, number>();
  for (const product of products) {
    const artist = product.artistName;
    if (artist && artist.trim().length > 0) {
      artistCounts.set(artist, (artistCounts.get(artist) ?? 0) + 1);
    }
  }

  let topArtist: Metrics['topArtist'] = null;
  if (artistCounts.size > 0) {
    let name = '';
    let count = 0;
    for (const [artist, occurrences] of artistCounts) {
      if (occurrences > count) {
        name = artist;
        count = occurrences;
      }
    }
    topArtist = { name, count, share: count / products.length };
  }

  return {
    productCount: products.length,
    priceMin: prices.length > 0 ? Math.min(...prices) : null,
    priceMax: prices.length > 0 ? Math.max(...prices) : null,
    priceMedian: median(prices),
    uniqueArtistCount: artistCounts.size,
    topArtist,
  };
}

export type TagCount = { tag: string; count: number };

// Tags across all products, frequency-sorted (then alphabetical for stability).
export function aggregateTags(products: ResearchProduct[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    for (const tag of product.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
