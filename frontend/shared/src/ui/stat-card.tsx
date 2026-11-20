import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

const TONES = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-400/10 text-emerald-300',
  warning: 'bg-amber-400/10 text-amber-300',
  danger: 'bg-red-400/10 text-red-300',
  info: 'bg-sky-400/10 text-sky-300',
  neutral: 'bg-white/[0.06] text-muted-foreground',
} as const;

export type StatCardTone = keyof typeof TONES;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: StatCardTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'card-hover group relative overflow-hidden rounded-2xl border border-[#D9DADC]/10 bg-card p-5',
        className,
      )}
    >
      <span className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-primary/[0.05] blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold leading-none tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {hint !== undefined ? (
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ease-smooth group-hover:-translate-y-0.5 group-hover:scale-105',
            TONES[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
