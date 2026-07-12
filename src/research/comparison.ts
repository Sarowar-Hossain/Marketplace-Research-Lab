import type { Database } from 'better-sqlite3';
import type { Logger } from 'pino';
import { collectProducts, type SortOrder } from '../marketplace/collect';
import { saveResearchData } from '../storage/persistence';
import type { AiProvider } from '../ai/provider';
import { buildComparisonPrompt, computeKeywordMetrics, type ComparisonEntry, type KeywordMetrics } from '../ai/comparison-prompt';
import { generateComparisonHtml } from '../reports/comparison';
import { saveReportFile } from '../reports/save';
import { validateKeyword } from './keyword';
import { createResearchSession, completeResearchSession } from './session';

// Scout pass over the top of the ranking: deep enough for patterns, shallow
// enough to stay fast and polite (seller decision: top 20–40 is the market).
const DEFAULT_MAX_PRODUCTS_PER_KEYWORD = 24;
const MAX_KEYWORDS = 5;
const BETWEEN_KEYWORDS_DELAY_MS = 3000;

export type ComparisonParams = {
  db: Database;
  keywords: string[];
  marketplace: string;
  productTypeLabel: string;
  iaCode: string;
  sortOrder: SortOrder;
  aiProvider: AiProvider;
  reportsDirectory: string;
  logger: Logger;
  onProgress?: (stage: string) => void;
  maxProductsPerKeyword?: number;
};

export type ComparisonResult = {
  reportPath: string;
  keywords: KeywordMetrics[];
  skippedKeywords: string[];
};

// Multi-keyword comparison (seller workflow step 3: long-tail research).
// Each keyword runs the normal collection pipeline capped to the top of the
// ranking and is persisted as its own research session (the data is real
// research data); the comparison itself is a decision artifact and exists as
// a standalone HTML report only. One comparative AI call covers all keywords.
export async function runComparison(params: ComparisonParams): Promise<ComparisonResult> {
  const { db, logger } = params;
  const maxProducts = params.maxProductsPerKeyword ?? DEFAULT_MAX_PRODUCTS_PER_KEYWORD;

  const keywords = params.keywords.slice(0, MAX_KEYWORDS);
  const entries: ComparisonEntry[] = [];
  const skippedKeywords: string[] = [];

  logger.info({ operation: 'comparison', keywords: keywords.length }, 'Comparison started');
  for (const rawKeyword of keywords) {
    const validation = validateKeyword(rawKeyword);
    if (!validation.valid) {
      skippedKeywords.push(rawKeyword);
      logger.warn({ operation: 'comparison', keyword: rawKeyword, reason: validation.reason }, 'Keyword skipped');
      continue;
    }

    params.onProgress?.('comparing');
    const products = await collectProducts(
      validation.keyword,
      logger,
      { iaCode: params.iaCode, sortOrder: params.sortOrder, maxProducts },
      (stage) => params.onProgress?.(stage),
    );
    if (products.length === 0) {
      skippedKeywords.push(validation.keyword);
      logger.warn({ operation: 'comparison', keyword: validation.keyword }, 'Keyword skipped');
      continue;
    }

    // The scout pass has no AI step for the individual keyword, so the session
    // is complete once its data is stored.
    const session = completeResearchSession(
      createResearchSession(
        validation.keyword,
        params.marketplace,
        'comparison',
        'comparison',
        params.productTypeLabel,
        params.sortOrder,
      ),
    );
    saveResearchData(db, session, products, logger);
    entries.push({ keyword: validation.keyword, products });

    await new Promise((resolve) => setTimeout(resolve, BETWEEN_KEYWORDS_DELAY_MS));
  }

  if (entries.length === 0) {
    throw new Error('Comparison requires at least one keyword with results');
  }

  params.onProgress?.('analyzing');
  logger.info({ operation: 'comparison' }, 'AI request started');
  const analysis = await params.aiProvider.sendPrompt(buildComparisonPrompt(entries, params.productTypeLabel));
  if (analysis.trim().length === 0) {
    logger.error({ operation: 'comparison' }, 'AI request failed');
    throw new Error('Comparative analysis response was empty');
  }
  logger.info({ operation: 'comparison' }, 'AI response received');

  params.onProgress?.('generating-report');
  const html = generateComparisonHtml({
    projectName: 'Marketplace Research Lab',
    productType: params.productTypeLabel,
    sortOrder: params.sortOrder,
    generatedAt: new Date().toISOString(),
    keywords: entries.map((entry) => ({
      metrics: computeKeywordMetrics(entry),
      topProducts: entry.products.slice(0, 5).map((p) => ({
        rank: p.rank ?? null,
        title: p.title,
        artistName: p.artistName,
        price: p.price,
        currency: p.currency,
        url: p.url,
      })),
    })),
    skippedKeywords,
    analysis,
  });
  const fileName = `comparison-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
  const reportPath = saveReportFile(html, params.reportsDirectory, fileName);

  logger.info({ operation: 'comparison', reportPath }, 'Comparison completed');
  return { reportPath, keywords: entries.map(computeKeywordMetrics), skippedKeywords };
}
