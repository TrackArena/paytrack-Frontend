import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary/10 text-primary',
        secondary:   'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive/10 text-destructive',
        outline:     'text-foreground',
        success:     'border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
        warning:     'border-transparent bg-amber-50 text-amber-700 ring-1 ring-amber-200/50',
        error:       'border-transparent bg-red-50 text-red-700 ring-1 ring-red-200/50',
        muted:       'border-transparent bg-gray-100 text-gray-600',
        purple:      'border-transparent bg-violet-50 text-violet-700 ring-1 ring-violet-200/50',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
