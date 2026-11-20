import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react';
import { cn } from '../lib/cn';

const styles = {
  info: {
    wrapper: 'border-sky-400/25 bg-sky-400/[0.08] text-sky-100',
    icon: 'text-sky-300',
    Icon: Info,
  },
  success: {
    wrapper: 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-100',
    icon: 'text-emerald-300',
    Icon: CheckCircle2,
  },
  warning: {
    wrapper: 'border-amber-400/25 bg-amber-400/[0.08] text-amber-100',
    icon: 'text-amber-300',
    Icon: AlertTriangle,
  },
  error: {
    wrapper: 'border-red-400/30 bg-red-400/[0.08] text-red-100',
    icon: 'text-red-300',
    Icon: OctagonAlert,
  },
} as const;

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: keyof typeof styles;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { wrapper, icon, Icon } = styles[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 text-sm',
        wrapper,
        className,
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', icon)} aria-hidden />
      <div className="min-w-0 space-y-1">
        {title !== undefined ? <p className="font-semibold">{title}</p> : null}
        {children !== undefined ? <div>{children}</div> : null}
      </div>
    </div>
  );
}
