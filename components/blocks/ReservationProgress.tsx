import { BOOKING_STEPS } from '@/lib/booking-public-copy'

type StepDef = { label: string; step: number }

export function ReservationProgress({
  currentStep,
  steps = BOOKING_STEPS,
}: {
  currentStep: number
  steps?: readonly StepDef[]
}) {
  return (
    <ol
      aria-label="Progreso de la reserva"
      className="flex list-none flex-wrap items-center justify-between gap-4 pl-0"
    >
      {steps.map(({ label, step }) => {
        const isComplete = currentStep > step
        const isActive = currentStep === step

        return (
          <li
            key={step}
            aria-current={isActive ? 'step' : undefined}
            className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-2 text-center"
          >
            <span
              className={[
                'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                isComplete
                  ? 'border-primary bg-primary text-primary-fg'
                  : isActive
                    ? 'border-primary bg-background text-primary'
                    : 'border-border bg-background text-muted',
              ].join(' ')}
            >
              {isComplete ? '✓' : step}
            </span>
            <span
              className={
                isActive || isComplete
                  ? 'text-xs font-medium text-foreground'
                  : 'text-xs text-muted'
              }
            >
              {label.replace(/^\d+\s·\s/, '')}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
