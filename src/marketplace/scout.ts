import type { Logger } from 'pino';
import { launchBrowser, closeBrowser } from './browser';
import { searchKeyword, type SearchOptions } from './search';
import { discoverProducts } from './discovery';
import { artistFromUrl } from './extraction';

// A lightweight scout result: search-page-level data only.
export type ScoutedProduct = {
  url: string;
  rank: number;
  artistName: string | null;
};

// URL-only scout pass: search + discovery, no product-page visits. Used for
// trend-velocity sampling where the needed signals (URL identity and the
// artist from the "-by-<artist>/" slug) are all present in the result links.
// One page load total — far lighter than a full collection run.
export async function scoutProducts(
  keyword: string,
  logger: Logger,
  options: SearchOptions = {},
): Promise<ScoutedProduct[]> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);
    await searchKeyword(page, keyword, logger, options);
    const references = await discoverProducts(page, logger);
    return references.map((reference) => ({
      url: reference.url,
      rank: reference.rank,
      artistName: artistFromUrl(reference.url),
    }));
  } finally {
    await closeBrowser(browser);
  }
}
