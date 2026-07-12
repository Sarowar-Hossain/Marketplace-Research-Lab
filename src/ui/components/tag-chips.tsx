import { useState } from 'react';
import { Button } from './ui/button';
import type { TagCount } from '../lib/metrics';

// Frequency-weighted tag chips with one-click "copy all". The seller's primary
// action on this output is to lift tags into a listing, so copy is first-class.
export function TagChips({ tags, max = 40 }: { tags: TagCount[]; max?: number }) {
  const [copied, setCopied] = useState(false);

  if (tags.length === 0) return null;

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(tags.map((entry) => entry.tag).join(', '));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. permissions); fail silently.
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{tags.length} unique tags</p>
        <Button variant="outline" size="sm" onClick={copyAll}>
          {copied ? 'Copied!' : 'Copy all'}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.slice(0, max).map(({ tag, count }) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel px-3 py-1 text-sm text-muted"
          >
            {tag}
            <span className="text-xs font-medium text-faint">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
