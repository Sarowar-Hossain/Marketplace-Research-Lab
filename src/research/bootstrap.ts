import type { Logger } from 'pino';
import { collectProducts } from '../marketplace/collect';
import { initializeDatabase } from '../storage/initialize';
import { closeDatabase } from '../storage/database';
import {
  saveResearchData,
  saveAiAnalysis,
  finalizeResearchSession,
  saveReportMetadata,
} from '../storage/persistence';
import { loadResearchData } from '../storage/research-data';
import { createAiProvider } from '../ai/provider';
import { analyzeProducts } from '../ai/analyze';
import { generateReportHtml } from '../reports/generate';
import { saveReportFile } from '../reports/save';
import { research, type ResearchResult } from './engine';

const PROJECT_NAME = 'Marketplace Research Lab';

// Composition layer (Doc 005 §7–§8: Research Engine → Marketplace / AI /
// Storage). Binds the real Marketplace collector, AI provider, and Storage
// persistence into the engine's injected dependencies. All configuration
// values are supplied by the caller — this layer never loads config
// (Doc 011 §11). The future Application layer decides when runners are
// created and closed.
export type ResearchRunnerOptions = {
  databaseFilePath: string;
  reportsDirectory: string;
  marketplace: string;
  aiProvider: string;
  aiModel: string;
  aiApiKey: string;
  logger: Logger;
};

export type ResearchRunner = {
  research: (rawKeyword: string) => Promise<ResearchResult>;
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
        logger: options.logger,
        collectProducts,
        saveResearchData: (session, products) =>
          saveResearchData(db, session, products, options.logger),
        analyzeProducts: (keyword, products, logger) =>
          analyzeProducts(keyword, products, aiProvider, logger),
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
        generateReport: (sessionId) => {
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
          });
          const reportPath = saveReportFile(html, options.reportsDirectory, `research-${sessionId}.html`);
          return saveReportMetadata(db, { sessionId, reportPath }, options.logger);
        },
      });
    },
    close: () => closeDatabase(db),
  };
}
