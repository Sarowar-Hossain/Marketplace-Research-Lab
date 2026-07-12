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
};

// Long descriptions add cost without analytical value; truncation keeps the
// prompt bounded while staying deterministic for the same input.
const MAX_DESCRIPTION_LENGTH = 300;

// Context Preparation (Doc 009 §7): organize collected products into a
// consistent structure containing only business data.
function prepareContext(products: AnalysisProduct[]): object[] {
  return products.map((product) => ({
    title: product.title,
    artist: product.artistName,
    productType: product.productType,
    price: product.price,
    currency: product.currency,
    tags: product.tags,
    description:
      product.description === null ? null : product.description.slice(0, MAX_DESCRIPTION_LENGTH),
  }));
}

// Prompt Construction (Doc 009 §8): combine the predefined template with the
// prepared context. Deterministic for the same input; never modifies the
// underlying research data. The requested sections follow the analysis scope
// defined in the domain model (Doc 004 §14).
export function buildAnalysisPrompt(keyword: string, products: AnalysisProduct[]): string {
  const context = JSON.stringify(prepareContext(products), null, 2);
  return [
    'You are a marketplace research analyst. Analyze the following Redbubble product data',
    `collected for the search keyword "${keyword}".`,
    '',
    'Produce a structured research analysis with exactly these sections:',
    '1. Niche Summary',
    '2. Recurring Themes',
    '3. Keyword Opportunities',
    '4. Buyer Intent',
    '5. Competition Observations',
    '6. Design Trends',
    '7. Strategic Recommendations',
    '',
    'Base every observation only on the data provided. Be specific and concise.',
    '',
    `Collected products (${products.length} total):`,
    context,
  ].join('\n');
}
