import type { Logger } from 'pino';
import { launchBrowser, closeBrowser } from './browser';
import { searchKeyword, type SearchOptions, type SortOrder } from './search';
import { discoverProducts } from './discovery';
import { extractProduct, type ExtractedProduct } from './extraction';
import { validateProduct } from './validation';
import { normalizeProduct, type NormalizedProduct } from './normalization';

const DEFAULT_NAVIGATION_TIMEOUT_MS = 30000;

// Polite pacing between product-page visits (seller review §11): a research
// session is one search plus a few dozen product pages, not a crawl.
const PAGE_DELAY_MIN_MS = 800;
const PAGE_DELAY_MAX_MS = 1500;

// Product categories verified live against the search results title
// (2026-07-12). Posters had no verifiable code and is deliberately absent.
export const PRODUCT_CATEGORIES: { label: string; iaCode: string }[] = [
  { label: 'All Departments', iaCode: 'all-departments' },
  { label: 'T-Shirts', iaCode: 'u-tees' },
  { label: 'Stickers', iaCode: 'all-stickers' },
  { label: 'Hoodies & Sweatshirts', iaCode: 'u-sweatshirts' },
  { label: 'Mugs', iaCode: 'u-mugs' },
  { label: 'Phone Cases', iaCode: 'u-phone-cases' },
];

export const SORT_ORDERS: SortOrder[] = ['top selling', 'relevant', 'recent'];

export type { SearchOptions, SortOrder };

// Progress stages reported to the caller as each pipeline phase begins. The
// Research Engine maps these onto session lifecycle statuses; the UI uses
// them for progress display.
export type CollectionStage = 'searching' | 'discovering' | 'extracting' | 'normalizing';

function pageDelay(): Promise<void> {
  const ms = PAGE_DELAY_MIN_MS + Math.random() * (PAGE_DELAY_MAX_MS - PAGE_DELAY_MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Marketplace collection facade: runs the complete data collection stages
// (Doc 008 §6–§11) for one already-validated keyword and returns only domain
// objects. A single browser instance is used for the whole run and is closed
// even when collection fails (Doc 008 §16). No Playwright object leaves this
// module.
//
// Failure behavior (Doc 008 §13): a search failure aborts collection and is
// rethrown; a per-product extraction failure skips that product and continues.
// Invalid products are skipped by validation. Both skip paths are already
// logged by the underlying stages.
export async function collectProducts(
  keyword: string,
  logger: Logger,
  options: SearchOptions = {},
  onStage?: (stage: CollectionStage) => void,
): Promise<NormalizedProduct[]> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(DEFAULT_NAVIGATION_TIMEOUT_MS);
    page.setDefaultTimeout(DEFAULT_NAVIGATION_TIMEOUT_MS);

    onStage?.('searching');
    await searchKeyword(page, keyword, logger, options);

    onStage?.('discovering');
    let references = await discoverProducts(page, logger);
    if (options.maxProducts !== undefined && options.maxProducts > 0) {
      references = references.slice(0, options.maxProducts);
    }

    onStage?.('extracting');
    const extracted: { product: ExtractedProduct; rank: number }[] = [];
    for (const reference of references) {
      try {
        extracted.push({ product: await extractProduct(page, reference.url, logger), rank: reference.rank });
      } catch {
        // Extraction failure is recoverable per product: the stage has already
        // logged it; continue with the remaining products.
      }
      await pageDelay();
    }

    onStage?.('normalizing');
    const products: NormalizedProduct[] = [];
    for (const { product, rank } of extracted) {
      const validation = validateProduct(product, logger);
      if (!validation.valid) {
        continue;
      }
      products.push({ ...normalizeProduct(validation.product), rank });
    }

    return products;
  } finally {
    await closeBrowser(browser);
  }
}
