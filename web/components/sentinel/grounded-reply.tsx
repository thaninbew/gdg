"use client"

import * as React from "react"
import { TriangleAlertIcon } from "lucide-react"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { TicketId } from "@/components/sentinel/status"
import type { Draft, Precedent, SentenceCheck } from "@/lib/types"
import { cn } from "@/lib/utils"

// Grounded text, promoted from reference D. Citations look like [TKT-12345] or [TKT-1, TKT-2].
// Sentence support comes from the drafter (Draft.sentences), not from the UI.

const CITE = /\s*\[(TKT-\d{5}(?:\s*,\s*TKT-\d{5})*)\]/g

type Segment = { type: "text"; value: string } | { type: "cite"; ids: string[] }

function segmentsOf(text: string): Segment[] {
  const out: Segment[] = []
  let last = 0
  for (const m of text.matchAll(CITE)) {
    if (m.index > last) out.push({ type: "text", value: text.slice(last, m.index) })
    out.push({ type: "cite", ids: m[1].split(",").map((s) => s.trim()) })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) })
  return out
}

export function citedIds(text: string) {
  return new Set([...text.matchAll(CITE)].flatMap((m) => m[1].split(",").map((s) => s.trim())))
}

type CiteCtx = { precedents: Precedent[]; activeId: string | null; setActiveId: (id: string | null) => void }
const CiteContext = React.createContext<CiteCtx | null>(null)

export function CitationProvider({ precedents, children }: { precedents: Precedent[]; children: React.ReactNode }) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const value = React.useMemo(() => ({ precedents, activeId, setActiveId }), [precedents, activeId])
  return <CiteContext.Provider value={value}>{children}</CiteContext.Provider>
}

export function useCitation() {
  const ctx = React.useContext(CiteContext)
  if (!ctx) throw new Error("useCitation must be used inside CitationProvider")
  return ctx
}

function CitationChip({ id }: { id: string }) {
  const { precedents, activeId, setActiveId } = useCitation()
  const [open, setOpen] = React.useState(false)
  const index = precedents.findIndex((p) => p.ticket_id === id)
  const p = precedents[index]
  const set = (o: boolean) => {
    setOpen(o)
    setActiveId(o ? id : null)
  }

  if (!p) {
    return (
      <span className="mx-0.5 inline-flex h-5 items-center rounded-md bg-critical-tint px-1.5 align-[0.15em] font-mono text-[0.6875rem] font-semibold text-critical-fg">
        <span className="sr-only">Invalid citation </span>
        {id}
      </span>
    )
  }

  return (
    <HoverCard open={open} onOpenChange={set} openDelay={120} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={() => set(true)}
          onFocus={() => set(true)}
          onBlur={() => set(false)}
          aria-label={`Source ${index + 1}: ${p.ticket_id}`}
          className={cn(
            "ml-1 inline-flex size-5 items-center justify-center rounded-md align-[0.15em] font-mono text-[0.6875rem] font-semibold transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            activeId === id
              ? "bg-primary text-primary-foreground"
              : "bg-info-tint text-info-fg hover:bg-primary hover:text-primary-foreground"
          )}
        >
          {index + 1}
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <TicketId id={p.ticket_id} className="font-medium" />
          <span className="text-xs text-muted-foreground uppercase">{p.language}</span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">{p.similarity.toFixed(2)}</span>
        </div>
        <div className="flex flex-col gap-1.5 px-3 py-2.5">
          <p className="text-[0.8125rem] font-medium">{p.subject}</p>
          <blockquote className="line-clamp-4 border-l-2 border-info pl-2.5 text-[0.8125rem] leading-5 text-muted-foreground">
            {p.answer_snippet}
          </blockquote>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

/** Inline text with numbered citation chips. */
export function CitedText({ text }: { text: string }) {
  return (
    <>
      {segmentsOf(text).map((seg, i) =>
        seg.type === "text" ? (
          <React.Fragment key={i}>{seg.value}</React.Fragment>
        ) : (
          <span key={i} className="whitespace-nowrap">
            {seg.ids.map((id) => (
              <CitationChip key={id} id={id} />
            ))}
          </span>
        )
      )}
    </>
  )
}

// A sentence is a claim unless the drafter treated it as a greeting, courtesy line or sign-off.
const isClaim = (c: SentenceCheck) => !(c.supported && c.source_ticket_id === null)

export function GroundingBar({ sentences }: { sentences: SentenceCheck[] }) {
  const claims = sentences.filter(isClaim)
  const supported = claims.filter((c) => c.supported).length
  const unsupported = claims.length - supported
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.8125rem]">
      <div className="flex h-1.5 w-28 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {claims.map((c, i) => (
          <span key={i} className={cn("flex-1", c.supported ? "bg-success" : "bg-warning")} />
        ))}
      </div>
      <span className="font-medium">
        {supported} of {claims.length} grounded
      </span>
      {unsupported ? (
        <span className="inline-flex items-center gap-1 text-warning-fg">
          <TriangleAlertIcon className="size-3.5" aria-hidden="true" />
          {unsupported} unsupported
        </span>
      ) : null}
    </div>
  )
}

const LIST_NUM = /^\s*(\d{1,2}\.)\s+/

/** Pairs each reply line with the drafter's sentence checks, in order, so lists and breaks survive. */
function linesWithChecks(reply: string, sentences: SentenceCheck[]) {
  let i = 0
  return reply.split("\n").map((raw) => {
    const line = raw.trim()
    const checks: SentenceCheck[] = []
    while (i < sentences.length && line.includes(sentences[i].text)) checks.push(sentences[i++])
    return { line, marker: line.match(LIST_NUM)?.[1] ?? null, checks }
  })
}

/** The draft, sentence by sentence: supported claims get a green underline, unsupported ones a warning. */
export function GroundedReply({ draft, lang, editing }: { draft: Draft; lang: string; editing?: boolean }) {
  const { activeId } = useCitation()
  const lines = linesWithChecks(draft.reply, draft.sentences)

  return (
    <div className="flex flex-col gap-4">
      <GroundingBar sentences={draft.sentences} />
      <div
        lang={lang}
        contentEditable={editing}
        suppressContentEditableWarning
        className={cn(
          "text-[0.9375rem] leading-7 text-pretty outline-none",
          editing && "rounded-md ring-2 ring-ring/50 ring-offset-4 ring-offset-card"
        )}
      >
        {lines.map(({ line, marker, checks }, i) => {
          if (!line) return <div key={i} className="h-3" aria-hidden="true" />
          if (!checks.length) return <p key={i}>{line}</p>
          return (
            <p key={i}>
              {marker ? <span className="mr-1.5 tabular-nums">{marker}</span> : null}
              {checks.map((c, j) => {
                const space = j < checks.length - 1 ? " " : null
                if (!isClaim(c)) return <React.Fragment key={j}>{c.text}{space}</React.Fragment>
                if (c.supported)
                  return (
                    <React.Fragment key={j}>
                      <span
                        className={cn(
                          "rounded-sm underline decoration-success/50 decoration-[1.5px] underline-offset-[7px] box-decoration-clone transition-colors duration-150",
                          activeId !== null && citedIds(c.text).has(activeId) && "bg-info-tint"
                        )}
                      >
                        <span className="sr-only">Supported: </span>
                        <CitedText text={c.text} />
                      </span>
                      {space}
                    </React.Fragment>
                  )
                return (
                  <React.Fragment key={j}>
                    <span className="rounded-sm bg-warning-tint px-1 underline decoration-warning decoration-dotted decoration-2 underline-offset-[7px] box-decoration-clone">
                      <TriangleAlertIcon className="mr-1 inline size-4 -translate-y-px text-warning-fg" aria-hidden="true" />
                      <span className="sr-only">Unsupported: </span>
                      <CitedText text={c.text} />
                    </span>
                    {space}
                  </React.Fragment>
                )
              })}
            </p>
          )
        })}
      </div>
    </div>
  )
}
