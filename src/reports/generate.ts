import type { StoredSession, StoredProduct, StoredAnalysis } from '../storage/research-data';

// Input for report generation (Doc 010 §3): everything must already exist.
// `generatedAt` is supplied by the caller so generation stays deterministic
// for identical input (Doc 010 §2).
export type ReportData = {
  projectName: string;
  session: StoredSession;
  products: StoredProduct[];
  analysis: StoredAnalysis;
  generatedAt: string;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Market Metrics: seller go/no-go numbers, aggregated at generation time from
// the stored rows (pure presentation aggregation — sources never modified).
function metricsSection(products: StoredProduct[]): string {
  const prices = products.map((p) => p.price).filter((p): p is number => p !== null);
  const artists = new Map<string, number>();
  for (const product of products) {
    if (product.artistName) {
      artists.set(product.artistName, (artists.get(product.artistName) ?? 0) + 1);
    }
  }
  const topArtist = [...artists.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const designCounts = products
    .map((p) => p.statistics?.artistDesignCount)
    .filter((c): c is number => typeof c === 'number');

  const rows = [
    ['Products Analyzed', String(products.length)],
    prices.length > 0 ? ['Price Min / Median / Max', `${Math.min(...prices)} / ${median(prices)} / ${Math.max(...prices)}`] : null,
    ['Unique Artists', String(artists.size)],
    topArtist
      ? ['Top Artist Share', `${escapeHtml(topArtist[0])} — ${topArtist[1]} of ${products.length} listings (${Math.round((topArtist[1] / products.length) * 100)}%)`]
      : null,
    designCounts.length > 0
      ? ['Avg Artist Portfolio Size', `${Math.round(designCounts.reduce((a, b) => a + b, 0) / designCounts.length)} designs`]
      : null,
  ].filter((row): row is [string, string] => row !== null);

  return `<section>
  <h2>Market Metrics</h2>
  <dl>${rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${v}</dd>`).join('')}</dl>
</section>`;
}

function productCard(product: StoredProduct): string {
  const details = [
    product.artistName ? `<dt>Artist</dt><dd>${escapeHtml(product.artistName)}</dd>` : '',
    product.statistics?.artistDesignCount != null
      ? `<dt>Artist Portfolio</dt><dd>${escapeHtml(String(product.statistics.artistDesignCount))} designs</dd>`
      : '',
    product.productType ? `<dt>Type</dt><dd>${escapeHtml(product.productType)}</dd>` : '',
    product.price !== null
      ? `<dt>Price</dt><dd>${escapeHtml(String(product.price))}${product.currency ? ` ${escapeHtml(product.currency)}` : ''}</dd>`
      : '',
    product.statistics?.availableProducts != null
      ? `<dt>Available On</dt><dd>${escapeHtml(String(product.statistics.availableProducts))} products</dd>`
      : '',
    product.statistics?.favorites != null
      ? `<dt>Favorites</dt><dd>${escapeHtml(String(product.statistics.favorites))}</dd>`
      : '',
  ].join('');
  const rankBadge =
    product.statistics?.rank != null ? `<span class="rank">#${product.statistics.rank}</span> ` : '';

  // Only locally stored images are referenced so the report stays viewable
  // offline (Doc 010 §9); products without a downloaded image show none.
  // Paths are stored relative to the application root ("images/<file>"), and
  // the report lives one level down in reports/, hence the "../" prefix.
  const localImage = product.images.find((image) => image.localPath !== null);
  const localPath = localImage?.localPath as string | undefined;
  const imageSrc = localPath ? (/^([a-zA-Z]:|\/)/.test(localPath) ? localPath : `../${localPath}`) : null;
  const imageHtml = imageSrc
    ? `<img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(product.title)}" loading="lazy">`
    : '';

  const tagsHtml = product.tags.length
    ? `<ul class="tags">${product.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>`
    : '';

  return `<article class="product">
  ${imageHtml}
  <h3>${rankBadge}<a href="${escapeHtml(product.productUrl)}">${escapeHtml(product.title)}</a></h3>
  <dl>${details}</dl>
  ${tagsHtml}
</article>`;
}

// Generates the standalone HTML report (Doc 010 §4, §6): report header,
// research summary, product list in collection order, and the AI analysis
// presented verbatim. Pure transformation — never modifies source data
// (Doc 010 §12); no external resources are referenced (§4 offline).
export function generateReportHtml(data: ReportData): string {
  if (data.products.length === 0) {
    throw new Error('Report generation requires product data');
  }
  if (!data.analysis.response || data.analysis.response.trim().length === 0) {
    throw new Error('Report generation requires an AI analysis');
  }

  const { session, analysis } = data;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(data.projectName)} — ${escapeHtml(session.keyword)}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0 auto; max-width: 60rem; padding: 2rem 1rem; color: #1a1a1a; line-height: 1.5; }
  header, section { margin-bottom: 2.5rem; }
  h1 { font-size: 1.6rem; } h2 { font-size: 1.25rem; border-bottom: 1px solid #ddd; padding-bottom: .4rem; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: .2rem 1rem; margin: .5rem 0; }
  dt { font-weight: 600; } dd { margin: 0; }
  .product { border: 1px solid #e2e2e2; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
  .product img { max-width: 12rem; height: auto; border-radius: 4px; }
  .tags { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: .35rem; }
  .tags li { background: #f0f0f0; border-radius: 999px; padding: .1rem .6rem; font-size: .85rem; }
  .rank { display: inline-block; background: #1d4ed8; color: #fff; border-radius: 6px; padding: 0 .45rem; font-size: .85rem; }
  .analysis { white-space: pre-wrap; background: #fafafa; border: 1px solid #e2e2e2; border-radius: 8px; padding: 1rem; }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(data.projectName)}</h1>
  <dl>
    <dt>Keyword</dt><dd>${escapeHtml(session.keyword)}</dd>
    <dt>Marketplace</dt><dd>${escapeHtml(session.marketplace)}</dd>
    ${session.productType ? `<dt>Product Type</dt><dd>${escapeHtml(session.productType)}</dd>` : ''}
    ${session.sortOrder ? `<dt>Sort Order</dt><dd>${escapeHtml(session.sortOrder)}</dd>` : ''}
    <dt>Generated</dt><dd>${escapeHtml(data.generatedAt)}</dd>
    <dt>AI Provider</dt><dd>${escapeHtml(session.aiProvider)}</dd>
    <dt>AI Model</dt><dd>${escapeHtml(session.aiModel)}</dd>
  </dl>
</header>
<section>
  <h2>Research Summary</h2>
  <dl>
    <dt>Keyword</dt><dd>${escapeHtml(session.keyword)}</dd>
    <dt>Products Collected</dt><dd>${data.products.length}</dd>
    <dt>Status</dt><dd>${escapeHtml(session.status)}</dd>
  </dl>
</section>
${metricsSection(data.products)}
<section>
  <h2>Products (${data.products.length})</h2>
  ${data.products.map(productCard).join('\n')}
</section>
<section>
  <h2>AI Analysis</h2>
  <div class="analysis">${escapeHtml(analysis.response)}</div>
</section>
</body>
</html>
`;
}
