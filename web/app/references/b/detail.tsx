"use client"

import * as React from "react"
import {
  ArrowRightIcon,
  CheckIcon,
  CircleCheckIcon,
  CopyIcon,
  GaugeIcon,
  HistoryIcon,
  InfoIcon,
  ListChecksIcon,
  ReplyIcon,
  SendIcon,
  SignalHighIcon,
  SignalLowIcon,
  SignalMediumIcon,
  SirenIcon,
  TriangleAlertIcon,
  WandSparklesIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Kbd } from "@/components/ui/kbd"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfidenceMeter, confidenceBand } from "@/components/sentinel/confidence"
import { AIMark } from "@/components/sentinel/ai"
import { cn } from "@/lib/utils"
import type { Precedent, Priority } from "@/lib/types"

import {
  PAST_LABELS,
  PRIORITY_OPTIONS,
  QUEUE_OPTIONS,
  TYPE_OPTIONS,
  type Field,
  type InboxTicket,
  type TicketState,
} from "./data"
import { DIR_B } from "./font"

export type DetailTab = "reply" | "brief"

const PRIORITY_META: Record<Priority, { label: string; Icon: typeof SignalHighIcon; tone: string }> = {
  high: { label: "High", Icon: SignalHighIcon, tone: "text-critical-fg" },
  medium: { label: "Medium", Icon: SignalMediumIcon, tone: "text-warning-fg" },
  low: { label: "Low", Icon: SignalLowIcon, tone: "text-success-fg" },
}

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  const { Icon, tone, label } = PRIORITY_META[priority]
  return <Icon role="img" aria-label={`${label} priority`} className={cn("shrink-0", tone, className ?? "size-3.5")} />
}

const FIELD_LABEL: Record<Field, string> = { type: "Type", queue: "Queue", priority: "Priority" }

function fieldDisplay(field: Field, value: string) {
  if (field !== "priority") return value
  return PRIORITY_META[value as Priority].label
}

function suggestion(ticket: InboxTicket, field: Field) {
  const t = ticket.result.triage
  if (field === "type") return { value: t.type as string, conf: t.type_conf }
  if (field === "queue") return { value: t.queue, conf: t.queue_conf }
  return { value: t.priority as string, conf: t.priority_conf }
}

function optionsFor(field: Field): string[] {
  if (field === "type") return TYPE_OPTIONS
  if (field === "queue") return QUEUE_OPTIONS
  return PRIORITY_OPTIONS
}

const pct = (v: number) => `${Math.round(v * 100)}%`

/* ---------- Citations ---------- */

function CitationChip({ id, precedent }: { id: string; precedent?: Precedent }) {
  if (!precedent) {
    return (
      <span className="ml-1 inline-flex h-[18px] items-center gap-1 rounded-sm bg-critical-tint px-1 align-[1px] font-mono text-[0.6875rem] text-critical-fg">
        <TriangleAlertIcon className="size-3" aria-hidden="true" />
        {id}
        <span className="sr-only">(citation not found in retrieved tickets)</span>
      </span>
    )
  }
  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="ml-1 inline-flex h-[18px] items-center rounded-sm bg-info-tint px-1 align-[1px] font-mono text-[0.6875rem] text-info-fg transition-colors duration-150 hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          aria-label={`Source ${id}: ${precedent.subject}`}
        >
          {id}
        </button>
      </HoverCardTrigger>
      <HoverCardContent className={cn(DIR_B, "w-80 p-3")} align="start">
        <PrecedentPreview precedent={precedent} />
      </HoverCardContent>
    </HoverCard>
  )
}

function PrecedentPreview({ precedent }: { precedent: Precedent }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <HistoryIcon className="size-3.5" aria-hidden="true" />
        <span className="font-mono text-foreground">{precedent.ticket_id}</span>
        <span>·</span>
        <span className="font-mono">{precedent.similarity.toFixed(2)} similar</span>
        {precedent.language ? (
          <Badge variant="outline" className="ml-auto h-4 px-1 font-mono text-[0.625rem] uppercase">
            {precedent.language}
          </Badge>
        ) : null}
      </div>
      <p className="text-[0.8125rem] font-medium leading-snug">{precedent.subject}</p>
      <p className="border-l-2 border-success pl-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
        {precedent.answer_snippet}
      </p>
    </div>
  )
}

// Renders text with [TKT-1, TKT-2] markers as chips.
function CitedText({ text, precedents }: { text: string; precedents: Precedent[] }) {
  const parts = text.split(/(\[[^\]]+\])/g)
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]$/)
        if (!m) return <React.Fragment key={i}>{part.replace(/\s+$/, i < parts.length - 1 ? " " : "")}</React.Fragment>
        return (
          <React.Fragment key={i}>
            {m[1].split(/,\s*/).map((id) => (
              <CitationChip key={id} id={id} precedent={precedents.find((p) => p.ticket_id === id)} />
            ))}
          </React.Fragment>
        )
      })}
    </>
  )
}

function ChipList({ ids, precedents }: { ids: string[]; precedents: Precedent[] }) {
  return (
    <span className="inline-flex flex-wrap gap-0.5">
      {ids.map((id) => (
        <CitationChip key={id} id={id} precedent={precedents.find((p) => p.ticket_id === id)} />
      ))}
    </span>
  )
}

/* ---------- Suggestion row (Linear triage intelligence) ---------- */

function WhyCard({ ticket, field, value }: { ticket: InboxTicket; field: Field; value: string }) {
  const { conf } = suggestion(ticket, field)
  const neighbors = ticket.result.precedents.map((p) => ({ p, label: PAST_LABELS[p.ticket_id]?.[field] as string | undefined }))
  const agree = neighbors.filter((n) => n.label === value).length
  const alternatives = Array.from(new Set(neighbors.map((n) => n.label).filter((l): l is string => !!l && l !== value)))
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[0.8125rem] font-medium">
          Why {fieldDisplay(field, value)} was suggested
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {agree} of {neighbors.length} nearest past tickets were labeled {fieldDisplay(field, value)}.
        </p>
      </div>
      <ConfidenceMeter value={conf} label={FIELD_LABEL[field]} />
      <ul className="flex flex-col gap-1.5" aria-label="Nearest past tickets">
        {neighbors.map(({ p, label }) => (
          <li key={p.ticket_id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground">{p.ticket_id}</span>
            <span className="truncate">{p.subject}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                label === value ? "text-success-fg" : "text-muted-foreground"
              )}
            >
              {label === value ? <CheckIcon className="size-3" aria-hidden="true" /> : null}
              {label ? fieldDisplay(field, label) : "--"}
            </span>
          </li>
        ))}
      </ul>
      {alternatives.length ? (
        <p className="text-xs text-muted-foreground">
          Alternative: <span className="font-medium text-foreground">{alternatives.map((a) => fieldDisplay(field, a)).join(", ")}</span>
        </p>
      ) : null}
    </div>
  )
}

function SuggestionRow({
  ticket,
  state,
  field,
  onAccept,
  onChange,
}: {
  ticket: InboxTicket
  state: TicketState
  field: Field
  onAccept: () => void
  onChange: (value: string) => void
}) {
  const s = suggestion(ticket, field)
  const cur = state.fields[field]
  const low = confidenceBand(s.conf) === "Ambiguous"
  const id = `${ticket.id}-${field}`
  return (
    <div className="grid grid-cols-1 items-center gap-x-3 gap-y-1 py-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:py-1.5">
      <span id={`${id}-label`} className="text-xs text-muted-foreground">
        {FIELD_LABEL[field]}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
        <Select value={cur.value} onValueChange={onChange}>
          <SelectTrigger
            size="sm"
            aria-labelledby={`${id}-label`}
            data-status={cur.status}
            className={cn(
              "h-7 max-w-full gap-1.5 rounded-md bg-transparent pr-1.5 pl-2 text-[0.8125rem] dark:bg-transparent",
              cur.status === "suggested"
                ? "border-dashed border-muted-foreground/60 hover:border-primary dark:border-muted-foreground/50"
                : "border-border bg-[var(--selected)] dark:bg-[var(--selected)]"
            )}
          >
            {field === "priority" ? <PriorityIcon priority={cur.value as Priority} /> : null}
            <span className="truncate">{fieldDisplay(field, cur.value)}</span>
            {cur.status !== "suggested" ? <CheckIcon className="size-3.5 text-primary" aria-hidden="true" /> : null}
          </SelectTrigger>
          <SelectContent className={DIR_B} position="popper" align="start">
            {optionsFor(field).map((o) => (
              <SelectItem key={o} value={o} className="text-[0.8125rem]">
                {fieldDisplay(field, o)}
                {o === s.value ? <span className="ml-1 text-xs text-muted-foreground">suggested</span> : null}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span
          className={cn(
            "inline-flex items-center gap-1 font-mono text-xs",
            low ? "font-medium text-warning-fg" : "text-muted-foreground"
          )}
        >
          {low ? <TriangleAlertIcon className="size-3" aria-hidden="true" /> : null}
          {pct(s.conf)}
          {low ? <span className="font-sans">Low</span> : null}
        </span>

        <HoverCard openDelay={150} closeDelay={100}>
          <HoverCardTrigger asChild>
            <button
              type="button"
              className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              aria-label={`Why ${fieldDisplay(field, s.value)} was suggested`}
            >
              <InfoIcon className="size-3.5" aria-hidden="true" />
              Why
            </button>
          </HoverCardTrigger>
          <HoverCardContent className={cn(DIR_B, "w-80 p-3")} align="start">
            <WhyCard ticket={ticket} field={field} value={s.value} />
          </HoverCardContent>
        </HoverCard>

        <div className="ml-auto flex items-center">
          {cur.status === "suggested" ? (
            <Button size="xs" variant="ghost" onClick={onAccept} className="text-primary hover:text-primary">
              <CheckIcon data-icon="inline-start" aria-hidden="true" />
              Accept
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              {cur.status === "changed" && cur.value !== s.value
                ? `Changed from ${fieldDisplay(field, s.value)}`
                : "Accepted"}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Draft, brief, precedents, latency ---------- */

function ReplyDraft({ ticket }: { ticket: InboxTicket }) {
  const { draft, precedents } = ticket.result
  const sentences = draft.reply.split(/(?<=\.)\s+/)
  const flagged = new Set(ticket.flagged ?? [])
  return (
    <div className="flex flex-col gap-3">
      <p lang={ticket.result.triage.language} className="text-sm leading-7">
        {sentences.map((s, i) =>
          flagged.has(s) ? (
            <span key={i}>
              <span className="uncited">{s}</span>
              <span className="mx-1 inline-flex h-[18px] items-center gap-1 rounded-sm bg-warning-tint px-1 align-[1px] text-[0.6875rem] font-medium text-warning-fg">
                <TriangleAlertIcon className="size-3" aria-hidden="true" />
                No source
              </span>{" "}
            </span>
          ) : (
            <span key={i}>
              <CitedText text={s} precedents={precedents} />{" "}
            </span>
          )
        )}
      </p>
      {flagged.size ? (
        <p role="status" className="flex items-start gap-1.5 text-xs text-warning-fg">
          <TriangleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          One sentence promises a credit no past ticket supports. Remove it before sending.
        </p>
      ) : null}
    </div>
  )
}

function IncidentBriefView({ ticket }: { ticket: InboxTicket }) {
  const b = ticket.brief
  const { precedents } = ticket.result
  if (!b) return null
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-[6.5rem_minmax(0,1fr)]">
      <dt className="text-xs text-muted-foreground sm:pt-0.5">Summary</dt>
      <dd className="leading-relaxed">{b.summary}</dd>
      <dt className="text-xs text-muted-foreground sm:pt-0.5">Likely cause</dt>
      <dd className="leading-relaxed">
        {b.cause} <ChipList ids={b.causeIds} precedents={precedents} />
        <span className="mt-0.5 block text-xs text-muted-foreground">Pattern match on {b.causeIds.length} past ticket{b.causeIds.length > 1 ? "s" : ""}</span>
      </dd>
      <dt className="text-xs text-muted-foreground sm:pt-0.5">Past fix</dt>
      <dd className="leading-relaxed">
        {b.pastFix} <ChipList ids={b.pastFixIds} precedents={precedents} />
      </dd>
      <dt className="text-xs text-muted-foreground sm:pt-0.5">First steps</dt>
      <dd>
        <ol className="flex flex-col gap-1.5">
          {b.steps.map((step, i) => (
            <li key={step} className="grid grid-cols-[1.25rem_minmax(0,1fr)] leading-relaxed">
              <span className="font-mono text-xs leading-6 text-muted-foreground">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </dd>
    </dl>
  )
}

function Precedents({ ticket }: { ticket: InboxTicket }) {
  const { precedents, draft } = ticket.result
  const used = new Set([...draft.cited_ticket_ids, ...(ticket.brief?.causeIds ?? []), ...(ticket.brief?.pastFixIds ?? [])])
  return (
    <section aria-labelledby="b-precedents" className="flex flex-col gap-2">
      <header className="flex items-baseline gap-2">
        <h3 id="b-precedents" className="text-[0.8125rem] font-medium">
          Similar past tickets
        </h3>
        <span className="text-xs text-muted-foreground">
          {precedents.length} found · {precedents.filter((p) => used.has(p.ticket_id)).length} cited
        </span>
      </header>
      <ul className="flex flex-col divide-y rounded-lg border bg-card">
        {precedents.map((p) => (
          <li key={p.ticket_id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 font-mono text-xs whitespace-nowrap text-muted-foreground">{p.ticket_id}</span>
              <span className="truncate text-[0.8125rem]">{p.subject}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative h-1 w-12 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${p.similarity * 100}%` }} />
              </span>
              <span className="w-8 text-right font-mono text-xs">{p.similarity.toFixed(2)}</span>
              {used.has(p.ticket_id) ? (
                <Badge variant="info" className="h-4 w-12 px-1 text-[0.625rem]">Cited</Badge>
              ) : (
                <Badge variant="outline" className="h-4 w-12 px-1 text-[0.625rem] text-muted-foreground">Found</Badge>
              )}
            </div>
            <p className="col-span-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground" lang={p.language || undefined}>
              {p.answer_snippet}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

const STAGES = [
  { key: "triage_ms", label: "Triage", mix: 100 },
  { key: "retrieval_ms", label: "Retrieve", mix: 78 },
  { key: "gate_ms", label: "Gate", mix: 58 },
  { key: "draft_ms", label: "Draft", mix: 42 },
] as const

function Latency({ ticket }: { ticket: InboxTicket }) {
  const t = ticket.result.timings_ms
  return (
    <section aria-labelledby="b-latency" className="flex flex-col gap-2">
      <header className="flex items-baseline gap-2">
        <h3 id="b-latency" className="flex items-center gap-1.5 text-[0.8125rem] font-medium">
          <GaugeIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
          Pipeline latency
        </h3>
        <span className="ml-auto font-mono text-xs">{t.total_ms.toLocaleString("en-US")} ms</span>
      </header>
      <div className="flex h-2 gap-px overflow-hidden rounded-full" role="img" aria-label={STAGES.map((s) => `${s.label} ${t[s.key]} ms`).join(", ")}>
        {STAGES.map((s) => (
          <span
            key={s.key}
            className="h-full min-w-[3px]"
            style={{
              flexGrow: t[s.key],
              background: `color-mix(in oklch, var(--primary) ${s.mix}%, var(--muted))`,
            }}
          />
        ))}
      </div>
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {STAGES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-[2px]"
              style={{ background: `color-mix(in oklch, var(--primary) ${s.mix}%, var(--muted))` }}
              aria-hidden="true"
            />
            <dt className="text-muted-foreground">{s.label}</dt>
            <dd className="font-mono">{t[s.key].toLocaleString("en-US")}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ---------- Detail panel ---------- */

export function TicketDetail({
  ticket,
  state,
  tab,
  onTab,
  onAcceptField,
  onChangeField,
  onAcceptAll,
  onEscalate,
  onReply,
  sendRef,
}: {
  ticket: InboxTicket
  state: TicketState
  tab: DetailTab
  onTab: (tab: DetailTab) => void
  onAcceptField: (field: Field) => void
  onChangeField: (field: Field, value: string) => void
  onAcceptAll: () => void
  onEscalate: () => void
  onReply: () => void
  sendRef: React.RefObject<HTMLButtonElement | null>
}) {
  const { result } = ticket
  const escalated = state.group === "escalated" || (state.group === "triage" && result.escalate)
  const pending = (Object.keys(state.fields) as Field[]).filter((f) => state.fields[f].status === "suggested").length
  const draftMock = result.sources.draft !== "real"
  const hasBrief = !!ticket.brief

  return (
    <article aria-labelledby="b-subject" className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-5 md:px-8 md:py-6">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-mono text-foreground">{ticket.id}</span>
          <span aria-hidden="true">·</span>
          <span>{ticket.customer}</span>
          <span aria-hidden="true">·</span>
          <span>{ticket.receivedMin} min ago</span>
          <Badge variant="outline" className="h-4 px-1 font-mono text-[0.625rem] uppercase">
            {result.triage.language}
          </Badge>
          <StatusPill state={state} />
        </div>
        <h1 id="b-subject" className="text-lg font-semibold leading-snug tracking-[-0.01em]" lang={result.triage.language}>
          {ticket.subject}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground" lang={result.triage.language}>
          {ticket.body}
        </p>
      </header>

      {/* Primary actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onAcceptAll} disabled={state.group !== "triage"}>
          <ListChecksIcon data-icon="inline-start" aria-hidden="true" />
          {state.group === "triage" ? `Accept all${pending < 3 ? ` (${pending} left)` : ""}` : "Triaged"}
          <Kbd className="ml-1 hidden bg-primary-foreground/20 text-primary-foreground md:inline-flex">A</Kbd>
        </Button>
        <Button size="sm" variant="outline" onClick={onEscalate} disabled={state.group === "escalated"}>
          <SirenIcon data-icon="inline-start" aria-hidden="true" />
          Escalate
          <Kbd className="ml-1 hidden md:inline-flex">E</Kbd>
        </Button>
        <Button size="sm" variant="ghost" onClick={onReply}>
          <ReplyIcon data-icon="inline-start" aria-hidden="true" />
          Reply
          <Kbd className="ml-1 hidden md:inline-flex">R</Kbd>
        </Button>
      </div>

      {/* Triage intelligence */}
      <section aria-labelledby="b-triage" className="rounded-lg border bg-card px-4 pt-3 pb-2">
        <header className="flex items-center gap-2 pb-1">
          <WandSparklesIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <h2 id="b-triage" className="text-[0.8125rem] font-medium">
            Triage intelligence
          </h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {pending ? `${pending} suggestion${pending > 1 ? "s" : ""} to review` : "All fields set"}
          </span>
        </header>
        <div className="divide-y divide-border/60">
          {(["type", "queue", "priority"] as Field[]).map((f) => (
            <SuggestionRow
              key={f}
              ticket={ticket}
              state={state}
              field={f}
              onAccept={() => onAcceptField(f)}
              onChange={(v) => onChangeField(f, v)}
            />
          ))}
          <div className="grid grid-cols-1 items-start gap-x-3 gap-y-1 py-2 sm:grid-cols-[5rem_minmax(0,1fr)]">
            <span className="pt-0.5 text-xs text-muted-foreground">Decision</span>
            <Decision escalated={escalated} byHand={state.byHand} reasons={result.reasons} />
          </div>
        </div>
      </section>

      {/* Gemini output */}
      <section className="ai-surface rounded-lg pt-1" aria-label="Gemini output">
        <Tabs value={tab} onValueChange={(v) => onTab(v as DetailTab)} className="gap-0">
          <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
            <AIMark label="Generated by Gemini" />
            <TabsList variant="line" className="h-7">
              <TabsTrigger value="reply" className="px-2 text-[0.8125rem]">
                Reply draft
              </TabsTrigger>
              {hasBrief ? (
                <TabsTrigger value="brief" className="px-2 text-[0.8125rem]">
                  Incident brief
                </TabsTrigger>
              ) : null}
            </TabsList>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              {draftMock ? (
                <Badge variant="outline" className="h-4 px-1 text-[0.625rem]">
                  Mock
                </Badge>
              ) : null}
              <span className="font-mono">{(result.timings_ms.draft_ms / 1000).toFixed(2)} s</span>
            </div>
          </div>
          <TabsContent value="reply" className="flex flex-col gap-3 px-4 py-4">
            <ReplyDraft ticket={ticket} />
            <div className="flex flex-wrap items-center gap-2">
              <Button ref={sendRef} size="sm">
                <SendIcon data-icon="inline-start" aria-hidden="true" />
                {escalated ? "Send holding reply" : "Send reply"}
              </Button>
              <Button size="sm" variant="ghost">
                <CopyIcon data-icon="inline-start" aria-hidden="true" />
                Copy
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                Language {result.triage.language === "de" ? "German" : "English"}, matches customer
              </span>
            </div>
          </TabsContent>
          {hasBrief ? (
            <TabsContent value="brief" className="px-4 py-4">
              <IncidentBriefView ticket={ticket} />
            </TabsContent>
          ) : null}
        </Tabs>
      </section>

      <Precedents ticket={ticket} />
      <Latency ticket={ticket} />
    </article>
  )
}

function Decision({ escalated, byHand, reasons }: { escalated: boolean; byHand: boolean; reasons: string[] }) {
  if (!escalated) {
    return (
      <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-success-fg">
        <CircleCheckIcon className="size-3.5" aria-hidden="true" />
        Auto-draft ready
      </p>
    )
  }
  return (
    <div role="status" className="min-w-0">
      <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-critical-fg">
        <SirenIcon className="size-3.5" aria-hidden="true" />
        Escalate to on-call engineer
      </p>
      <ul className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
        {(byHand ? ["Escalated by you", ...reasons] : reasons).map((r) => (
          <li key={r} className="flex items-start gap-1.5">
            <ArrowRightIcon className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatusPill({ state }: { state: TicketState }) {
  if (state.group === "triage")
    return (
      <Badge variant="outline" className="h-4 px-1.5 text-[0.625rem]">
        Needs triage
      </Badge>
    )
  if (state.group === "escalated")
    return (
      <Badge variant="critical" className="h-4 px-1.5 text-[0.625rem]">
        <SirenIcon data-icon="inline-start" aria-hidden="true" />
        Escalated
      </Badge>
    )
  return (
    <Badge variant="success" className="h-4 px-1.5 text-[0.625rem]">
      <CircleCheckIcon data-icon="inline-start" aria-hidden="true" />
      Auto-drafted
    </Badge>
  )
}
