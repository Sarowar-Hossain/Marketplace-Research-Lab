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

// Average design-count across the unique artists that publish one. Dedupes by
// artist so a prolific seller appearing on many products is counted once.
export function averageArtistPortfolio(products: ResearchProduct[]): number | null {
  const byArtist = new Map<string, number>();
  for (const product of products) {
    const artist = product.artistName;
    const designs = product.statistics?.artistDesignCount;
    if (artist && artist.trim().length > 0 && designs !== null && designs !== undefined) {
      byArtist.set(artist, designs);
    }
  }
  if (byArtist.size === 0) return null;
  const total = [...byArtist.values()].reduce((sum, value) => sum + value, 0);
  return Math.round(total / byArtist.size);
}

export type ArtistAggregate = {
  name: string;
  productCount: number;
  avgPrice: number | null;
  designCount: number | null;
};

// Aggregates per-artist presence from product rows: how many products each
// artist has in the results, their average price, and their published design
// count (deduped). Sorted by product count, then name.
export function aggregateArtists(products: ResearchProduct[]): ArtistAggregate[] {
  const map = new Map<string, { count: number; priceSum: number; priceCount: number; designs: number | null }>();
  for (const product of products) {
    const artist = product.artistName;
    if (!artist || artist.trim().length === 0) continue;
    const entry = map.get(artist) ?? { count: 0, priceSum: 0, priceCount: 0, designs: null };
    entry.count += 1;
    if (product.price !== null) {
      entry.priceSum += product.price;
      entry.priceCount += 1;
    }
    const designs = product.statistics?.artistDesignCount;
    if (designs !== null && designs !== undefined) entry.designs = designs;
    map.set(artist, entry);
  }
  return [...map.entries()]
    .map(([name, entry]) => ({
      name,
      productCount: entry.count,
      avgPrice: entry.priceCount > 0 ? entry.priceSum / entry.priceCount : null,
      designCount: entry.designs,
    }))
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name));
}

export type ProductSort = 'rank' | 'price-asc' | 'price-desc' | 'title';

// Returns a sorted copy. 'rank' preserves collection order (already rank order
// when the session used Top Selling sort); the others reorder by price/title.
export function sortProducts(products: ResearchProduct[], sort: ProductSort): ResearchProduct[] {
  const copy = [...products];
  switch (sort) {
    case 'price-asc':
      copy.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      break;
    case 'price-desc':
      copy.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
      break;
    case 'title':
      copy.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'rank':
    default:
      break;
  }
  return copy;
}

export type PriceStats = {
  count: number;
  min: number | null;
  median: number | null;
  max: number | null;
  average: number | null;
};

export function priceStats(products: ResearchProduct[]): PriceStats {
  const prices = products.map((product) => product.price).filter((price): price is number => price !== null);
  if (prices.length === 0) {
    return { count: 0, min: null, median: null, max: null, average: null };
  }
  const sum = prices.reduce((total, value) => total + value, 0);
  return {
    count: prices.length,
    min: Math.min(...prices),
    max: Math.max(...prices),
    median: median(prices),
    average: sum / prices.length,
  };
}
