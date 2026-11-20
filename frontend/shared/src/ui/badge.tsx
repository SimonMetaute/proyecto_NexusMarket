import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5 tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary:
          'border-transparent bg-white/[0.07] text-muted-foreground',
        outline: 'border-[#D9DADC]/20 bg-transparent text-muted-foreground',
        success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
        warning: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
        destructive: 'border-red-400/25 bg-red-400/10 text-red-300',
        info: 'border-sky-400/25 bg-sky-400/10 text-sky-300',
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
    case 'InPreparation':
    case 'InTransit':
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
    case 'Scheduled':
      return 'secondary';
    default:
      return 'outline';
  }
}
