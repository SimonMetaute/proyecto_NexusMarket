import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        success: 'border-transparent bg-emerald-100 text-emerald-800',
        warning: 'border-transparent bg-amber-100 text-amber-800',
        destructive: 'border-transparent bg-red-100 text-red-800',
        info: 'border-transparent bg-blue-100 text-blue-800',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

/** Mapea estados reales del backend a una variante visual. Sin lógica de negocio. */
export function statusVariant(
  status: string | undefined,
): NonNullable<BadgeProps['variant']> {
  switch (status) {
    case 'Published':
    case 'Verified':
    case 'Operational':
    case 'Delivered':
    case 'Confirmed':
    case 'Approved':
    case 'Active':
    case 'OK':
      return 'success';
    case 'Pending':
    case 'Draft':
    case 'Preparing':
    case 'Shipped':
    case 'Maintenance':
      return 'warning';
    case 'Cancelled':
    case 'Rejected':
    case 'Suspended':
    case 'OutOfStock':
    case 'Closed':
      return 'destructive';
    case 'Inactive':
      return 'secondary';
    default:
      return 'outline';
  }
}
