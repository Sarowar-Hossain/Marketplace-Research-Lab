import { useEffect, useState } from 'react';
import type { ResearchData, SortOrder, UiSettings } from './api';
import { AppShell } from './components/app-shell';
import { HistoryView } from './components/history-view';
import { ResultsView } from './components/results-view';
import { ResultsSkeleton } from './components/results-skeleton';

// Category codes live-verified against Redbubble search titles (2026-07-12).
const PRODUCT_TYPES: { label: string; iaCode: string }[] = [
  { label: 'All Departments', iaCode: 'all-departments' },
  { label: 'T-Shirts', iaCode: 'u-tees' },
  { label: 'Stickers', iaCode: 'all-stickers' },
  { label: 'Hoodies & Sweatshirts', iaCode: 'u-sweatshirts' },
  { label: 'Mugs', iaCode: 'u-mugs' },
  { label: 'Phone Cases', iaCode: 'u-phone-cases' },
];

const SORT_OPTIONS: { label: string; value: SortOrder }[] = [
  { label: 'Top Selling', value: 'top selling' },
  { label: 'Relevant', value: 'relevant' },
  { label: 'Recent', value: 'recent' },
];

const STAGE_LABELS: Record<string, string> = {
  searching: 'Searching Redbubble…',
  discovering: 'Collecting product links…',
  extracting: 'Extracting product data…',
  normalizing: 'Normalizing products…',
  comparing: 'Scouting next keyword…',
  'assessing-trend': 'Checking trend velocity…',
  analyzing: 'Running AI analysis…',
  'downloading-images': 'Downloading product images…',
  'generating-report': 'Generating HTML report…',
};

type RunState =
  | { kind: 'idle' }
  | { kind: 'running'; stage: string | null }
  | { kind: 'compare-done'; reportPath: string; keywords: number; skipped: string[] }
  | { kind: 'error'; message: string };

const inputClass =
  'w-full rounded-md border border-hairline bg-panel p-2 text-ink placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-brand';

function SettingsScreen(props: {
  settings: UiSettings | null;
  onSaved: (settings: UiSettings) => void;
  onBack: () => void;
}) {
  const [provider, setProvider] = useState(props.settings?.ai.provider ?? 'openai');
  const [model, setModel] = useState(props.settings?.ai.model ?? '');
  const [apiKey, setApiKey] = useState(props.settings?.ai.apiKey ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setError(null);
    setSaved(false);
    const response = await window.api.saveSettings({ ai: { provider, model, apiKey } });
    if (response.ok) {
      setSaved(true);
      props.onSaved(response.settings);
    } else {
      setError(response.error);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg border border-hairline bg-elevated p-5">
      <h2 className="text-lg font-semibold text-ink">AI Provider Settings</h2>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-muted">Provider</span>
        <select
          className={inputClass}
          value={provider}
          onChange={(e) => setProvider(e.target.value as UiSettings['ai']['provider'])}
        >
          <option value="openai">OpenAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="glm">GLM (Zhipu)</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-muted">Model</span>
        <input className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. gpt-5.4-mini" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-muted">API Key</span>
        <input type="password" className={inputClass} value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-brand">Settings saved.</p>}
      <div className="flex gap-2">
        <button className="rounded-md bg-brand px-4 py-2 text-canvas disabled:opacity-50" onClick={save} disabled={!model || !apiKey}>
          Save
        </button>
        <button className="rounded-md border border-hairline bg-panel px-4 py-2 text-ink" onClick={props.onBack}>
          Back
        </button>
      </div>
    </div>
  );
}

export function App() {
  const [view, setResultView] = useState<'search' | 'results' | 'history'>('search');
  const [resultData, setResultData] = useState<ResearchData | null>(null);
  const [reportPath, setReportPath] = useState('');
  const [resultsLoading, setResultsLoading] = useState(false);
  const [settings, setSettings] = useState<UiSettings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [compareInput, setCompareInput] = useState('');
  const [productTypeIaCode, setProductTypeIaCode] = useState(PRODUCT_TYPES[0].iaCode);
  const [sortOrder, setSortOrder] = useState<SortOrder>('top selling');
  const [run, setRun] = useState<RunState>({ kind: 'idle' });

  useEffect(() => {
    void window.api.getSettings().then((stored) => {
      setSettings(stored);
      setSettingsLoaded(true);
      if (!stored) setShowSettings(true);
    });
    return window.api.onProgress((stage) => {
      setRun((current) => (current.kind === 'running' ? { kind: 'running', stage } : current));
    });
  }, []);

  const start = async () => {
    setRun({ kind: 'running', stage: null });
    const response = await window.api.startResearch({ keyword, productTypeIaCode, sortOrder });
    if (response.ok) {
      setReportPath(response.reportPath);
      setResultsLoading(true);
      setResultView('results');
      const data = await window.api.getResearchData(response.sessionId);
      setResultData(data);
      setResultsLoading(false);
      setRun({ kind: 'idle' });
    } else {
      setRun({ kind: 'error', message: response.error });
    }
  };

  const startComparison = async () => {
    const keywords = compareInput
      .split(/[,\n]/)
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 5);
    if (keywords.length < 2) {
      setRun({ kind: 'error', message: 'Enter 2–5 keywords to compare (comma or newline separated).' });
      return;
    }
    setRun({ kind: 'running', stage: null });
    const response = await window.api.compareKeywords({ keywords, productTypeIaCode, sortOrder });
    if (response.ok) {
      setRun({ kind: 'compare-done', reportPath: response.reportPath, keywords: response.keywords.length, skipped: response.skippedKeywords });
    } else {
      setRun({ kind: 'error', message: response.error });
    }
  };

  const handleNewSearch = () => {
    setResultData(null);
    setReportPath('');
    setResultsLoading(false);
    setKeyword('');
    setRun({ kind: 'idle' });
    setResultView('search');
  };

  const handleHistory = () => {
    setResultView('history');
  };

  const handleSelectSession = async (sessionId: string, sessionReportPath: string) => {
    setReportPath(sessionReportPath);
    setResultsLoading(true);
    setResultView('results');
    const data = await window.api.getResearchData(sessionId);
    setResultData(data);
    setResultsLoading(false);
  };

  const provider = settings?.ai.provider ?? null;
  const model = settings?.ai.model ?? null;

  if (view === 'results') {
    const title = resultData?.session?.keyword ?? 'Research Report';
    return (
      <AppShell page="details" title={title} onNewResearch={handleNewSearch} onHistory={handleHistory} provider={provider} model={model}>
        {resultsLoading || !resultData ? (
          <ResultsSkeleton />
        ) : (
          <ResultsView
            data={resultData}
            reportPath={reportPath}
            onNewSearch={handleNewSearch}
            onOpenExternal={(path) => void window.api.openReport(path)}
          />
        )}
      </AppShell>
    );
  }

  if (view === 'history') {
    return (
      <AppShell
        page="history"
        title="Research History"
        onNewResearch={handleNewSearch}
        onHistory={handleHistory}
        provider={provider}
        model={model}
      >
        <HistoryView onSelectSession={handleSelectSession} onNewResearch={handleNewSearch} />
      </AppShell>
    );
  }

  const running = run.kind === 'running';

  return (
    <AppShell page="new-research" title="New Research" onNewResearch={handleNewSearch} onHistory={handleHistory} provider={provider} model={model}>
      <div className="mx-auto max-w-2xl space-y-6 p-8">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            disabled={running}
            className="rounded-md border border-hairline bg-panel px-3 py-1 text-sm text-muted hover:text-ink disabled:opacity-50"
          >
            {showSettings ? 'Close Settings' : 'Settings'}
          </button>
        </div>

        {showSettings ? (
          <SettingsScreen settings={settings} onSaved={setSettings} onBack={() => setShowSettings(false)} />
        ) : (
          <section className="space-y-4">
            {settingsLoaded && !settings && (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                Configure your AI provider in Settings before starting research.
              </p>
            )}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border border-hairline bg-panel p-2 text-ink placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Enter a keyword, e.g. dog mom"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && keyword.trim() && !running && settings) void start();
                }}
                disabled={running}
              />
              <button
                className="rounded-md bg-brand px-5 py-2 font-medium text-canvas disabled:opacity-50"
                onClick={start}
                disabled={running || !keyword.trim() || !settings}
              >
                {running ? 'Researching…' : 'Start Research'}
              </button>
            </div>
            <div className="flex gap-2">
              <label className="flex-1 space-y-1 text-sm">
                <span className="font-medium text-muted">Product Type</span>
                <select
                  className={inputClass}
                  value={productTypeIaCode}
                  onChange={(e) => setProductTypeIaCode(e.target.value)}
                  disabled={running}
                >
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type.iaCode} value={type.iaCode}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex-1 space-y-1 text-sm">
                <span className="font-medium text-muted">Sort By</span>
                <select
                  className={inputClass}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  disabled={running}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {run.kind === 'running' && (
              <div className="rounded-md border border-brand/30 bg-brand/10 p-4">
                <p className="font-medium text-ink">Research in progress</p>
                <p className="text-sm text-brand">{run.stage ? STAGE_LABELS[run.stage] ?? run.stage : 'Starting…'}</p>
              </div>
            )}

            <details className="rounded-md border border-hairline bg-elevated p-3">
              <summary className="cursor-pointer text-sm font-medium text-ink">
                Multi-Keyword Comparison (scout 2–5 keyword variations)
              </summary>
              <div className="mt-3 space-y-2">
                <textarea
                  className={inputClass}
                  rows={3}
                  placeholder={'dog mom\ndog mama\ngolden retriever mom'}
                  value={compareInput}
                  onChange={(e) => setCompareInput(e.target.value)}
                  disabled={running}
                />
                <button
                  className="rounded-md bg-violet px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  onClick={startComparison}
                  disabled={running || !settings || compareInput.trim().length === 0}
                >
                  Compare Keywords
                </button>
                <p className="text-xs text-faint">
                  Scout pass: top 24 products per keyword, one comparative AI verdict, standalone report.
                </p>
              </div>
            </details>

            {run.kind === 'compare-done' && (
              <div className="space-y-2 rounded-md border border-violet/30 bg-violet/10 p-4">
                <p className="font-medium text-violet">Comparison completed</p>
                <p className="text-sm text-muted">
                  {run.keywords} keywords compared.
                  {run.skipped.length > 0 ? ` Skipped: ${run.skipped.join(', ')}.` : ''}
                </p>
                <button
                  className="rounded-md bg-violet px-4 py-2 text-sm font-medium text-white"
                  onClick={() => void window.api.openReport(run.reportPath)}
                >
                  Open Comparison Report
                </button>
              </div>
            )}

            {run.kind === 'error' && (
              <div className="rounded-md border border-danger/30 bg-danger/10 p-4">
                <p className="font-medium text-danger">Research failed</p>
                <p className="text-sm text-muted">{run.message}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
