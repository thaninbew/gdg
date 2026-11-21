import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// Bands match the gate's default thresholds; change both together.
export const CONFIDENCE_BANDS = { high: 0.8, medium: 0.6 } as const

export function confidenceBand(value: number) {
  if (value >= CONFIDENCE_BANDS.high) return "High"
  if (value >= CONFIDENCE_BANDS.medium) return "Medium"
  return "Low"
}

export function ConfidenceMeter({
  value,
  label,
  className,
}: {
  value: number
  label?: string
  className?: string
}) {
  const pct = Math.round(value * 100)
  const band = confidenceBand(value)
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <Progress
        value={pct}
        aria-label={label ? `${label} confidence` : "Confidence"}
        className={cn(
          "h-1.5 w-16 shrink-0",
          band === "Low" ? "[&>[data-slot=progress-indicator]]:bg-warning" : "[&>[data-slot=progress-indicator]]:bg-info"
        )}
      />
      <span className="w-9 text-right font-mono text-xs">{pct}%</span>
      <span className={cn("w-12 text-xs", band === "Low" ? "font-medium text-warning-fg" : "text-muted-foreground")}>
        {band}
      </span>
    </div>
  )
}
