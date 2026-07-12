import type { Page } from 'playwright';
import type { Logger } from 'pino';

const REDBUBBLE_SEARCH_URL = 'https://www.redbubble.com/shop';

// Results render client-side, so "fully loaded" (Doc 008 §6) means product
// links are present in the DOM. The URL-pattern selector matches discovery's
// strategy and avoids fragile CSS classes.
const RESULTS_SELECTOR = 'a[href*="/i/"]';
const DEFAULT_RESULTS_TIMEOUT_MS = 20000;

// Performs the Marketplace Search stage (Doc 008 §6): navigate the provided
// page to the Redbubble search results for an already-validated keyword and
// wait until product links have rendered. No product information is read here.
// A keyword with no results completes with a warning; a bot-protection
// challenge page fails the search (Doc 008 §13).
export async function searchKeyword(
  page: Page,
  keyword: string,
  logger: Logger,
  resultsTimeoutMs: number = DEFAULT_RESULTS_TIMEOUT_MS,
): Promise<void> {
  logger.info({ operation: 'search' }, 'Search started');
  try {
    const url = `${REDBUBBLE_SEARCH_URL}?query=${encodeURIComponent(keyword)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForSelector(RESULTS_SELECTOR, { timeout: resultsTimeoutMs });
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
