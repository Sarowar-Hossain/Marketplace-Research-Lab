import type { Logger } from 'pino';
import { validateKeyword } from './keyword';
import {
  createResearchSession,
  updateSessionStatus,
  completeResearchSession,
  failResearchSession,
  type ResearchSession,
} from './session';

// Structural shape of a collected product. Matches the Marketplace
// NormalizedProduct and the Storage ProductInput, so the engine never imports
// either module — dependencies stay injected and boundary-free.
export type CollectedProduct = {
  url: string;
  title: string;
  description: string | null;
  artistName: string | null;
  productType: string | null;
  price: number | null;
  currency: string | null;
  imageUrls: string[];
  tags: string[];
  availableProducts?: number | null;
  artistDesignCount?: number | null;
  rank?: number | null;
};

// What to search: category filter + sort order (label is stored on the
// session; iaCode is the marketplace parameter).
export type ResearchSearchOptions = {
  productTypeLabel: string;
  iaCode: string;
  sortOrder: string;
};

// Progress stages emitted by the Marketplace collection facade (structural
// mirror of the facade's CollectionStage — the engine imports nothing from
// Marketplace).
export type CollectionStage = 'searching' | 'discovering' | 'extracting' | 'normalizing';

// Everything the engine needs is injected by the composition layer: config
// values (Doc 011 §11), the Marketplace collector facade, and a persistence
// closure that already carries its database connection. The engine never sees
// Playwright or SQLite objects (Doc 004 §21).
// The completed AI analysis handed back by the injected analyzer (structural
// mirror of the AI module's result type).
export type AnalysisResult = {
  prompt: string;
  response: string;
};

export type ResearchDependencies = {
  marketplace: string;
  aiProvider: string;
  aiModel: string;
  searchOptions: ResearchSearchOptions;
  logger: Logger;
  collectProducts: (
    keyword: string,
    logger: Logger,
    onStage?: (stage: CollectionStage) => void,
  ) => Promise<CollectedProduct[]>;
  saveResearchData: (session: ResearchSession, products: CollectedProduct[]) => unknown;
  analyzeProducts: (keyword: string, products: CollectedProduct[], logger: Logger) => Promise<AnalysisResult>;
  saveAiAnalysis: (sessionId: string, analysis: AnalysisResult) => unknown;
  finalizeSession: (sessionId: string, status: string, completedAt: string | null) => unknown;
  downloadImages: (sessionId: string) => Promise<number>;
  generateReport: (sessionId: string) => { reportPath: string };
};

export type ResearchResult =
  | { ok: true; session: ResearchSession; productsSaved: number; reportPath: string }
  | { ok: false; reason: 'invalid-keyword'; detail: string };

// Research Engine workflow (Doc 005 §4.3, Doc 008): validate the keyword,
// run Marketplace collection, and persist the completed session. Invalid user
// input returns a result without creating a session; infrastructure failures
// mark the session failed and are rethrown for the caller to handle.
export async function research(rawKeyword: string, deps: ResearchDependencies): Promise<ResearchResult> {
  const { logger } = deps;

  const validation = validateKeyword(rawKeyword);
  if (!validation.valid) {
    logger.warn({ operation: 'research', reason: validation.reason }, 'Invalid keyword');
    return { ok: false, reason: 'invalid-keyword', detail: validation.reason };
  }
  logger.info({ operation: 'research' }, 'Keyword validated');

  let session = createResearchSession(
    validation.keyword,
    deps.marketplace,
    deps.aiProvider,
    deps.aiModel,
    deps.searchOptions.productTypeLabel,
    deps.searchOptions.sortOrder,
  );
  logger.info({ operation: 'research', sessionId: session.id }, 'Research session created');

  // The facade reports each collection phase as it begins, so lifecycle
  // transitions reflect what is actually happening (Doc 004 §5).
  const stageToStatus = {
    searching: 'searching',
    discovering: 'collecting',
    extracting: 'extracting',
    normalizing: 'normalizing',
  } as const;

  let products: CollectedProduct[];
  try {
    session = updateSessionStatus(session, 'searching');
    products = await deps.collectProducts(validation.keyword, logger, (stage) => {
      session = updateSessionStatus(session, stageToStatus[stage]);
    });

    // Collected data is persisted before AI analysis runs so an AI failure can
    // never lose it (Doc 009 §13). The row carries 'analyzing' until finalized.
    session = updateSessionStatus(session, 'analyzing');
    deps.saveResearchData(session, products);
  } catch (error) {
    // Nothing was persisted (a failed save rolls back atomically in Storage).
    session = failResearchSession(session);
    logger.error(
      { operation: 'research', sessionId: session.id, error: error instanceof Error ? error.message : String(error) },
      'Research session failed',
    );
    throw error;
  }

  try {
    const analysis = await deps.analyzeProducts(validation.keyword, products, logger);
    deps.saveAiAnalysis(session.id, analysis);

    session = completeResearchSession(session);
    deps.finalizeSession(session.id, session.status, session.completedAt);
    logger.info(
      { operation: 'research', sessionId: session.id, productCount: products.length },
      'Research session completed',
    );
  } catch (error) {
    // AI or finalization failure: the collected marketplace data stays intact;
    // only the session outcome is updated (Doc 009 §13, Doc 012 §8).
    session = failResearchSession(session);
    deps.finalizeSession(session.id, session.status, session.completedAt);
    logger.error(
      { operation: 'research', sessionId: session.id, error: error instanceof Error ? error.message : String(error) },
      'Research session failed',
    );
    throw error;
  }

  // Image download is best-effort (Doc 004 §10 download status is per-image):
  // a failure never affects the completed session — the report simply renders
  // without the affected images.
  try {
    await deps.downloadImages(session.id);
  } catch (error) {
    logger.warn(
      { operation: 'research', sessionId: session.id, error: error instanceof Error ? error.message : String(error) },
      'Image download failed',
    );
  }

  // Report generation runs after completion because a report requires a
  // completed session (Doc 004 §20). A report failure stops only the report
  // stage (Doc 010 §11) — the completed session, its data, and analysis all
  // remain intact, and no report record is created.
  try {
    const report = deps.generateReport(session.id);
    logger.info({ operation: 'research', sessionId: session.id, reportPath: report.reportPath }, 'Report saved');
    return { ok: true, session, productsSaved: products.length, reportPath: report.reportPath };
  } catch (error) {
    logger.error(
      { operation: 'research', sessionId: session.id, error: error instanceof Error ? error.message : String(error) },
      'Report generation failed',
    );
    throw error;
  }
}
