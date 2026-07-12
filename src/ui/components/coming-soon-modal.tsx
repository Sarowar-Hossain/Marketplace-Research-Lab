import { Construction, X } from 'lucide-react';
import { Button } from './ui/button';

// Centered "Coming soon" modal used for unimplemented navigation items and
// actions (spec future-proofing rule: never a broken link / 404 / blank page).
export function ComingSoonModal({
  open,
  title,
  onClose,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default bg-black/60 animate-fade-in motion-reduce:animate-none"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} coming soon`}
        className="relative w-full max-w-sm rounded-lg border border-hairline bg-elevated p-6 text-center shadow-2xl animate-fade-in motion-reduce:animate-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-panel hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
        <Construction className="mx-auto h-10 w-10 text-warning" />
        <h3 className="mt-3 text-base font-semibold text-ink">Coming Soon</h3>
        <p className="mt-1 text-sm text-muted">
          {title} is under development and will be available in a future release.
        </p>
        <Button className="mt-4 w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
