import { Images } from 'lucide-react';
import type { ArtistAggregate } from '../lib/metrics';

// Artists ranked by presence in the results (product count), with average
// price and published design count. Pure aggregation over stored rows.
export function ArtistList({ artists }: { artists: ArtistAggregate[] }) {
  if (artists.length === 0) {
    return <p className="text-sm text-muted">No artist data was collected.</p>;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-hairline">
      {artists.map((artist, index) => (
        <div
          key={artist.name}
          className="flex items-center justify-between gap-4 border-b border-hairline bg-elevated p-3 last:border-b-0"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-6 shrink-0 text-xs font-semibold text-faint">#{index + 1}</span>
            <span className="truncate text-sm font-medium text-info" title={artist.name}>
              {artist.name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs text-muted">
            <span>
              <b className="text-ink">{artist.productCount}</b> products
            </span>
            {artist.avgPrice !== null && (
              <span>
                avg <b className="text-brand">${artist.avgPrice.toFixed(2)}</b>
              </span>
            )}
            {artist.designCount !== null && (
              <span className="inline-flex items-center gap-1">
                <Images className="h-3 w-3" /> {artist.designCount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
