// Renderer-side types for the preload bridge (window.api).
export type UiSettings = {
  ai: { provider: 'openai' | 'deepseek' | 'glm'; model: string; apiKey: string };
};

export type SortOrder = 'top selling' | 'relevant' | 'recent';

export type StartResearchRequest = {
  keyword: string;
  productTypeIaCode?: string;
  sortOrder?: SortOrder;
};

export type StartResearchResponse =
  | { ok: true; sessionId: string; productsSaved: number; reportPath: string }
  | { ok: false; error: string };

export type CompareKeywordsRequest = {
  keywords: string[];
  productTypeIaCode?: string;
  sortOrder?: SortOrder;
};

export type KeywordMetricsSummary = {
  keyword: string;
  productCount: number;
  priceMedian: number | null;
  uniqueArtists: number;
  avgPortfolioSize: number | null;
  topTags: string[];
};

export type CompareKeywordsResponse =
  | { ok: true; reportPath: string; keywords: KeywordMetricsSummary[]; skippedKeywords: string[] }
  | { ok: false; error: string };

export type ResearchSessionSummary = {
  id: string;
  keyword: string;
  marketplace: string;
  status: string;
  aiProvider: string;
  aiModel: string;
  startedAt: string;
  completedAt: string | null;
  productType: string | null;
  sortOrder: string | null;
};

export type ResearchProduct = {
  id: string;
  title: string;
  productUrl: string;
  artistName: string | null;
  description: string | null;
  productType: string | null;
  price: number | null;
  currency: string | null;
  images: { imageUrl: string; localPath: string | null; displayOrder: number | null }[];
  tags: string[];
  statistics: {
    favorites: number | null;
    availableProducts: number | null;
    rank: number | null;
    artistDesignCount: number | null;
  } | null;
};

export type ResearchAnalysis = {
  provider: string;
  model: string;
  prompt: string;
  response: string;
  generatedAt: string;
};

export type ResearchData = {
  session: ResearchSessionSummary | null;
  products: ResearchProduct[];
  analysis: ResearchAnalysis | null;
};

declare global {
  interface Window {
    api: {
      getSettings: () => Promise<UiSettings | null>;
      saveSettings: (settings: UiSettings) => Promise<{ ok: true; settings: UiSettings } | { ok: false; error: string }>;
      startResearch: (request: StartResearchRequest) => Promise<StartResearchResponse>;
      compareKeywords: (request: CompareKeywordsRequest) => Promise<CompareKeywordsResponse>;
      openReport: (reportPath: string) => Promise<{ ok: true } | { ok: false; error: string }>;
      getResearchData: (sessionId: string) => Promise<ResearchData>;
      onProgress: (callback: (stage: string) => void) => () => void;
    };
  }
}
