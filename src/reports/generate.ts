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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function productCard(product: StoredProduct): string {
  const details = [
    product.artistName ? `<dt>Artist</dt><dd>${escapeHtml(product.artistName)}</dd>` : '',
    product.productType ? `<dt>Type</dt><dd>${escapeHtml(product.productType)}</dd>` : '',
    product.price !== null
      ? `<dt>Price</dt><dd>${escapeHtml(String(product.price))}${product.currency ? ` ${escapeHtml(product.currency)}` : ''}</dd>`
      : '',
    product.statistics?.favorites != null
      ? `<dt>Favorites</dt><dd>${escapeHtml(String(product.statistics.favorites))}</dd>`
      : '',
  ].join('');

  // Only locally stored images are referenced so the report stays viewable
  // offline (Doc 010 §9); products without a downloaded image show none.
  const localImage = product.images.find((image) => image.localPath !== null);
  const imageHtml = localImage
    ? `<img src="${escapeHtml(localImage.localPath as string)}" alt="${escapeHtml(product.title)}" loading="lazy">`
    : '';

  const tagsHtml = product.tags.length
    ? `<ul class="tags">${product.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>`
    : '';

  return `<article class="product">
  ${imageHtml}
  <h3><a href="${escapeHtml(product.productUrl)}">${escapeHtml(product.title)}</a></h3>
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
  .analysis { white-space: pre-wrap; background: #fafafa; border: 1px solid #e2e2e2; border-radius: 8px; padding: 1rem; }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(data.projectName)}</h1>
  <dl>
    <dt>Keyword</dt><dd>${escapeHtml(session.keyword)}</dd>
    <dt>Marketplace</dt><dd>${escapeHtml(session.marketplace)}</dd>
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
