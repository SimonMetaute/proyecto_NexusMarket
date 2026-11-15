import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

const styles = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
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
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('rounded-md border p-4 text-sm', styles[variant], className)}
    >
      {title !== undefined ? <p className="font-medium">{title}</p> : null}
      {children !== undefined ? (
        <div className={cn(title !== undefined && 'mt-1')}>{children}</div>
      ) : null}
    </div>
  );
}
