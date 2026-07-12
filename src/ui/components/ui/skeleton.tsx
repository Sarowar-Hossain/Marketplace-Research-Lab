import type { HTMLAttributes } from 'react';

import { cn } from '@/ui/lib/utils';

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-panel', className)} {...props} />;
}

export { Skeleton };
