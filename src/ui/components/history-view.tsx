import { useEffect, useState } from 'react';
import { Calendar, ChevronRight, Package } from 'lucide-react';
import type { SessionListItem } from '../api';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { EmptyState } from './empty-state';

type HistoryViewProps = {
  onSelectSession: (sessionId: string, reportPath: string) => void;
  onNewResearch: () => void;
};

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function activate(event: React.KeyboardEvent, fn: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fn();
  }
}

// Lists all past research sessions. Clicking one loads its full data and
// switches to the results view.
export function HistoryView({ onSelectSession, onNewResearch }: HistoryViewProps) {
  const [sessions, setSessions] = useState<SessionListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void window.api
      .listSessions()
      .then((items) => setSessions(items))
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setSessions([]);
      });
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">Failed to load history: {error}</p>
      </div>
    );
  }

  if (sessions === null) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted">Loading history…</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          title="No research yet"
          description="Run your first research to see it here."
          action={<Button onClick={onNewResearch}>Start Research</Button>}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <h2 className="text-lg font-semibold text-ink">Research History</h2>
        <div className="space-y-2">
          {sessions.map((session) => (
            <Card
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectSession(session.id, session.reportPath ?? '')}
              onKeyDown={(event) => activate(event, () => onSelectSession(session.id, session.reportPath ?? ''))}
              className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:border-brand/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-ink">{session.keyword}</p>
                  <Badge
                    variant={session.status === 'completed' ? 'default' : 'destructive'}
                    className="capitalize"
                  >
                    {session.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-faint">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(session.startedAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Package className="h-3 w-3" /> {session.productCount} products
                  </span>
                  {session.productType && session.productType !== 'all-departments' && (
                    <span>{session.productType}</span>
                  )}
                  {session.sortOrder && <span className="capitalize">{session.sortOrder}</span>}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
