import { readFileSync, writeFileSync } from 'node:fs';
import { z } from 'zod';

// Application settings persisted in the local config directory. Users manage
// the AI provider, model, and API key from the settings screen; nothing is
// read from environment variables at runtime (the .env file is a development
// convenience only, per product decision 2026-07-12).
const settingsSchema = z.object({
  ai: z.object({
    provider: z.enum(['openai', 'deepseek', 'glm']),
    model: z.string().min(1),
    apiKey: z.string().min(1),
  }),
});

export type AppSettings = z.infer<typeof settingsSchema>;

export const SUPPORTED_PROVIDERS = ['openai', 'deepseek', 'glm'] as const;

// Returns the stored settings, or null when no valid settings exist yet — the
// UI treats null as "not configured" and directs the user to the settings
// screen. A missing or malformed file is not an error condition at startup.
export function loadSettings(settingsFilePath: string): AppSettings | null {
  let raw: string;
  try {
    raw = readFileSync(settingsFilePath, 'utf8');
  } catch {
    return null;
  }
  try {
    const parsed = settingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// Validates and persists settings. Invalid input throws with a clear message
// so the settings screen can surface it.
export function saveSettings(settingsFilePath: string, settings: unknown): AppSettings {
  const result = settingsSchema.safeParse(settings);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid settings: ${issues}`);
  }
  writeFileSync(settingsFilePath, JSON.stringify(result.data, null, 2), 'utf8');
  return result.data;
}
