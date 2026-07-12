type Tab = { id: string; label: string };

type TabBarProps = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
};

// Lightweight accessible tablist. Switching is instant (local state in the
// parent) — no page reload, no refetch.
export function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1 border-b border-hairline">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ' +
              (isActive ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink')
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
