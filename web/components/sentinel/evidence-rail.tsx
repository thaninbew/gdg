"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { MockBadge } from "@/components/sentinel/case-outcome"
import { useCitation } from "@/components/sentinel/grounded-reply"
import { TicketId } from "@/components/sentinel/status"
import { useI18n } from "@/lib/i18n"
import type { CasePrecedent } from "@/lib/types"
import { cn } from "@/lib/utils"

// Past tickets the copilot retrieved. Cited ones are marked; hovering a citation highlights its card.
export function EvidenceRail({ precedents, cited, mock }: { precedents: CasePrecedent[]; cited: Set<string>; mock?: boolean }) {
  const { activeId } = useCitation()
  const { t } = useI18n()
  const [open, setOpen] = React.useState<string | null>(null)

  return (
    <section aria-labelledby="evidence-title" className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 id="evidence-title" className="text-sm font-semibold">
          {t("Evidence")}
        </h2>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{t(`${precedents.length} precedents`)}</span>
        {mock ? <MockBadge /> : null}
      </div>
      {!precedents.length ? (
        <Empty className="border bg-card p-6">
          <EmptyHeader>
            <EmptyDescription>{t("No similar past tickets found.")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      <ol className="flex flex-col gap-2">
        {precedents.map((p, i) => {
          const expanded = open === p.ticket_id
          return (
            <li
              key={p.ticket_id}
              className={cn(
                "rounded-lg border bg-card p-3 transition-colors duration-150",
                activeId === p.ticket_id && "border-primary bg-info-tint"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-[0.6875rem] font-semibold",
                    cited.has(p.ticket_id) ? "bg-info-tint text-info-fg" : "bg-muted text-muted-foreground"
                  )}
                  aria-label={t(cited.has(p.ticket_id) ? `Source ${i + 1}, cited` : `Source ${i + 1}`)}
                >
                  {i + 1}
                </span>
                <TicketId id={p.ticket_id} />
                <span className="text-xs text-muted-foreground uppercase">{p.language}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{p.similarity.toFixed(2)}</span>
              </div>
              <p className="mt-2 text-[0.8125rem] font-medium">{p.subject}</p>
              <p className="text-xs text-muted-foreground">{p.queue}</p>
              <p className={cn("mt-2 text-[0.8125rem] leading-5 text-muted-foreground", !expanded && "line-clamp-3")}>
                {p.answer_snippet}
              </p>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : p.ticket_id)}
                aria-expanded={expanded}
                className="mt-1 inline-flex items-center gap-1 rounded-sm text-xs font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {t(expanded ? "Less" : "More")}
                <ChevronDownIcon className={cn("size-3.5 transition-transform duration-150", expanded && "rotate-180")} aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
