"use client"

import { TriangleAlertIcon } from "lucide-react"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { TicketId } from "@/components/sentinel/status"
import type { Precedent } from "@/lib/types"
import { cn } from "@/lib/utils"

const CITE = /\[(TKT-\d{5}(?:,\s*TKT-\d{5})*)\]/g
// Courtesy and process sentences need no precedent; everything else is a claim that does.
const COURTESY =
  /^(thank|thanks|vielen dank|we will update|wir melden uns|let us know|geben sie uns|ein techniker|a technician|bitte kontrollieren)/i

export type Sentence = { text: string; cited: boolean; courtesy: boolean; unsupported: boolean }

export function splitSentences(text: string): Sentence[] {
  return text
    .split(/(?<=[^\d][.!?])\s+(?=[A-ZÄÖÜ])/)
    .filter(Boolean)
    .map((s) => {
      const cited = new RegExp(CITE.source).test(s)
      const courtesy = !cited && COURTESY.test(s.trim())
      return { text: s, cited, courtesy, unsupported: !cited && !courtesy }
    })
}

export function citedIds(text: string) {
  return [...text.matchAll(CITE)].flatMap((m) => m[1].split(/,\s*/))
}

function CitationChip({
  id,
  precedent,
  onOpen,
}: {
  id: string
  precedent?: Precedent
  onOpen?: (id: string) => void
}) {
  if (!precedent) {
    return (
      <span
        className="mx-0.5 inline-flex h-[1.125rem] items-center gap-0.5 rounded-sm bg-critical-tint px-1 align-[0.0625rem] leading-none font-mono text-[0.6875rem] font-medium text-critical-fg"
        title="This ticket was not retrieved for this reply"
      >
        <TriangleAlertIcon className="size-3" aria-hidden="true" />
        {id}
        <span className="sr-only"> (invalid citation)</span>
      </span>
    )
  }
  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={() => onOpen?.(id)}
          className="mx-0.5 inline-flex h-[1.125rem] items-center rounded-sm border border-info/25 bg-info-tint px-1 align-[0.0625rem] font-mono text-[0.6875rem] leading-none font-medium text-info-fg transition-colors duration-150 hover:border-info/60 focus-visible:outline-2 focus-visible:outline-ring"
          aria-label={`Citation ${id}: ${precedent.subject}`}
        >
          {id}
        </button>
      </HoverCardTrigger>
      {/* Portals render outside the wrapper, so the content re-applies the direction's tokens. */}
      <HoverCardContent align="start" className="dir-a w-80 p-3 font-sans">
        <div>
          <div className="flex items-center gap-2">
            <TicketId id={precedent.ticket_id} className="text-xs" />
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {Math.round(precedent.similarity * 100)}% similar
            </span>
          </div>
          <p className="mt-1 text-sm font-medium">{precedent.subject}</p>
          <p className="mt-2 border-l-2 border-success pl-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
            {precedent.answer_snippet}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

/** Text with [TKT-…] markers rendered as hoverable citation chips. */
export function CitedText({
  text,
  precedents,
  onOpen,
}: {
  text: string
  precedents: Precedent[]
  onOpen?: (id: string) => void
}) {
  const parts: React.ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(CITE)) {
    const idx = m.index ?? 0
    parts.push(text.slice(last, idx).replace(/\s+$/, " "))
    for (const id of m[1].split(/,\s*/)) {
      parts.push(
        <CitationChip
          key={`${idx}-${id}`}
          id={id}
          precedent={precedents.find((p) => p.ticket_id === id)}
          onOpen={onOpen}
        />
      )
    }
    last = idx + m[0].length
  }
  parts.push(text.slice(last))
  return <>{parts}</>
}

/** A draft rendered sentence by sentence; uncited claims are marked as caution. */
export function GroundedDraft({
  text,
  precedents,
  onOpen,
}: {
  text: string
  precedents: Precedent[]
  onOpen?: (id: string) => void
}) {
  const sentences = splitSentences(text)
  return (
    <p className="text-sm leading-6">
      {sentences.map((s, i) => (
        <span key={i}>
          <span
            className={cn(
              s.unsupported &&
                "rounded-sm bg-warning-tint decoration-warning decoration-2 underline-offset-4 [text-decoration-line:underline] [text-decoration-style:wavy]"
            )}
            title={s.unsupported ? "No retrieved precedent supports this sentence" : undefined}
          >
            <CitedText text={s.text} precedents={precedents} onOpen={onOpen} />
            {s.unsupported ? <span className="sr-only"> (unsupported claim)</span> : null}
          </span>{" "}
        </span>
      ))}
    </p>
  )
}
