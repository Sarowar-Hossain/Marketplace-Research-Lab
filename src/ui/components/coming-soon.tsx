import { Construction } from 'lucide-react';

// Inline "Coming soon" placeholder for sections/tabs whose data or feature is
// not implemented yet. Keeps the final layout stable (Doc: future-proofing rule).
// The sidebar/modal Coming Soon for navigation is a separate component (FD-7).
type ComingSoonProps = {
  title?: string;
  description?: string;
};

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-hairline bg-panel/40 px-6 py-12 text-center">
      <Construction className="h-8 w-8 text-muted" />
      <p className="mt-3 text-sm font-medium text-ink">{title ?? 'Coming soon'}</p>
      <p className="mt-1 max-w-sm text-xs text-muted">
        {description ?? 'This area is under development and will be available in a future release.'}
      </p>
    </div>
  );
}
