import { Loader2, PackageOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { toApiError } from '../api/errors';
import { Button } from './button';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-white/[0.06]',
        className,
      )}
      aria-hidden
    />
  );
}

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-label="Cargando contenido">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('h-5 w-5 animate-spin text-muted-foreground', className)}
      aria-label="Cargando"
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#D9DADC]/15 bg-card/60 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon ?? <PackageOpen className="h-5 w-5" />}
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{title}</p>
        {description !== undefined ? (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const apiError = toApiError(error);
  return (
    <div
      role="alert"
      className={cn(
        'rounded-2xl border border-red-400/30 bg-red-400/[0.07] p-5 text-sm text-red-100',
        className,
      )}
    >
      <p className="font-semibold">
        {apiError.isDomainError ? 'Operación no permitida' : 'Ocurrió un error'}
      </p>
      <p className="mt-1 text-red-100/80">{apiError.message}</p>
      <p className="mt-2 font-mono text-xs text-red-300/80 tabular-nums">
        {apiError.status > 0 ? `HTTP ${apiError.status} · ` : ''}
        {apiError.code}
        {apiError.requestId !== undefined
          ? ` · requestId ${apiError.requestId}`
          : ''}
      </p>
      {onRetry !== undefined ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onRetry}
        >
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}
