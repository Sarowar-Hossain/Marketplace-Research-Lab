import type { Page } from 'playwright';
import type { Logger } from 'pino';

const REDBUBBLE_SEARCH_URL = 'https://www.redbubble.com/shop';

// Results render client-side, so "fully loaded" (Doc 008 §6) means product
// links are present in the DOM. The URL-pattern selector matches discovery's
// strategy and avoids fragile CSS classes.
const RESULTS_SELECTOR = 'a[href*="/i/"]';
const DEFAULT_RESULTS_TIMEOUT_MS = 20000;

export type SortOrder = 'top selling' | 'relevant' | 'recent';

export type SearchOptions = {
  // Category filter code (live-verified 2026-07-12: all-departments, u-tees,
  // all-stickers, u-sweatshirts, u-mugs, u-phone-cases).
  iaCode?: string;
  // Research default is "top selling": the goal is to analyze what sells,
  // not what exists (seller review decision #5).
  sortOrder?: SortOrder;
  resultsTimeoutMs?: number;
  // Caps how many discovered products are extracted. Used by comparison mode
  // (scout pass over the top of the ranking); unset = all discovered products.
  maxProducts?: number;
};

// Builds the search URL in the live-verified parameter format:
// /shop?iaCode=<code>&sortOrder=<sort>&includeMatureContent=false&query=<kw>
export function buildSearchUrl(keyword: string, options: SearchOptions = {}): string {
  const params = new URLSearchParams();
  params.set('iaCode', options.iaCode ?? 'all-departments');
  params.set('sortOrder', options.sortOrder ?? 'top selling');
  params.set('includeMatureContent', 'false');
  params.set('query', keyword);
  return `${REDBUBBLE_SEARCH_URL}?${params.toString()}`;
}

// Performs the Marketplace Search stage (Doc 008 §6): navigate the provided
// page to the Redbubble search results for an already-validated keyword and
// wait until product links have rendered. No product information is read here.
// A keyword with no results completes with a warning; a bot-protection
// challenge page fails the search (Doc 008 §13).
export async function searchKeyword(
  page: Page,
  keyword: string,
  logger: Logger,
  options: SearchOptions = {},
): Promise<void> {
  logger.info(
    { operation: 'search', iaCode: options.iaCode ?? 'all-departments', sortOrder: options.sortOrder ?? 'top selling' },
    'Search started',
  );
  try {
    await page.goto(buildSearchUrl(keyword, options), { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForSelector(RESULTS_SELECTOR, { timeout: options.resultsTimeoutMs ?? DEFAULT_RESULTS_TIMEOUT_MS });
    } catch {
      const blocked = await page.evaluate(() =>
        /just a moment|cf-chl|challenge-platform|captcha/i.test(
          `${document.title} ${document.documentElement.innerHTML.slice(0, 5000)}`,
        ),
      );
      if (blocked) {
        throw new Error('Search blocked by bot protection challenge');
      }
      logger.warn({ operation: 'search' }, 'Search results contained no product links');
    }
    logger.info({ operation: 'search' }, 'Search completed');
  } catch (error) {
    logger.error(
      { operation: 'search', error: error instanceof Error ? error.message : String(error) },
      'Search failed',
    );
    throw error;
  }
}
