import { Check } from 'lucide-react';
import { cn } from '../lib/cn';

export interface StepperStep {
  label: string;
  hint?: string;
}

/**
 * Indicador de progreso puramente visual. No deriva estado de negocio:
 * el llamador decide qué paso está activo a partir de los datos reales.
 */
export function Stepper({
  steps,
  current,
  errorLabel,
  className,
}: {
  steps: readonly StepperStep[];
  current: number;
  errorLabel?: string;
  className?: string;
}) {
  const failed = errorLabel !== undefined;

  return (
    <div className={cn('w-full', className)}>
      <ol className="scrollbar-none flex min-w-0 items-start gap-1 overflow-x-auto sm:gap-2">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current && !failed;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.label}
              className="flex min-w-[92px] flex-1 flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold tabular-nums transition-all duration-300 ease-smooth',
                    done && 'border-primary bg-primary text-primary-foreground',
                    active &&
                      'border-primary bg-primary/15 text-accent-foreground shadow-[0_0_0_4px_rgba(232,90,36,0.12)]',
                    !done &&
                      !active &&
                      'border-border bg-[#171717]/[0.03] text-subtle',
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                {!isLast ? (
                  <span
                    className={cn(
                      'h-0.5 flex-1 rounded-full transition-colors duration-500',
                      done ? 'bg-primary/70' : 'bg-border',
                    )}
                  />
                ) : null}
              </div>
              <div className="min-w-0 pr-1">
                <p
                  className={cn(
                    'text-xs font-semibold leading-tight transition-colors',
                    active || done ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </p>
                {step.hint !== undefined ? (
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                    {step.hint}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      {failed ? (
        <p className="mt-3 inline-flex items-center rounded-full border border-red-600/20 bg-red-600/[0.08] px-3 py-1 text-xs font-semibold text-red-700">
          {errorLabel}
        </p>
      ) : null}
    </div>
  );
}
