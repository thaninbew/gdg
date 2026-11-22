"use client"

import { CircleCheckIcon, MessageCircleQuestionIcon, SirenIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"
import type { CaseOutcome } from "@/lib/types"

const OUTCOME = {
  clarify: { label: "Clarify", variant: "warning", Icon: MessageCircleQuestionIcon },
  escalate: { label: "Escalate", variant: "critical", Icon: SirenIcon },
  draft: { label: "Draft ready", variant: "success", Icon: CircleCheckIcon },
} as const

// Where a ticket stands after the gate: needs a clarifying answer, escalated, or draft ready.
export function OutcomeBadge({ outcome, className }: { outcome: CaseOutcome; className?: string }) {
  const { t } = useI18n()
  const { label, variant, Icon } = OUTCOME[outcome]
  return (
    <Badge variant={variant} className={className}>
      <Icon data-icon="inline-start" aria-hidden="true" />
      {t(label)}
    </Badge>
  )
}

/** Shown on a panel whose data is not from the real pipeline (`sources[stage] !== "real"`). */
export function MockBadge() {
  const { t } = useI18n()
  return <Badge variant="outline">{t("Mock")}</Badge>
}
