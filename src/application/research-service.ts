import { join } from 'node:path';
import type { Logger } from 'pino';
import { createResearchRunner, type ProgressStage } from '../research/bootstrap';
import type { ResearchResult } from '../research/engine';
import type { AppSettings } from './settings';

const DATABASE_FILE_NAME = 'marketplace-research-lab.db';

// Application-level workflow execution (Doc 005 §4.2): translates the user's
// research command into a Research Engine run using the current settings and
// the documented local data directories. Each run owns its runner (and thus
// its database connection), so settings changes apply to the next run without
// restart.
export async function runResearch(
  rootDirectory: string,
  rawKeyword: string,
  settings: AppSettings,
  logger: Logger,
  onProgress?: (stage: ProgressStage) => void,
): Promise<ResearchResult> {
  const runner = createResearchRunner({
    databaseFilePath: join(rootDirectory, 'storage', DATABASE_FILE_NAME),
    reportsDirectory: join(rootDirectory, 'reports'),
    marketplace: 'Redbubble',
    aiProvider: settings.ai.provider,
    aiModel: settings.ai.model,
    aiApiKey: settings.ai.apiKey,
    logger,
    onProgress,
  });
  try {
    return await runner.research(rawKeyword);
  } finally {
    runner.close();
  }
}
