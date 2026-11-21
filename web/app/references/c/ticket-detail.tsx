"use client"

import { Fragment } from "react"
import { CircleAlertIcon, CopyIcon, OrbitIcon, SendIcon } from "lucide-react"

import { ConfidenceMeter } from "@/components/sentinel/confidence"
import { EscalationStatus, PriorityBadge, TicketId } from "@/components/sentinel/status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Precedent } from "@/lib/types"
import { cn } from "@/lib/utils"
import { LatencyBar } from "./charts"
import { DETAILS, type Detail, type TicketRow } from "./data"

// Local AI mark: our own glyph filled with the Night Watch gradient, defined inside the wrapper.
export function AiMark({ className }: { className?: string }) {
  return (
    <>
      <svg width="0" height="0" aria-hidden="true" focusable="false" className="absolute">
        <defs>
          <linearGradient id="dirc-ai" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--nw-iris)" }} />
            <stop offset="40%" style={{ stopColor: "var(--nw-jade)" }} />
            <stop offset="70%" style={{ stopColor: "var(--warning)" }} />
            <stop offset="100%" style={{ stopColor: "var(--nw-ember)" }} />
          </linearGradient>
        </defs>
      </svg>
      <OrbitIcon aria-hidden="true" className={cn("size-4 shrink-0 [&_*]:stroke-[url(#dirc-ai)]", className)} />
    </>
  )
}

function Citation({ id, precedents }: { id: string; precedents: Precedent[] }) {
  const p = precedents.find((x) => x.ticket_id === id)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="mx-0.5 inline-flex h-5 items-center rounded-sm bg-info-tint px-1 align-baseline font-mono text-[0.75rem] text-info-fg transition-colors duration-150 hover:bg-info-tint/70 focus-visible:outline-2 focus-visible:outline-ring"
        >
          {id}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72">
        {p ? (
          <span>
            <span className="font-mono">{Math.round(p.similarity * 100)}% similar</span> · {p.subject}
          </span>
        ) : (
          "Not in retrieved precedents"
        )}
      </TooltipContent>
    </Tooltip>
  )
}

// Renders text with [TKT-…] citations as chips and flagged sentences underlined.
function Grounded({ text, precedents, flagged = [] }: { text: string; precedents: Precedent[]; flagged?: Detail["flagged"] }) {
  const flags = flagged ?? []
  const pattern = flags.length ? new RegExp(`(${flags.map((f) => f.sentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`) : null
  const segments = pattern ? text.split(pattern) : [text]
  return (
    <>
      {segments.map((seg, i) => {
        const flag = flags.find((f) => f.sentence === seg)
        if (flag) {
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <mark
                  tabIndex={0}
                  className="rounded-sm bg-warning-tint px-0.5 text-warning-fg underline decoration-warning decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {seg}
                </mark>
              </TooltipTrigger>
              <TooltipContent>{flag.note}</TooltipContent>
            </Tooltip>
          )
        }
        return (
          <Fragment key={i}>
            {seg.split(/(\[TKT-\d+(?:, TKT-\d+)*\])/).map((part, j) => {
              const m = part.match(/^\[(.*)\]$/)
              if (!m) return <Fragment key={j}>{part}</Fragment>
              return (
                <span key={j} className="whitespace-nowrap">
                  {m[1].split(", ").map((id) => (
                    <Citation key={id} id={id} precedents={precedents} />
                  ))}
                </span>
              )
            })}
          </Fragment>
        )
      })}
    </>
  )
}

function Panel({ title, action, children, className }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-3 border-t px-4 py-4 first:border-t-0", className)}>
      <header className="flex min-h-6 items-center gap-2">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
        {action ? <div className="ml-auto flex items-center gap-1.5">{action}</div> : null}
      </header>
      {children}
    </section>
  )
}

export function TicketDetail({ row }: { row: TicketRow }) {
  const detail: Detail = DETAILS[row.detail]
  const { result, brief, flagged } = detail
  const t = result.triage
  const cited = new Set(result.draft.cited_ticket_ids)
  const draftIsMock = result.sources.draft !== "real"

  const reply = (
    <div className="flex flex-col gap-3">
      <p lang={t.language} className="text-sm leading-relaxed">
        <Grounded text={result.draft.reply} precedents={result.precedents} flagged={flagged} />
      </p>
      {flagged?.length ? (
        <p role="status" className="flex items-start gap-1.5 text-xs text-warning-fg">
          <CircleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {flagged.length} uncited sentence. Remove it or add a source before sending.
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={!!flagged?.length || result.escalate}>
          <SendIcon data-icon="inline-start" aria-hidden="true" />
          Send reply
        </Button>
        <Button size="sm" variant="outline">
          <CopyIcon data-icon="inline-start" aria-hidden="true" />
          Copy
        </Button>
        {result.escalate ? <span className="text-xs text-muted-foreground">Held until the engineer confirms</span> : null}
      </div>
    </div>
  )

  return (
    <article aria-labelledby="dirc-detail-title" className="flex min-w-0 flex-col">
      <header className="flex flex-col gap-1.5 px-4 pt-4 pb-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <TicketId id={row.id} className="text-foreground" />
          <span aria-hidden="true">·</span>
          <span className="font-mono">{row.received}</span>
          <Badge variant="outline" className="font-mono uppercase">
            {row.language}
          </Badge>
          {row.cluster ? (
            <Badge variant="critical">VPN cluster</Badge>
          ) : null}
        </div>
        <h2 id="dirc-detail-title" className="text-base font-semibold text-balance">
          {row.subject}
        </h2>
        <p lang={row.language} className="text-[0.8125rem] leading-relaxed text-muted-foreground">
          {row.body}
        </p>
      </header>

      <div className="px-4 pb-1">
        <EscalationStatus escalate={result.escalate} reasons={result.reasons} />
      </div>

      <Panel title="Triage">
        <dl className="grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="truncate">{t.type}</dd>
          <dd>
            <ConfidenceMeter value={t.type_conf} label="Type" />
          </dd>
          <dt className="text-muted-foreground">Queue</dt>
          <dd className="truncate">{t.queue}</dd>
          <dd>
            <ConfidenceMeter value={t.queue_conf} label="Queue" />
          </dd>
          <dt className="text-muted-foreground">Priority</dt>
          <dd>
            <PriorityBadge priority={t.priority} />
          </dd>
          <dd>
            <ConfidenceMeter value={t.priority_conf} label="Priority" />
          </dd>
        </dl>
      </Panel>

      <section className="px-4 py-3">
        <div className="ai-surface flex flex-col gap-3 rounded-lg p-4">
          {brief ? (
            <Tabs defaultValue="brief" className="gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <AiMark />
                <TabsList variant="line" className="h-7">
                  <TabsTrigger value="brief" className="text-[0.8125rem]">
                    Incident brief
                  </TabsTrigger>
                  <TabsTrigger value="reply" className="text-[0.8125rem]">
                    Reply draft
                  </TabsTrigger>
                </TabsList>
                {draftIsMock ? <Badge variant="outline" className="ml-auto">Mock</Badge> : null}
              </div>
              <TabsContent value="brief" className="flex flex-col gap-3 text-sm leading-relaxed">
                <p>
                  <Grounded text={brief.summary} precedents={result.precedents} />
                </p>
                <dl className="grid gap-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Likely cause</dt>
                    <dd>
                      <Grounded text={brief.cause} precedents={result.precedents} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Past fix</dt>
                    <dd>
                      <Grounded text={brief.pastFix} precedents={result.precedents} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">First steps</dt>
                    <dd>
                      <ol className="mt-0.5 ml-4 list-decimal space-y-0.5 marker:font-mono marker:text-muted-foreground">
                        {brief.steps.map((s) => (
                          <li key={s}>
                            <Grounded text={s} precedents={result.precedents} />
                          </li>
                        ))}
                      </ol>
                    </dd>
                  </div>
                </dl>
              </TabsContent>
              <TabsContent value="reply">{reply}</TabsContent>
            </Tabs>
          ) : (
            <>
              <header className="flex items-center gap-2">
                <AiMark />
                <h3 className="text-sm font-medium">Reply draft</h3>
                <Badge variant="outline" className="font-mono uppercase">
                  {t.language}
                </Badge>
                {draftIsMock ? (
                  <Badge variant="outline" className="ml-auto">
                    Mock
                  </Badge>
                ) : null}
              </header>
              {reply}
            </>
          )}
        </div>
      </section>

      <Panel title={`Precedents · ${result.precedents.length}`}>
        <ul className="flex flex-col divide-y">
          {result.precedents.map((p) => (
            <li key={p.ticket_id} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2">
                <TicketId id={p.ticket_id} />
                <span className="relative h-1 w-14 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <span className="absolute inset-y-0 left-0 bg-info" style={{ width: `${p.similarity * 100}%` }} />
                </span>
                <span className="font-mono text-xs">{Math.round(p.similarity * 100)}%</span>
                {p.language ? <span className="font-mono text-xs text-muted-foreground uppercase">{p.language}</span> : null}
                {cited.has(p.ticket_id) ? (
                  <Badge variant="info" className="ml-auto">
                    Cited
                  </Badge>
                ) : (
                  <span className="ml-auto text-xs text-muted-foreground">Found, not cited</span>
                )}
              </div>
              <p className="truncate text-[0.8125rem] font-medium" lang={p.language || undefined}>
                {p.subject}
              </p>
              <p className="line-clamp-2 text-[0.8125rem] text-muted-foreground" lang={p.language || undefined}>
                {p.answer_snippet}
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="Latency"
        action={<span className="font-mono text-sm">{result.timings_ms.total_ms.toLocaleString()} ms</span>}
      >
        <LatencyBar timings={result.timings_ms} />
      </Panel>
    </article>
  )
}
