import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// Operators see tiers, not raw scores (0.95 vs 0.98 means nothing to them). Below 0.7 a field is
// ambiguous and should trigger a clarifying question. Keep in sync with the gate thresholds.
export const CONFIDENCE_BANDS = { confident: 0.85, likely: 0.7 } as const

export type ConfidenceBand = "Confident" | "Likely" | "Ambiguous"

export function confidenceBand(value: number): ConfidenceBand {
  if (value >= CONFIDENCE_BANDS.confident) return "Confident"
  if (value >= CONFIDENCE_BANDS.likely) return "Likely"
  return "Ambiguous"
}

export function ConfidenceMeter({
  value,
  label,
  showValue = false,
  className,
}: {
  value: number
  label?: string
  /** Show the raw percentage. Only on evaluation or debug views. */
  showValue?: boolean
  className?: string
}) {
  const pct = Math.round(value * 100)
  const band = confidenceBand(value)
  const ambiguous = band === "Ambiguous"
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)} title={`${pct}%`}>
      <Progress
        value={pct}
        aria-label={label ? `${label} confidence` : "Confidence"}
        aria-valuetext={`${band}, ${pct}%`}
        className={cn(
          "h-1.5 w-14 shrink-0",
          ambiguous ? "[&>[data-slot=progress-indicator]]:bg-warning" : "[&>[data-slot=progress-indicator]]:bg-info"
        )}
      />
      {showValue ? <span className="w-9 text-right font-mono text-xs">{pct}%</span> : null}
      <span className={cn("w-[4.5rem] text-xs", ambiguous ? "font-medium text-warning-fg" : "text-muted-foreground")}>
        {band}
      </span>
    </div>
  )
}
