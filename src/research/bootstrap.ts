import type { Logger } from 'pino';
import { collectProducts, PRODUCT_CATEGORIES, type CollectionStage, type SortOrder } from '../marketplace/collect';
import { initializeDatabase } from '../storage/initialize';
import { closeDatabase, openDatabase } from '../storage/database';
import {
  saveResearchData,
  saveAiAnalysis,
  finalizeResearchSession,
  saveReportMetadata,
} from '../storage/persistence';
import { downloadProductImages } from '../storage/images';
import { loadResearchData, type ResearchData } from '../storage/research-data';
import { createAiProvider } from '../ai/provider';
import { analyzeProducts } from '../ai/analyze';
import { generateReportHtml } from '../reports/generate';
import { saveReportFile } from '../reports/save';
import { scoutProducts } from '../marketplace/scout';
import { research, type ResearchResult } from './engine';
import { runComparison, type ComparisonResult } from './comparison';
import { computeTrendVelocity } from './velocity';

const PROJECT_NAME = 'Marketplace Research Lab';

// Composition layer (Doc 005 §7–§8: Research Engine → Marketplace / AI /
// Storage). Binds the real Marketplace collector, AI provider, and Storage
// persistence into the engine's injected dependencies. All configuration
// values are supplied by the caller — this layer never loads config
// (Doc 011 §11). The future Application layer decides when runners are
// created and closed.
// Progress stages surfaced to the caller (e.g. the UI): the Marketplace
// collection stages plus the post-collection workflow phases.
export type ProgressStage =
  | CollectionStage
  | 'comparing'
  | 'assessing-trend'
  | 'analyzing'
  | 'downloading-images'
  | 'generating-report';

export type ResearchRunnerOptions = {
  databaseFilePath: string;
  reportsDirectory: string;
  imagesDirectory: string;
  marketplace: string;
  aiProvider: string;
  aiModel: string;
  aiApiKey: string;
  logger: Logger;
  onProgress?: (stage: ProgressStage) => void;
  // Search scope: category iaCode + sort order. Defaults: all departments,
  // top selling (research analyzes what sells, not what exists).
  productTypeIaCode?: string;
  sortOrder?: SortOrder;
};

export type ResearchRunner = {
  research: (rawKeyword: string) => Promise<ResearchResult>;
  compare: (rawKeywords: string[]) => Promise<ComparisonResult>;
  close: () => void;
};

// Creates a runner that owns one database connection for its lifetime. The
// persistence closures carry the connection so the engine never sees it
// (Doc 004 §21). No global state — independent runners hold independent
// connections.
export function createResearchRunner(options: ResearchRunnerOptions): ResearchRunner {
  const db = initializeDatabase(options.databaseFilePath, options.logger);
  const aiProvider = createAiProvider({
    provider: options.aiProvider,
    model: options.aiModel,
    apiKey: options.aiApiKey,
  });
  const iaCode = options.productTypeIaCode ?? 'all-departments';
  const sortOrder: SortOrder = options.sortOrder ?? 'top selling';
  const productTypeLabel =
    PRODUCT_CATEGORIES.find((category) => category.iaCode === iaCode)?.label ?? iaCode;

  return {
    research: (rawKeyword: string) => {
      // Fail fast before any browser work: a closed connection would otherwise
      // surface only after a full collection run, at persistence time.
      if (!db.open) {
        return Promise.reject(new Error('Database connection is closed'));
      }
      return research(rawKeyword, {
        marketplace: options.marketplace,
        aiProvider: options.aiProvider,
        aiModel: options.aiModel,
        searchOptions: { productTypeLabel, iaCode, sortOrder },
        logger: options.logger,
        collectProducts: (keyword, log, onStage) =>
          collectProducts(keyword, log, { iaCode, sortOrder }, (stage) => {
            options.onProgress?.(stage);
            onStage?.(stage);
          }),
        saveResearchData: (session, products) =>
          saveResearchData(db, session, products, options.logger),
        assessTrendVelocity: async (keyword, products) => {
          options.onProgress?.('assessing-trend');
          // URL-only scout of the recent sort: one page load, no product visits.
          const recentSample = await scoutProducts(keyword, options.logger, { iaCode, sortOrder: 'recent' });
          return computeTrendVelocity(products, recentSample);
        },
        analyzeProducts: (keyword, products, logger, velocity) => {
          options.onProgress?.('analyzing');
          return analyzeProducts(keyword, products, aiProvider, logger, {
            productType: productTypeLabel,
            sortOrder,
            trendVelocity: velocity ?? undefined,
          });
        },
        saveAiAnalysis: (sessionId, analysis) =>
          saveAiAnalysis(
            db,
            {
              sessionId,
              provider: options.aiProvider,
              model: options.aiModel,
              prompt: analysis.prompt,
              response: analysis.response,
            },
            options.logger,
          ),
        finalizeSession: (sessionId, status, completedAt) =>
          finalizeResearchSession(db, sessionId, status, completedAt, options.logger),
        downloadImages: (sessionId) => {
          options.onProgress?.('downloading-images');
          return downloadProductImages(db, sessionId, options.imagesDirectory, options.logger);
        },
        generateReport: (sessionId, velocity) => {
          options.onProgress?.('generating-report');
          // Report pipeline (Doc 010 §5): load stored data, generate HTML,
          // save the file, then record metadata — in that order, so a file
          // write failure never leaves a dangling database record (§13).
          const data = loadResearchData(db, sessionId);
          if (!data.session || !data.analysis) {
            throw new Error('Report generation requires a stored session and AI analysis');
          }
          const html = generateReportHtml({
            projectName: PROJECT_NAME,
            session: data.session,
            products: data.products,
            analysis: data.analysis,
            generatedAt: new Date().toISOString(),
            trendVelocity: velocity ?? null,
          });
          const reportPath = saveReportFile(html, options.reportsDirectory, `research-${sessionId}.html`);
          return saveReportMetadata(db, { sessionId, reportPath }, options.logger);
        },
      });
    },
    compare: (rawKeywords: string[]) => {
      if (!db.open) {
        return Promise.reject(new Error('Database connection is closed'));
      }
      return runComparison({
        db,
        keywords: rawKeywords,
        marketplace: options.marketplace,
        productTypeLabel,
        iaCode,
        sortOrder,
        aiProvider,
        reportsDirectory: options.reportsDirectory,
        logger: options.logger,
        onProgress: (stage) => options.onProgress?.(stage as ProgressStage),
      });
    },
    close: () => closeDatabase(db),
  };
}

// Read-only access to a completed session's stored data for in-app rendering
// (Doc 005 §4.1 UI "report viewer"). Opens a short-lived connection, loads the
// session tree, and closes it. The Research Engine owns Storage access
// (Doc 005 §8); callers never receive a database object.
export function loadResearchResult(
  databaseFilePath: string,
  sessionId: string,
  logger: Logger,
): ResearchData {
  const db = openDatabase(databaseFilePath, logger);
  try {
    return loadResearchData(db, sessionId);
  } finally {
    closeDatabase(db);
  }
}
