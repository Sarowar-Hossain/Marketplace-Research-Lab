import type { ComponentType, ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';

type EmptyStateProps = {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
};

// Reusable empty state: icon + short message + optional action slot.
export function EmptyState({ icon: Icon = PackageOpen, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-hairline px-6 py-12 text-center">
      <Icon className="h-8 w-8 text-muted" />
      <p className="mt-3 text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
