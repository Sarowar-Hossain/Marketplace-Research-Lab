import type { Logger } from 'pino';
import { launchBrowser, closeBrowser } from './browser';
import { searchKeyword } from './search';
import { discoverProducts } from './discovery';
import { extractProduct, type ExtractedProduct } from './extraction';
import { validateProduct } from './validation';
import { normalizeProduct, type NormalizedProduct } from './normalization';

const DEFAULT_NAVIGATION_TIMEOUT_MS = 30000;

// Progress stages reported to the caller as each pipeline phase begins. The
// Research Engine maps these onto session lifecycle statuses; the future UI
// can use them for progress display.
export type CollectionStage = 'searching' | 'discovering' | 'extracting' | 'normalizing';

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
  onStage?: (stage: CollectionStage) => void,
): Promise<NormalizedProduct[]> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(DEFAULT_NAVIGATION_TIMEOUT_MS);
    page.setDefaultTimeout(DEFAULT_NAVIGATION_TIMEOUT_MS);

    onStage?.('searching');
    await searchKeyword(page, keyword, logger);

    onStage?.('discovering');
    const references = await discoverProducts(page, logger);

    onStage?.('extracting');
    const extracted: ExtractedProduct[] = [];
    for (const reference of references) {
      try {
        extracted.push(await extractProduct(page, reference.url, logger));
      } catch {
        // Extraction failure is recoverable per product: the stage has already
        // logged it; continue with the remaining products.
        continue;
      }
    }

    onStage?.('normalizing');
    const products: NormalizedProduct[] = [];
    for (const product of extracted) {
      const validation = validateProduct(product, logger);
      if (!validation.valid) {
        continue;
      }
      products.push(normalizeProduct(validation.product));
    }

    return products;
  } finally {
    await closeBrowser(browser);
  }
}
