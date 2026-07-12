import { useState, type ComponentType, type ReactNode } from 'react';
import {
  Bookmark,
  Bot,
  ChevronLeft,
  Download,
  FileSpreadsheet,
  FileText,
  GitCompare,
  History,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Tag,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ComingSoonModal } from './coming-soon-modal';

type NavItem = { id: string; label: string; icon: ComponentType<{ className?: string }> };
type NavGroup = { title: string; items: NavItem[] };

// Full concept sidebar set (spec decision). Only New Research exists today;
// every other item opens the Coming Soon modal.
const NAV: NavGroup[] = [
  {
    title: 'Research Lab',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'new-research', label: 'New Research', icon: Plus },
      { id: 'history', label: 'History', icon: History },
      { id: 'saved-keywords', label: 'Saved Keywords', icon: Bookmark },
      { id: 'comparisons', label: 'Comparisons', icon: GitCompare },
    ],
  },
  {
    title: 'Tools',
    items: [
      { id: 'trend-tracker', label: 'Trend Tracker', icon: TrendingUp },
      { id: 'niche-finder', label: 'Niche Finder', icon: Search },
      { id: 'artist-explorer', label: 'Artist Explorer', icon: Users },
      { id: 'keyword-explorer', label: 'Keyword Explorer', icon: Tag },
    ],
  },
  {
    title: 'Settings',
    items: [
      { id: 'general', label: 'General', icon: Settings },
      { id: 'ai-providers', label: 'AI Providers', icon: Bot },
      { id: 'export', label: 'Export Settings', icon: Download },
    ],
  },
];

type AppShellProps = {
  page: 'new-research' | 'details' | 'history';
  title: string;
  onNewResearch: () => void;
  onHistory: () => void;
  provider?: string | null;
  model?: string | null;
  children: ReactNode;
};

// App frame: fixed 240px sidebar (full concept set; non-existent items open a
// Coming Soon modal) + 56px top nav (back / title / Coming-Soon exports & menu)
// + content slot. Collapsed mode is deferred.
export function AppShell({ page, title, onNewResearch, onHistory, provider, model, children }: AppShellProps) {
  const [soon, setSoon] = useState<string | null>(null);
  const activeId = page === 'new-research' ? 'new-research' : page === 'history' ? 'history' : null;

  const onNav = (item: NavItem) => {
    if (item.id === 'new-research') onNewResearch();
    else if (item.id === 'history') onHistory();
    else setSoon(item.label);
  };

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-panel lg:flex">
        <div className="px-4 py-4 text-sm font-bold tracking-tight">
          <span className="text-brand">Marketplace</span> Research Lab
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-2">
          {NAV.map((group) => (
            <div key={group.title}>
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-faint">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.id === activeId;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNav(item)}
                      className={`relative flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                        active ? 'bg-elevated text-ink' : 'text-muted hover:bg-elevated hover:text-ink'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-brand" />
                      )}
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-hairline px-3 py-3 text-xs">
          <p className="truncate text-muted">{provider ?? 'AI not configured'}</p>
          <p className="truncate text-faint">{model ?? 'No model set'}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-hairline bg-panel px-4">
          {page === 'details' && (
            <button
              type="button"
              onClick={onNewResearch}
              aria-label="Back to New Research"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <h1 className="truncate text-sm font-semibold text-ink">{title}</h1>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              disabled
              title="Coming soon"
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted opacity-60"
            >
              <FileText className="h-3.5 w-3.5" /> PDF
            </button>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted opacity-60"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
            </button>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted opacity-60"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <ComingSoonModal open={soon !== null} title={soon ?? ''} onClose={() => setSoon(null)} />
    </div>
  );
}
