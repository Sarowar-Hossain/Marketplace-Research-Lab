import { readFileSync } from 'node:fs';
import { z } from 'zod';

const AI_API_KEY_ENV = 'AI_API_KEY';

// Schema for the three documented configuration categories (Doc 011 §3–§6).
// Every value is validated as a required non-empty string; directory paths are
// checked structurally only, never against the filesystem.
const configSchema = z.object({
  application: z.object({
    applicationName: z.string().min(1),
    applicationVersion: z.string().min(1),
    defaultMarketplace: z.string().min(1),
  }),
  ai: z.object({
    provider: z.string().min(1),
    model: z.string().min(1),
    apiKey: z.string().min(1),
  }),
  storage: z.object({
    databaseDirectory: z.string().min(1),
    reportsDirectory: z.string().min(1),
    imagesDirectory: z.string().min(1),
    logsDirectory: z.string().min(1),
    cacheDirectory: z.string().min(1),
  }),
});

export type AppConfig = z.infer<typeof configSchema>;

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

// Loads and validates the application configuration before startup. The AI API
// key is injected from the environment rather than the config file, because it
// is the only sensitive value (Doc 011 §9). Any missing or invalid value throws
// a clear error so startup can be aborted (Doc 011 §8, §13).
export function loadConfig(configFilePath: string): AppConfig {
  let raw: string;
  try {
    raw = readFileSync(configFilePath, 'utf8');
  } catch (error) {
    throw new Error(`Configuration file could not be read at ${configFilePath}: ${(error as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Configuration file is not valid JSON at ${configFilePath}: ${(error as Error).message}`);
  }

  const parsedObject = toRecord(parsed);
  const candidate = {
    ...parsedObject,
    ai: {
      ...toRecord(parsedObject.ai),
      apiKey: process.env[AI_API_KEY_ENV],
    },
  };

  const result = configSchema.safeParse(candidate);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuration validation failed: ${issues}`);
  }

  return result.data;
}
