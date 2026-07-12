import { useEffect, useState } from 'react';
import type { UiSettings } from './api';

const STAGE_LABELS: Record<string, string> = {
  searching: 'Searching Redbubble…',
  discovering: 'Collecting product links…',
  extracting: 'Extracting product data…',
  normalizing: 'Normalizing products…',
  analyzing: 'Running AI analysis…',
  'generating-report': 'Generating HTML report…',
};

type RunState =
  | { kind: 'idle' }
  | { kind: 'running'; stage: string | null }
  | { kind: 'done'; productsSaved: number; reportPath: string }
  | { kind: 'error'; message: string };

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
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-lg font-semibold">AI Provider Settings</h2>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Provider</span>
        <select
          className="w-full rounded border border-gray-300 p-2"
          value={provider}
          onChange={(e) => setProvider(e.target.value as UiSettings['ai']['provider'])}
        >
          <option value="openai">OpenAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="glm">GLM (Zhipu)</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Model</span>
        <input
          className="w-full rounded border border-gray-300 p-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="e.g. gpt-5.4-mini"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">API Key</span>
        <input
          type="password"
          className="w-full rounded border border-gray-300 p-2"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Settings saved.</p>}
      <div className="flex gap-2">
        <button className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50" onClick={save} disabled={!model || !apiKey}>
          Save
        </button>
        <button className="rounded border border-gray-300 px-4 py-2" onClick={props.onBack}>
          Back
        </button>
      </div>
    </div>
  );
}

export function App() {
  const [settings, setSettings] = useState<UiSettings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [keyword, setKeyword] = useState('');
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
    const response = await window.api.startResearch(keyword);
    if (response.ok) {
      setRun({ kind: 'done', productsSaved: response.productsSaved, reportPath: response.reportPath });
    } else {
      setRun({ kind: 'error', message: response.error });
    }
  };

  const running = run.kind === 'running';

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Marketplace Research Lab</h1>
          <button
            className="rounded border border-gray-300 px-3 py-1 text-sm"
            onClick={() => setShowSettings((v) => !v)}
            disabled={running}
          >
            {showSettings ? 'Close Settings' : 'Settings'}
          </button>
        </header>

        {showSettings ? (
          <SettingsScreen
            settings={settings}
            onSaved={(saved) => setSettings(saved)}
            onBack={() => setShowSettings(false)}
          />
        ) : (
          <section className="space-y-4">
            {settingsLoaded && !settings && (
              <p className="rounded bg-amber-100 p-3 text-sm text-amber-900">
                Configure your AI provider in Settings before starting research.
              </p>
            )}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded border border-gray-300 p-2"
                placeholder="Enter a keyword, e.g. dog mom"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && keyword.trim() && !running && settings) void start();
                }}
                disabled={running}
              />
              <button
                className="rounded bg-blue-600 px-5 py-2 font-medium text-white disabled:opacity-50"
                onClick={start}
                disabled={running || !keyword.trim() || !settings}
              >
                {running ? 'Researching…' : 'Start Research'}
              </button>
            </div>

            {run.kind === 'running' && (
              <div className="rounded border border-blue-200 bg-blue-50 p-4">
                <p className="font-medium">Research in progress</p>
                <p className="text-sm text-blue-900">
                  {run.stage ? STAGE_LABELS[run.stage] ?? run.stage : 'Starting…'}
                </p>
              </div>
            )}

            {run.kind === 'done' && (
              <div className="space-y-2 rounded border border-green-200 bg-green-50 p-4">
                <p className="font-medium text-green-900">Research completed</p>
                <p className="text-sm">{run.productsSaved} products collected and analyzed.</p>
                <button
                  className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white"
                  onClick={() => void window.api.openReport(run.reportPath)}
                >
                  Open HTML Report
                </button>
              </div>
            )}

            {run.kind === 'error' && (
              <div className="rounded border border-red-200 bg-red-50 p-4">
                <p className="font-medium text-red-900">Research failed</p>
                <p className="text-sm text-red-800">{run.message}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
