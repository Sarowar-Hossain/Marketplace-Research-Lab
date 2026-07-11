import type { Page } from 'playwright';
import type { Logger } from 'pino';

const REDBUBBLE_SEARCH_URL = 'https://www.redbubble.com/shop';

// Performs the Marketplace Search stage (Doc 008 §6): navigate the provided
// page to the Redbubble search results for an already-validated keyword and
// wait until the page has loaded. No product information is read here.
// The keyword is assumed to be validated by an earlier stage.
export async function searchKeyword(page: Page, keyword: string, logger: Logger): Promise<void> {
  logger.info({ operation: 'search' }, 'Search started');
  try {
    const url = `${REDBUBBLE_SEARCH_URL}?query=${encodeURIComponent(keyword)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    logger.info({ operation: 'search' }, 'Search completed');
  } catch (error) {
    logger.error(
      { operation: 'search', error: error instanceof Error ? error.message : String(error) },
      'Search failed',
    );
    throw error;
  }
}
