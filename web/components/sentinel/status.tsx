import { SignalHighIcon, SignalLowIcon, SignalMediumIcon, SirenIcon, CircleCheckIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Priority } from "@/lib/types"

const PRIORITY = {
  high: { label: "High", variant: "critical", Icon: SignalHighIcon },
  medium: { label: "Medium", variant: "warning", Icon: SignalMediumIcon },
  low: { label: "Low", variant: "success", Icon: SignalLowIcon },
} as const

// Color plus a signal-strength icon, so priority never depends on color alone.
export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const { label, variant, Icon } = PRIORITY[priority]
  return (
    <Badge variant={variant} className={className}>
      <Icon data-icon="inline-start" aria-hidden="true" />
      {label}
    </Badge>
  )
}

export function TicketId({ id, className }: { id: string; className?: string }) {
  return <span className={cn("font-mono text-[0.8125rem] tracking-tight", className)}>{id}</span>
}

// The gate decision. Escalations always list their reasons.
export function EscalationStatus({ escalate, reasons }: { escalate: boolean; reasons: string[] }) {
  if (!escalate) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-success-tint px-3 py-2.5 text-success-fg">
        <CircleCheckIcon className="size-4 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium">Auto-draft ready</p>
      </div>
    )
  }
  return (
    <div role="status" className="rounded-lg bg-critical-tint px-3 py-2.5 text-critical-fg">
      <div className="flex items-center gap-2">
        <SirenIcon className="size-4 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium">Escalate to on-call engineer</p>
      </div>
      {reasons.length ? (
        <ul className="mt-1.5 ml-6 list-disc space-y-0.5 text-[0.8125rem] marker:text-critical/60">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
