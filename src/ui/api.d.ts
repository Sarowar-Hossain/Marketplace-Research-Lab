// Renderer-side types for the preload bridge (window.api).
export type UiSettings = {
  ai: { provider: 'openai' | 'deepseek' | 'glm'; model: string; apiKey: string };
};

export type StartResearchResponse =
  | { ok: true; productsSaved: number; reportPath: string }
  | { ok: false; error: string };

declare global {
  interface Window {
    api: {
      getSettings: () => Promise<UiSettings | null>;
      saveSettings: (settings: UiSettings) => Promise<{ ok: true; settings: UiSettings } | { ok: false; error: string }>;
      startResearch: (rawKeyword: string) => Promise<StartResearchResponse>;
      openReport: (reportPath: string) => Promise<{ ok: true } | { ok: false; error: string }>;
      onProgress: (callback: (stage: string) => void) => () => void;
    };
  }
}
