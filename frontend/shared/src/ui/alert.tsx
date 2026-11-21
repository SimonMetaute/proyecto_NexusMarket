import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react';
import { cn } from '../lib/cn';

const styles = {
  info: {
    wrapper: 'border-sky-600/25 bg-sky-600/[0.07] text-sky-900',
    icon: 'text-sky-700',
    Icon: Info,
  },
  success: {
    wrapper: 'border-emerald-600/25 bg-emerald-600/[0.07] text-emerald-900',
    icon: 'text-emerald-700',
    Icon: CheckCircle2,
  },
  warning: {
    wrapper: 'border-amber-600/30 bg-amber-600/[0.08] text-amber-900',
    icon: 'text-amber-700',
    Icon: AlertTriangle,
  },
  error: {
    wrapper: 'border-red-600/25 bg-red-600/[0.07] text-red-900',
    icon: 'text-red-700',
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
