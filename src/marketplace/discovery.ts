import type { Page } from 'playwright';
import type { Logger } from 'pino';

// A discovered product reference. Kept internal to the Marketplace module until
// another module actually requires it.
export type ProductReference = {
  url: string;
};

// Redbubble product pages live under an "/i/" path segment. Discovery relies on
// this URL pattern only, not on fragile CSS classes or UI structure.
const PRODUCT_PATH_PATTERN = /\/i\//;

// Reduces a product URL to a canonical identity for duplicate detection:
// absolute URL without query string or fragment (Doc 008 §15). Returns null for
// non-product or unparseable URLs. No further normalization is performed.
function canonicalizeProductUrl(href: string): string | null {
  try {
    const url = new URL(href);
    if (!PRODUCT_PATH_PATTERN.test(url.pathname)) {
      return null;
    }
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

// Product Discovery stage (Doc 008 §7): read the already-loaded search results
// page, collect unique product URLs by pattern, and return product references.
// No product information is extracted here.
export async function discoverProducts(page: Page, logger: Logger): Promise<ProductReference[]> {
  const hrefs = await page.$$eval('a', (anchors) =>
    anchors.map((anchor) => (anchor as HTMLAnchorElement).href),
  );

  const seen = new Set<string>();
  const products: ProductReference[] = [];
  for (const href of hrefs) {
    const canonical = canonicalizeProductUrl(href);
    if (canonical === null || seen.has(canonical)) {
      continue;
    }
    seen.add(canonical);
    products.push({ url: canonical });
  }

  logger.info({ operation: 'discovery', count: products.length }, 'Products Discovered');
  return products;
}
