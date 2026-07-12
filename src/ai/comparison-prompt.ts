import type { AnalysisProduct } from './prompt';

// One keyword's scout-pass data for the comparison.
export type ComparisonEntry = {
  keyword: string;
  products: AnalysisProduct[];
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export type KeywordMetrics = {
  keyword: string;
  productCount: number;
  priceMedian: number | null;
  uniqueArtists: number;
  avgPortfolioSize: number | null;
  topTags: string[];
};

// Deterministic per-keyword aggregates, shared by the prompt and the report.
export function computeKeywordMetrics(entry: ComparisonEntry): KeywordMetrics {
  const prices = entry.products.map((p) => p.price).filter((p): p is number => p !== null);
  const artists = new Set(entry.products.map((p) => p.artistName).filter(Boolean));
  const portfolios = entry.products
    .map((p) => p.artistDesignCount)
    .filter((c): c is number => typeof c === 'number');
  const tagCounts = new Map<string, number>();
  for (const product of entry.products) {
    for (const tag of product.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag]) => tag);
  return {
    keyword: entry.keyword,
    productCount: entry.products.length,
    priceMedian: median(prices),
    uniqueArtists: artists.size,
    avgPortfolioSize:
      portfolios.length > 0 ? Math.round(portfolios.reduce((a, b) => a + b, 0) / portfolios.length) : null,
    topTags,
  };
}

// Comparative prompt: all keywords side by side, one verdict each plus a
// single recommendation — the scout-pass decision a seller actually needs.
// Deterministic for the same input (Doc 009 §8).
export function buildComparisonPrompt(entries: ComparisonEntry[], productType: string): string {
  const summaries = entries.map((entry) => {
    const metrics = computeKeywordMetrics(entry);
    const topProducts = entry.products.slice(0, 8).map((p) => ({
      rank: p.rank ?? null,
      title: p.title,
      artist: p.artistName,
      artistPortfolioSize: p.artistDesignCount ?? null,
      price: p.price,
      tags: p.tags.slice(0, 8),
    }));
    return { keyword: entry.keyword, metrics, topProducts };
  });

  return [
    'You are a senior print-on-demand market analyst advising a Redbubble seller.',
    `The seller's target product category is: ${productType}.`,
    `Below are TOP-SELLING results for ${entries.length} candidate keywords. Rank 1 = best seller for that keyword.`,
    'Compare the keywords against each other and produce:',
    '',
    '1. Comparison Table — one row per keyword: demand signal, competition strength (artist portfolio sizes), price level, differentiation difficulty',
    '2. Keyword Verdicts — for EACH keyword exactly one of: ENTER / ENTER WITH DIFFERENT ANGLE / SKIP, with one-line reasoning',
    '3. Recommended Keyword — the single best keyword to pursue and why',
    '4. Suggested Angle — the concrete design direction for the recommended keyword',
    '5. Cross-Keyword Tag Opportunities — tags that repeat across winners',
    '',
    'Base every observation only on the data provided. Be specific and concise.',
    '',
    JSON.stringify(summaries, null, 2),
  ].join('\n');
}
