"use client"

import * as React from "react"
import {
  CheckIcon,
  CircleCheckIcon,
  CopyIcon,
  LaptopIcon,
  RotateCcwIcon,
  ScanSearchIcon,
  SirenIcon,
  TimerIcon,
  TriangleAlertIcon,
  UnplugIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AISurface } from "@/components/sentinel/ai"
import { ConfidenceMeter } from "@/components/sentinel/confidence"
import { Wordmark } from "@/components/sentinel/logo"
import { PriorityBadge, TicketId } from "@/components/sentinel/status"
import { cn } from "@/lib/utils"
import type { PipelineResult, Precedent, Priority, SentenceCheck } from "@/lib/types"

import { SAMPLES } from "./samples"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const TIMEOUT_MS = 90_000
const MAX_REASONS = 3
const LANG_NAME: Record<string, string> = { en: "English", de: "German" }

type Ticket = { subject: string; body: string }

type State =
  | { status: "idle" }
  | { status: "loading"; ticket: Ticket; startedAt: number }
  | { status: "error"; ticket: Ticket; title: string; detail: string }
  | { status: "done"; ticket: Ticket; result: PipelineResult }

/* ------------------------------------------------------------------ helpers */

function formatMs(ms: number) {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`
}

function isPriority(p: string | undefined): p is Priority {
  return p === "high" || p === "medium" || p === "low"
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Highlight whole-word, case-insensitive matches. Unicode-aware so umlauts and accents count as letters.
function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  const clean = terms.map((t) => t.trim()).filter(Boolean)
  if (!clean.length) return <>{text}</>
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${clean.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}])`, "giu")
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-info-tint px-0.5 font-medium text-info-fg">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  )
}

function MockBadge({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Mock
    </Badge>
  )
}

function PanelHeading({ id, children, aside }: { id: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex min-h-7 flex-wrap items-center gap-2">
      <h2 id={id} className="text-sm font-semibold">
        {children}
      </h2>
      {aside ? <div className="ml-auto flex items-center gap-2">{aside}</div> : null}
    </div>
  )
}

/* --------------------------------------------------------------- left: form */

function TicketForm({
  subject,
  body,
  onSubject,
  onBody,
  onSubmit,
  loading,
}: {
  subject: string
  body: string
  onSubject: (v: string) => void
  onBody: (v: string) => void
  onSubmit: () => void
  loading: boolean
}) {
  const canSubmit = body.trim().length > 0 && !loading
  return (
    <form
      aria-labelledby="ticket-h"
      className="flex min-w-0 flex-col gap-5 rounded-lg border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) onSubmit()
      }}
    >
      <h2 id="ticket-h" className="text-sm font-semibold">
        New ticket
      </h2>

      <div className="flex flex-col gap-2">
        <span id="samples-label" className="text-xs text-muted-foreground">
          Samples
        </span>
        <div role="group" aria-labelledby="samples-label" className="grid grid-cols-2 gap-2">
          {SAMPLES.map((s) => (
            <Button
              key={s.key}
              type="button"
              variant="outline"
              size="sm"
              className="justify-start"
              aria-pressed={subject === s.subject && body === s.body}
              onClick={() => {
                onSubject(s.subject)
                onBody(s.body)
              }}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" value={subject} onChange={(e) => onSubject(e.target.value)} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => onBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) {
              e.preventDefault()
              onSubmit()
            }
          }}
          className="min-h-48 resize-y"
          required
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" className="px-4" disabled={!canSubmit}>
          <ScanSearchIcon data-icon="inline-start" aria-hidden="true" />
          {loading ? "Triaging…" : "Triage ticket"}
        </Button>
        <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>Enter</Kbd>
        </span>
      </div>
    </form>
  )
}

/* --------------------------------------------------------- right: 1. banner */

function StatusBanner({ escalate, reasons, mock }: { escalate: boolean; reasons: string[]; mock: boolean }) {
  const [more, setMore] = React.useState(false)
  const visible = more ? reasons : reasons.slice(0, MAX_REASONS)
  const hidden = reasons.length - MAX_REASONS
  const Icon = escalate ? SirenIcon : CircleCheckIcon
  return (
    <section
      role="status"
      aria-labelledby="status-h"
      className={cn("rounded-lg px-5 py-4", escalate ? "bg-critical-tint text-critical-fg" : "bg-success-tint text-success-fg")}
    >
      <div className="flex items-center gap-3">
        <Icon className="size-6 shrink-0" aria-hidden="true" />
        <h2 id="status-h" className="text-lg font-semibold">
          {escalate ? "Escalate to on-call engineer" : "Auto-draft ready"}
        </h2>
        <div className="ml-auto">
          <MockBadge show={mock} />
        </div>
      </div>
      {reasons.length ? (
        <ul className="mt-2 ml-9 list-disc space-y-1 text-sm marker:opacity-60">
          {visible.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
      {hidden > 0 ? (
        <Button
          variant="link"
          size="xs"
          className="mt-1 ml-9 h-auto px-0 text-current"
          aria-expanded={more}
          onClick={() => setMore((m) => !m)}
        >
          {more ? "Less" : `${hidden} more`}
        </Button>
      ) : null}
    </section>
  )
}

/* --------------------------------------------------------- right: 2. triage */

function TriagePanel({ result, ticket }: { result: PipelineResult; ticket: Ticket }) {
  const t = result.triage
  const terms = t.key_terms ?? []
  const rows = [
    { label: "Type", value: <span className="font-medium">{t.type}</span>, conf: t.type_conf },
    { label: "Queue", value: <span className="font-medium break-words">{t.queue}</span>, conf: t.queue_conf },
    {
      label: "Priority",
      value: isPriority(t.priority) ? <PriorityBadge priority={t.priority} /> : <span>{t.priority}</span>,
      conf: t.priority_conf,
    },
  ]
  return (
    <section aria-labelledby="triage-h" className="flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-5">
      <PanelHeading
        id="triage-h"
        aside={
          <>
            <Badge variant="info">{LANG_NAME[t.language] ?? t.language.toUpperCase()}</Badge>
            <MockBadge show={result.sources.triage !== "real"} />
          </>
        }
      >
        Triage
      </PanelHeading>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="flex min-w-0 flex-col gap-1.5">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className="min-w-0 text-[0.8125rem]">{r.value}</dd>
            <dd>
              <ConfidenceMeter value={r.conf} label={r.label} showValue />
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2 border-t pt-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">Message</h3>
          {terms.length ? (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2.5 rounded-sm bg-info-tint ring-1 ring-info/40" aria-hidden="true" />
              {terms.length} key terms
            </span>
          ) : null}
        </div>
        <div lang={t.language} className="flex flex-col gap-1">
          {ticket.subject ? (
            <p className="text-sm font-medium">
              <Highlighted text={ticket.subject} terms={terms} />
            </p>
          ) : null}
          <p className="text-sm leading-6 whitespace-pre-line">
            <Highlighted text={ticket.body} terms={terms} />
          </p>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- right: 3. draft */

function SentenceMarker({ s }: { s: SentenceCheck }) {
  const courtesy = s.supported && !s.source_ticket_id
  const score = s.score.toFixed(2)
  const label = !s.supported
    ? `Unsupported, best match ${score}`
    : courtesy
      ? "Supported, no factual claim"
      : `Supported by ${s.source_ticket_id}, score ${score}`
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {s.supported ? (
            <CheckIcon className={cn("size-4", courtesy ? "text-muted-foreground" : "text-success-fg")} aria-hidden="true" />
          ) : (
            <TriangleAlertIcon className="size-4 text-warning-fg" aria-hidden="true" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="flex items-center gap-2">
        {!s.supported ? (
          <>
            <span>No precedent</span>
            <span className="font-mono">{score}</span>
          </>
        ) : courtesy ? (
          <span>No claim to check</span>
        ) : (
          <>
            <TicketId id={s.source_ticket_id ?? ""} />
            <span className="font-mono">{score}</span>
          </>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

function DraftPanel({ result }: { result: PipelineResult }) {
  const { draft, triage } = result
  const sentences: SentenceCheck[] =
    draft.sentences && draft.sentences.length
      ? draft.sentences
      : draft.reply
        ? [{ text: draft.reply, supported: draft.grounded, source_ticket_id: null, score: 0 }]
        : []
  const unsupported = sentences.filter((s) => !s.supported).length
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft.reply)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Copy failed. Select the text and copy it manually.")
    }
  }

  return (
    <AISurface
      title="Draft reply"
      action={
        <>
          <MockBadge show={result.sources.draft !== "real"} />
          {sentences.length ? (
            unsupported ? (
              <Badge variant="warning">
                <TriangleAlertIcon data-icon="inline-start" aria-hidden="true" />
                {unsupported} unsupported
              </Badge>
            ) : (
              <Badge variant="success">
                <CheckIcon data-icon="inline-start" aria-hidden="true" />
                All supported
              </Badge>
            )
          ) : null}
          {draft.reply ? (
            <Button variant="ghost" size="icon-sm" onClick={copy} aria-label={copied ? "Copied" : "Copy reply"}>
              {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
            </Button>
          ) : null}
        </>
      }
    >
      {sentences.length ? (
        <ol lang={triage.language} className="flex flex-col gap-2">
          {sentences.map((s, i) => (
            <li
              key={i}
              className={cn("flex gap-2.5 rounded-md px-2 py-1", !s.supported && "bg-warning-tint text-warning-fg")}
            >
              <SentenceMarker s={s} />
              <span className="min-w-0 text-[0.9375rem] leading-relaxed">
                {!s.supported ? <span className="sr-only">Unsupported: </span> : null}
                {s.text}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">No draft for this ticket.</p>
      )}
    </AISurface>
  )
}

/* ------------------------------------------------------ right: 4. precedents */

function PrecedentRow({ p, cited }: { p: Precedent; cited: boolean }) {
  const [open, setOpen] = React.useState(false)
  return (
    <li className="flex min-w-0 flex-col gap-2 py-3.5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <TicketId id={p.ticket_id} className="font-medium" />
        {p.language ? <span className="text-xs text-muted-foreground uppercase">{p.language}</span> : null}
        {cited ? <Badge variant="info">Cited</Badge> : null}
        <span className="ml-auto flex items-center gap-2">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.round(p.similarity * 100)}%` }} />
          </span>
          <span className="font-mono text-xs">
            <span className="sr-only">Similarity </span>
            {p.similarity.toFixed(2)}
          </span>
        </span>
      </div>
      {p.subject ? (
        <p lang={p.language || undefined} className="text-[0.8125rem] font-medium">
          {p.subject}
        </p>
      ) : null}
      {p.type || p.queue || p.priority ? (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Past labels">
          {p.type ? <Badge variant="outline">{p.type}</Badge> : null}
          {p.queue ? <Badge variant="outline">{p.queue}</Badge> : null}
          {isPriority(p.priority) ? <PriorityBadge priority={p.priority} /> : null}
        </div>
      ) : null}
      <blockquote
        lang={p.language || undefined}
        className={cn("border-l-2 pl-2.5 text-[0.8125rem] leading-5 text-muted-foreground", !open && "line-clamp-2")}
      >
        {p.answer_snippet}
      </blockquote>
      {p.answer_snippet.length > 140 ? (
        <Button variant="link" size="xs" className="h-auto w-fit px-0" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Show less" : "Show answer"}
        </Button>
      ) : null}
    </li>
  )
}

function PrecedentsPanel({ result }: { result: PipelineResult }) {
  const cited = new Set([
    ...result.draft.cited_ticket_ids,
    ...(result.draft.sentences ?? []).flatMap((s) => (s.source_ticket_id ? [s.source_ticket_id] : [])),
  ])
  return (
    <section aria-labelledby="prec-h" className="flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-5">
      <PanelHeading
        id="prec-h"
        aside={
          <>
            <span className="font-mono text-xs text-muted-foreground">{result.precedents.length}</span>
            <MockBadge show={result.sources.retrieve !== "real"} />
          </>
        }
      >
        Similar past tickets
      </PanelHeading>
      {result.precedents.length ? (
        <ol className="flex flex-col divide-y">
          {result.precedents.map((p) => (
            <PrecedentRow key={p.ticket_id} p={p} cited={cited.has(p.ticket_id)} />
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">No similar tickets found.</p>
      )}
    </section>
  )
}

/* -------------------------------------------------------- right: 5. timings */

const STAGES = [
  { key: "triage_ms", label: "Triage", color: "bg-info/40" },
  { key: "retrieval_ms", label: "Retrieval", color: "bg-info/70" },
  { key: "gate_ms", label: "Gate", color: "bg-chart-5" },
  { key: "draft_ms", label: "Draft", color: "bg-info" },
] as const

function TimingsPanel({ result }: { result: PipelineResult }) {
  const t = result.timings_ms
  return (
    <section aria-labelledby="time-h" className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2">
        <TimerIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 id="time-h" className="text-sm font-semibold">
          Time per stage
        </h2>
        <span className="ml-auto font-mono text-sm font-semibold">{formatMs(t.total_ms)}</span>
      </div>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {STAGES.map((s) => (
          <span key={s.key} className={cn("min-w-1 rounded-sm", s.color)} style={{ flexGrow: t[s.key] }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {STAGES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", s.color)} aria-hidden="true" />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-mono">{formatMs(t[s.key])}</span>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-2 border-t pt-3 text-[0.8125rem] text-muted-foreground">
        <LaptopIcon className="size-4 shrink-0" aria-hidden="true" />
        Processed locally. No data left this laptop.
      </p>
    </section>
  )
}

/* ---------------------------------------------------------------- states */

function useElapsed(startedAt: number | null) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    if (startedAt === null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000))
}

function LoadingResults({ startedAt }: { startedAt: number }) {
  const elapsed = useElapsed(startedAt)
  return (
    <div className="flex flex-col gap-4">
      <div role="status" className="flex items-center gap-3 rounded-lg bg-muted px-5 py-4">
        <ScanSearchIcon className="size-6 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-lg font-semibold">Triaging</p>
        <span className="ml-auto font-mono text-sm text-muted-foreground" aria-hidden="true">
          {elapsed} s
        </span>
      </div>
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5" aria-hidden="true">
        <Skeleton className="h-4 w-16" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-1.5 w-32" />
            </div>
          ))}
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
      <AISurface title="Draft reply" generating>
        <div className="flex flex-col gap-2.5" aria-hidden="true">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </AISurface>
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-5" aria-hidden="true">
        <Skeleton className="h-4 w-36" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}

function IdleResults({ onTry }: { onTry: () => void }) {
  return (
    <Empty className="rounded-lg border border-dashed bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ScanSearchIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyDescription>Paste a ticket or pick a sample.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onTry}>
          Try the VPN outage
        </Button>
      </EmptyContent>
    </Empty>
  )
}

/* -------------------------------------------------------------------- root */

export function Console() {
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  const [state, setState] = React.useState<State>({ status: "idle" })
  const abortRef = React.useRef<AbortController | null>(null)
  const resultsRef = React.useRef<HTMLDivElement>(null)

  const run = React.useCallback(async (ticket: Ticket) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const timer = setTimeout(() => ctrl.abort("timeout"), TIMEOUT_MS)
    setState({ status: "loading", ticket, startedAt: Date.now() })
    if (window.matchMedia("(max-width: 1023px)").matches) {
      resultsRef.current?.scrollIntoView({ block: "start" })
    }
    try {
      const res = await fetch(`${API_URL}/triage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(ticket),
        signal: ctrl.signal,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        setState({
          status: "error",
          ticket,
          title: `Triage API returned ${res.status}`,
          detail: text.slice(0, 200) || res.statusText,
        })
        return
      }
      const result = (await res.json()) as PipelineResult
      setState({ status: "done", ticket, result })
    } catch (err) {
      if (ctrl.signal.aborted && ctrl.signal.reason !== "timeout") return // superseded by a newer request
      const timedOut = ctrl.signal.reason === "timeout"
      setState({
        status: "error",
        ticket,
        title: timedOut ? "Triage timed out" : "Can't reach the triage API",
        detail: timedOut
          ? `No response from ${API_URL} after ${TIMEOUT_MS / 1000} s.`
          : `Is the server running at ${API_URL}? ${err instanceof Error ? err.message : ""}`.trim(),
      })
    } finally {
      clearTimeout(timer)
    }
  }, [])

  React.useEffect(() => () => abortRef.current?.abort(), [])

  const loading = state.status === "loading"

  return (
    <div className="flex min-h-svh flex-col bg-canvas text-foreground">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2.5 lg:px-6">
          <Wordmark />
          <span className="text-muted-foreground" aria-hidden="true">
            /
          </span>
          <h1 className="text-sm text-muted-foreground">Console</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 content-start gap-5 px-4 py-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:px-6 lg:py-6">
        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <TicketForm
            subject={subject}
            body={body}
            onSubject={setSubject}
            onBody={setBody}
            onSubmit={() => run({ subject, body })}
            loading={loading}
          />
        </div>

        <div ref={resultsRef} className="flex min-w-0 scroll-mt-4 flex-col gap-4">
          {state.status === "idle" ? (
            <IdleResults
              onTry={() => {
                const s = SAMPLES[0]
                setSubject(s.subject)
                setBody(s.body)
                run({ subject: s.subject, body: s.body })
              }}
            />
          ) : null}

          {state.status === "loading" ? <LoadingResults startedAt={state.startedAt} /> : null}

          {state.status === "error" ? (
            <Alert variant="destructive">
              <UnplugIcon aria-hidden="true" />
              <AlertTitle>{state.title}</AlertTitle>
              <AlertDescription className="flex flex-col items-start gap-2">
                <span className="break-words">{state.detail}</span>
                <Button variant="outline" size="sm" onClick={() => run(state.ticket)}>
                  <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {state.status === "done" ? (
            <React.Fragment key={state.result.timings_ms.total_ms}>
              <StatusBanner
                escalate={state.result.escalate}
                reasons={state.result.reasons}
                mock={state.result.sources.gate !== "real"}
              />
              <TriagePanel result={state.result} ticket={state.ticket} />
              <DraftPanel result={state.result} />
              <PrecedentsPanel result={state.result} />
              <TimingsPanel result={state.result} />
            </React.Fragment>
          ) : null}
        </div>
      </main>
    </div>
  )
}
