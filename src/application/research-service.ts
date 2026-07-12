import { join } from 'node:path';
import type { Logger } from 'pino';
import {
  createResearchRunner,
  loadResearchResult as loadSessionResearch,
  type ProgressStage,
} from '../research/bootstrap';
import type { ResearchResult } from '../research/engine';
import type { SortOrder } from '../marketplace/collect';
import type { AppSettings } from './settings';

const DATABASE_FILE_NAME = 'marketplace-research-lab.db';

// A research request as issued from the UI: the keyword plus the search scope
// (category iaCode and sort order).
export type ResearchRequest = {
  keyword: string;
  productTypeIaCode?: string;
  sortOrder?: SortOrder;
};

// Application-level workflow execution (Doc 005 §4.2): translates the user's
// research command into a Research Engine run using the current settings and
// the documented local data directories. Each run owns its runner (and thus
// its database connection), so settings changes apply to the next run without
// restart.
export async function runResearch(
  rootDirectory: string,
  request: ResearchRequest,
  settings: AppSettings,
  logger: Logger,
  onProgress?: (stage: ProgressStage) => void,
): Promise<ResearchResult> {
  const runner = createResearchRunner({
    databaseFilePath: join(rootDirectory, 'storage', DATABASE_FILE_NAME),
    reportsDirectory: join(rootDirectory, 'reports'),
    imagesDirectory: join(rootDirectory, 'images'),
    marketplace: 'Redbubble',
    aiProvider: settings.ai.provider,
    aiModel: settings.ai.model,
    aiApiKey: settings.ai.apiKey,
    logger,
    onProgress,
    productTypeIaCode: request.productTypeIaCode,
    sortOrder: request.sortOrder,
  });
  try {
    return await runner.research(request.keyword);
  } finally {
    runner.close();
  }
}

// Multi-keyword comparison (scout pass): same runner wiring, capped
// collection, one comparative AI call, standalone comparison report.
export async function runKeywordComparison(
  rootDirectory: string,
  request: { keywords: string[]; productTypeIaCode?: string; sortOrder?: SortOrder },
  settings: AppSettings,
  logger: Logger,
  onProgress?: (stage: ProgressStage) => void,
) {
  const runner = createResearchRunner({
    databaseFilePath: join(rootDirectory, 'storage', DATABASE_FILE_NAME),
    reportsDirectory: join(rootDirectory, 'reports'),
    imagesDirectory: join(rootDirectory, 'images'),
    marketplace: 'Redbubble',
    aiProvider: settings.ai.provider,
    aiModel: settings.ai.model,
    aiApiKey: settings.ai.apiKey,
    logger,
    onProgress,
    productTypeIaCode: request.productTypeIaCode,
    sortOrder: request.sortOrder,
  });
  try {
    return await runner.compare(request.keywords);
  } finally {
    runner.close();
  }
}

// Loads a completed session's stored data for in-app rendering. Application
// delegates to the Research Engine, which owns Storage access (Doc 005 §8:
// Application → Research Engine → Storage).
export function loadResearchResult(
  rootDirectory: string,
  sessionId: string,
  logger: Logger,
) {
  return loadSessionResearch(join(rootDirectory, 'storage', DATABASE_FILE_NAME), sessionId, logger);
}
