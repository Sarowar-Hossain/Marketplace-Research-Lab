import { z } from 'zod';
import type { Logger } from 'pino';
import type { AiProvider } from './provider';
import { buildAnalysisPrompt, type AnalysisProduct, type AnalysisContext } from './prompt';

// The completed analysis: the exact prompt sent and the validated response
// received. Stored as-is so the analysis remains reproducible (Doc 004 §14).
export type AiAnalysisResult = {
  prompt: string;
  response: string;
};

// Response Validation (Doc 009 §10): a usable response was received, is not
// empty, and can be stored. No structural schema is mandated for Version 0.1.
const responseSchema = z.string().trim().min(1);

// AI Analysis Pipeline stages 1–5 (Doc 009): input validation, context
// preparation + prompt construction, provider request, response validation.
// Persistence (stage 6) is owned by Storage. A failure at any stage is logged
// and thrown; previously collected research data is never touched (Doc 009 §13).
export async function analyzeProducts(
  keyword: string,
  products: AnalysisProduct[],
  provider: AiProvider,
  logger: Logger,
  context?: AnalysisContext,
): Promise<AiAnalysisResult> {
  // Stage 1 — Input Validation (Doc 009 §6).
  if (products.length === 0) {
    throw new Error('AI analysis requires at least one collected product');
  }

  // Stages 2–3 — Context Preparation + Prompt Construction.
  const prompt = buildAnalysisPrompt(keyword, products, context);

  // Stage 4 — AI Provider Request.
  logger.info({ operation: 'analysis' }, 'AI request started');
  let response: string;
  try {
    response = await provider.sendPrompt(prompt);
    logger.info({ operation: 'analysis' }, 'AI response received');
  } catch (error) {
    logger.error(
      { operation: 'analysis', error: error instanceof Error ? error.message : String(error) },
      'AI request failed',
    );
    throw error;
  }

  // Stage 5 — Response Validation.
  const validation = responseSchema.safeParse(response);
  if (!validation.success) {
    logger.error({ operation: 'analysis' }, 'AI request failed');
    throw new Error('AI response validation failed: response is empty');
  }
  logger.info({ operation: 'analysis' }, 'AI validation completed');

  return { prompt, response };
}
