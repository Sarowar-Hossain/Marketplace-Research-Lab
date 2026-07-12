// Product data as prepared for AI consumption (Doc 009 §7): business data
// only, structurally compatible with the collected NormalizedProduct shape.
export type AnalysisProduct = {
  url: string;
  title: string;
  description: string | null;
  artistName: string | null;
  productType: string | null;
  price: number | null;
  currency: string | null;
  tags: string[];
  rank?: number | null;
  availableProducts?: number | null;
  artistDesignCount?: number | null;
};

// Trend velocity signals (structural mirror of the research module's
// TrendVelocity — the AI module imports nothing from other modules).
export type TrendVelocitySignals = {
  recentSampleSize: number;
  freshTopSellerCount: number;
  freshTopSellerPct: number;
  incumbentUploadPct: number;
  newEntrantArtists: number;
};

// Research context for the analysis: what was searched and how it was sorted.
// When sorted by "top selling", product rank is the demand order.
export type AnalysisContext = {
  productType: string;
  sortOrder: string;
  trendVelocity?: TrendVelocitySignals;
};

// Long descriptions add cost without analytical value; truncation keeps the
// prompt bounded while staying deterministic for the same input.
const MAX_DESCRIPTION_LENGTH = 300;

// Context Preparation (Doc 009 §7): organize collected products into a
// consistent structure containing only business data.
function prepareContext(products: AnalysisProduct[]): object[] {
  return products.map((product) => ({
    rank: product.rank ?? null,
    title: product.title,
    artist: product.artistName,
    artistPortfolioSize: product.artistDesignCount ?? null,
    availableOnProducts: product.availableProducts ?? null,
    productType: product.productType,
    price: product.price,
    currency: product.currency,
    tags: product.tags,
    description:
      product.description === null ? null : product.description.slice(0, MAX_DESCRIPTION_LENGTH),
  }));
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Deterministic market aggregates included in the prompt so the AI reasons
// from numbers instead of estimating them.
function marketSummary(products: AnalysisProduct[]): string {
  const prices = products.map((p) => p.price).filter((p): p is number => p !== null);
  const artists = new Map<string, number>();
  for (const product of products) {
    if (product.artistName) {
      artists.set(product.artistName, (artists.get(product.artistName) ?? 0) + 1);
    }
  }
  const topArtist = [...artists.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const lines = [
    `- Products analyzed: ${products.length}`,
    prices.length > 0
      ? `- Price range: ${Math.min(...prices)} to ${Math.max(...prices)} (median ${median(prices)})`
      : '- Price range: unavailable',
    `- Unique artists: ${artists.size}`,
  ];
  if (topArtist) {
    lines.push(`- Most frequent artist: ${topArtist[0]} (${topArtist[1]} of ${products.length} listings)`);
  }
  return lines.join('\n');
}

// Prompt Construction (Doc 009 §8): combine the predefined template with the
// prepared research context. Deterministic for the same input; never modifies
// the underlying research data. Output sections follow the seller review
// specification (RESEARCH-IMPROVEMENTS-PLAN.md R3).
export function buildAnalysisPrompt(
  keyword: string,
  products: AnalysisProduct[],
  context: AnalysisContext = { productType: 'All Departments', sortOrder: 'top selling' },
): string {
  const rankNote =
    context.sortOrder === 'top selling'
      ? 'Results were sorted by TOP SELLING, so each product\'s "rank" is its demand position — rank 1 is the best-selling result for this search. Weight your analysis toward lower ranks (the proven winners).'
      : `Results were sorted by "${context.sortOrder}"; rank reflects display order, not sales.`;

  const velocity = context.trendVelocity;
  const velocityBlock = velocity
    ? [
        '',
        'Trend velocity (top-selling set compared against a recent-uploads sample):',
        `- Recent uploads sampled: ${velocity.recentSampleSize}`,
        `- Top sellers that are recent uploads: ${velocity.freshTopSellerCount} (${velocity.freshTopSellerPct}% of top sellers) — high means the niche is rising fast`,
        `- Recent uploads by incumbent top-selling artists: ${velocity.incumbentUploadPct}% — high means incumbents are defending the niche`,
        `- New artists entering recently: ${velocity.newEntrantArtists}`,
        'Factor this into the Saturation Verdict and note the trend direction.',
      ]
    : [];

  return [
    'You are a senior print-on-demand market analyst advising a Redbubble seller.',
    `The seller's target product category is: ${context.productType}.`,
    `Marketplace data below was collected from Redbubble for the search keyword "${keyword}".`,
    rankNote,
    '',
    'Market aggregates (computed from the data):',
    marketSummary(products),
    ...velocityBlock,
    '',
    'Produce a structured research analysis with exactly these sections:',
    '1. Niche Summary',
    '2. Design Briefs — 3 to 5 concrete, differentiated design ideas the seller could produce, each with subject, style, and text/typography direction',
    '3. Recommended Tags — 15 to 25 tags ranked by frequency among the top-ranked products, one per line',
    '4. Title Formulas — the title structures used by the winners, as reusable patterns',
    '5. Saturation Verdict — exactly one of: ENTER / ENTER WITH DIFFERENT ANGLE / SKIP, followed by your reasoning',
    '6. Differentiation Strategy — how to stand apart from the current top sellers listed below',
    '7. Buyer Intent & Trends — who buys this and what is trending, briefly',
    '',
    'Base every observation only on the data provided. Be specific and concise.',
    '',
    `Collected products (${products.length} total, ordered by rank):`,
    JSON.stringify(prepareContext(products), null, 2),
  ].join('\n');
}
