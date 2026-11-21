"use client"

import * as React from "react"
import {
  CheckIcon,
  CircleDotIcon,
  CircleIcon,
  CopyIcon,
  LanguagesIcon,
  PenLineIcon,
  RadarIcon,
  SendIcon,
  SirenIcon,
  TimerIcon,
  TriangleAlertIcon,
  UndoIcon,
  UserCheckIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ConfidenceMeter } from "@/components/sentinel/confidence"
import { EscalationStatus, PriorityBadge, TicketId } from "@/components/sentinel/status"
import { cn } from "@/lib/utils"
import type { Precedent } from "@/lib/types"

import { CASES, type CanvasCase } from "./content"

/* ------------------------------------------------------------------ parsing */

const CITE = /\s*\[([^\]]+)\]/g
const LANG_NAME = { en: "English", de: "German" } as const

type Segment = { type: "text"; value: string } | { type: "cite"; ids: string[] }
type SentenceState = "supported" | "unsupported" | "courtesy"

function splitSentences(text: string) {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean)
}

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

function citedIds(text: string) {
  return [...text.matchAll(CITE)].flatMap((m) => m[1].split(",").map((s) => s.trim()))
}

function stripCitations(text: string) {
  return text.replace(CITE, "")
}

function classify(sentences: string[], courtesy: number[], known: Set<string>): SentenceState[] {
  return sentences.map((s, i) => {
    if (courtesy.includes(i)) return "courtesy"
    const ids = citedIds(s)
    return ids.length > 0 && ids.every((id) => known.has(id)) ? "supported" : "unsupported"
  })
}

/* --------------------------------------------------------------- shared bits */

type CiteCtx = {
  precedents: Precedent[]
  activeId: string | null
  setActiveId: (id: string | null) => void
}
const CiteContext = React.createContext<CiteCtx | null>(null)
function useCite() {
  const ctx = React.useContext(CiteContext)
  if (!ctx) throw new Error("CiteContext missing")
  return ctx
}

function AiMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("ai-mark inline-flex size-7 shrink-0 items-center justify-center rounded-lg", className)}>
      <PenLineIcon className="size-3.5 text-white" strokeWidth={2.25} />
    </span>
  )
}

function RankChip({ n, muted = false }: { n: number; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-[0.6875rem] font-semibold",
        muted ? "bg-muted text-muted-foreground" : "bg-info-tint text-info-fg"
      )}
    >
      {n}
    </span>
  )
}

function CitationChip({ id }: { id: string }) {
  const { precedents, activeId, setActiveId } = useCite()
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
          aria-label={`Source ${index + 1}: ${p.ticket_id}, similarity ${p.similarity.toFixed(2)}`}
          className={cn(
            "ml-1 inline-flex size-5 items-center justify-center rounded-md align-[0.15em] font-mono text-[0.6875rem] font-semibold transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            activeId === id ? "bg-primary text-primary-foreground" : "bg-info-tint text-info-fg hover:bg-primary hover:text-primary-foreground"
          )}
        >
          {index + 1}
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <RankChip n={index + 1} />
          <TicketId id={p.ticket_id} className="font-medium" />
          <span className="text-xs text-muted-foreground uppercase">{p.language}</span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">{p.similarity.toFixed(2)} similar</span>
        </div>
        <div className="flex flex-col gap-1.5 px-3 py-2.5">
          <p className="text-[0.8125rem] font-medium">{p.subject}</p>
          <blockquote className="border-l-2 border-info pl-2.5 text-[0.8125rem] leading-5 text-muted-foreground">
            {p.answer_snippet}
          </blockquote>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function WithCitations({ text }: { text: string }) {
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

/* ------------------------------------------------------------------- header */

function TopBar({ caseKey, onCase }: { caseKey: string; onCase: (k: CanvasCase["key"]) => void }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 lg:px-6">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <RadarIcon className="size-4.5" aria-hidden="true" />
          </span>
          <span className="text-[0.9375rem] font-semibold tracking-tight">SentinelDesk</span>
          <span className="hidden text-muted-foreground sm:inline" aria-hidden="true">
            /
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">Copilot</span>
        </div>
        <div className="ml-auto lg:hidden">
          <ThemeToggle />
        </div>
        <div className="order-last flex w-full items-center gap-2 lg:order-none lg:ml-auto lg:w-auto">
          <span id="case-label" className="text-xs text-muted-foreground">
            Ticket
          </span>
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            spacing={0}
            value={caseKey}
            onValueChange={(v) => v && onCase(v as CanvasCase["key"])}
            aria-labelledby="case-label"
          >
            {CASES.map((c) => (
              <ToggleGroupItem key={c.key} value={c.key} className="px-3">
                {c.result.escalate ? (
                  <SirenIcon aria-hidden="true" className="text-critical-fg" />
                ) : (
                  <CheckIcon aria-hidden="true" className="text-success-fg" />
                )}
                {c.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

function OutageBanner({ outage }: { outage: NonNullable<CanvasCase["outage"]> }) {
  return (
    <div role="status" className="border-b border-critical/25 bg-critical-tint text-critical-fg">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm lg:px-6">
        <SirenIcon className="size-4 shrink-0" aria-hidden="true" />
        <p className="font-semibold">Major outage suspected</p>
        <p className="min-w-0">
          {outage.count} tickets in {outage.minutes} min describe the same failure: {outage.failure}.
        </p>
        <p className="hidden font-mono text-[0.8125rem] xl:ml-auto xl:block">{outage.ids.join("  ")}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- ticket panel */

function TicketPanel({ c, english }: { c: CanvasCase; english: boolean }) {
  const { triage, escalate, reasons } = c.result
  const [expanded, setExpanded] = React.useState(false)
  const translated = english && c.ticket.bodyEn
  const initials = c.ticket.from
    .split(" ")
    .map((w) => w[0])
    .join("")

  return (
    <section aria-labelledby="ticket-subject" className="flex min-w-0 flex-col rounded-xl border bg-card">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{c.ticket.from}</p>
            <p className="truncate text-xs text-muted-foreground">{c.ticket.org}</p>
          </div>
          <span className="font-mono text-xs text-muted-foreground">{c.ticket.received}</span>
        </div>
        <h1 id="ticket-subject" className="text-base leading-snug font-semibold text-balance">
          {translated ? c.ticket.subjectEn : c.ticket.subject}
        </h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <TicketId id={c.ticket.id} className="mr-1 text-muted-foreground" />
          <Badge variant="info">
            <LanguagesIcon data-icon="inline-start" aria-hidden="true" />
            {LANG_NAME[triage.language]} detected
          </Badge>
          {translated ? <Badge variant="outline">Shown in English</Badge> : null}
        </div>
      </div>

      <div className="border-t px-4 py-3.5">
        <p
          lang={translated ? "en" : triage.language}
          className={cn("text-sm leading-6 whitespace-pre-line", !expanded && "line-clamp-4 lg:line-clamp-none")}
        >
          {translated ? c.ticket.bodyEn : c.ticket.body}
        </p>
        <Button
          variant="link"
          size="xs"
          className="mt-1 h-auto px-0 lg:hidden"
          aria-expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Show less" : "Show full message"}
        </Button>
      </div>

      <div className="border-t px-4 py-3.5">
        <h2 className="mb-2.5 text-xs font-medium text-muted-foreground">Triage</h2>
        <dl className="flex flex-col gap-3 text-[0.8125rem]">
          {(
            [
              ["Type", <span key="t" className="font-medium">{triage.type}</span>, triage.type_conf],
              ["Queue", <span key="q" className="font-medium">{triage.queue}</span>, triage.queue_conf],
              ["Priority", <PriorityBadge key="p" priority={triage.priority} />, triage.priority_conf],
            ] as const
          ).map(([label, value, conf]) => (
            <div key={label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <ConfidenceMeter value={conf} label={label} />
              </div>
              <dd className="min-w-0">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="px-4 pb-4">
        <EscalationStatus escalate={escalate} reasons={reasons} />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ grounded reply */

type Resolution = "pending" | "removed" | "escalated"

function GroundingBar({ states, resolution }: { states: SentenceState[]; resolution: Resolution }) {
  const removed = resolution === "removed"
  const claimStates = states.filter((s) => s !== "courtesy" && !(removed && s === "unsupported"))
  const supported = claimStates.filter((s) => s === "supported").length
  const unsupported = states.filter((s) => s === "unsupported").length
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.8125rem]">
      <div className="flex h-1.5 w-28 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {claimStates.map((s, i) => (
          <span key={i} className={cn("flex-1", s === "supported" ? "bg-success" : "bg-warning")} />
        ))}
      </div>
      <span className="font-medium">
        {supported} of {claimStates.length} claims grounded
      </span>
      {unsupported ? (
        removed ? (
          <span className="text-muted-foreground">{unsupported} removed</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-warning-fg">
            <TriangleAlertIcon className="size-3.5" aria-hidden="true" />
            {unsupported} unsupported
          </span>
        )
      ) : null}
    </div>
  )
}

function ReplyBody({
  sentences,
  states,
  resolution,
  size = "lg",
  lang,
}: {
  sentences: string[]
  states: SentenceState[]
  resolution: Resolution
  size?: "lg" | "md"
  lang: string
}) {
  const { activeId } = useCite()
  return (
    <p lang={lang} className={cn("text-pretty", size === "lg" ? "text-[1.0625rem] leading-8" : "text-[0.9375rem] leading-7")}>
      {sentences.map((s, i) => {
        const state = states[i]
        const linked = activeId !== null && citedIds(s).includes(activeId)
        let node: React.ReactNode
        if (state === "supported") {
          node = (
            <span
              className={cn(
                "rounded-sm underline decoration-success/50 decoration-[1.5px] underline-offset-[7px] transition-colors duration-150 box-decoration-clone",
                linked && "bg-info-tint"
              )}
            >
              <span className="sr-only">Supported: </span>
              <WithCitations text={s} />
            </span>
          )
        } else if (state === "unsupported") {
          node =
            resolution === "removed" ? (
              <span className="text-muted-foreground line-through decoration-muted-foreground/70">
                <span className="sr-only">Removed: </span>
                {stripCitations(s)}
              </span>
            ) : (
              <span className="rounded-sm bg-warning-tint px-1 underline decoration-warning decoration-dotted decoration-2 underline-offset-[7px] box-decoration-clone">
                <TriangleAlertIcon className="mr-1 inline size-4 -translate-y-px text-warning-fg" aria-hidden="true" />
                <span className="sr-only">Unsupported: </span>
                {s}
              </span>
            )
        } else {
          node = <span>{s}</span>
        }
        return (
          <React.Fragment key={i}>
            {node}
            {i < sentences.length - 1 ? " " : null}
          </React.Fragment>
        )
      })}
    </p>
  )
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Sentence markers">
      <li className="flex items-center gap-1.5">
        <span className="h-0 w-4 border-b-[1.5px] border-success" aria-hidden="true" />
        Backed by a past ticket
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-0 w-4 border-b-2 border-dotted border-warning" aria-hidden="true" />
        No precedent
      </li>
      <li className="flex items-center gap-1.5">
        <RankChip n={1} />
        Source, hover or focus to preview
      </li>
    </ul>
  )
}

/* ---------------------------------------------------------------- workspace */

function useCopy() {
  const [copied, setCopied] = React.useState(false)
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Copy failed. Select the text and copy it manually.")
    }
  }
  return { copied, copy }
}

function Workspace({ c }: { c: CanvasCase }) {
  const { result, ticket } = c
  const [english, setEnglish] = React.useState(false)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [resolution, setResolution] = React.useState<Resolution>("pending")
  const [sent, setSent] = React.useState(false)
  const [acked, setAcked] = React.useState(false)
  const { copied, copy } = useCopy()

  const known = React.useMemo(() => new Set(result.precedents.map((p) => p.ticket_id)), [result])
  const original = splitSentences(result.draft.reply)
  const states = classify(original, c.courtesy, known)
  const shown = english && c.replyEn ? splitSentences(c.replyEn) : original
  const unsupportedIdx = states.flatMap((s, i) => (s === "unsupported" ? [i] : []))
  const needsResolution = unsupportedIdx.length > 0 && resolution === "pending"
  const blocked = needsResolution || resolution === "escalated"

  const briefText = c.brief ? [c.brief.summary, ...c.brief.cause.map((x) => x.detail), ...c.brief.steps].join(" ") : ""
  const cited = new Set([...result.draft.cited_ticket_ids, ...citedIds(briefText)])

  const plainReply = original
    .filter((_, i) => !(states[i] === "unsupported" && resolution === "removed"))
    .map(stripCitations)
    .join(" ")

  const approve = () => {
    setSent(true)
    toast.success(`Reply sent to ${ticket.from}`, { description: `${ticket.id} · ${LANG_NAME[result.triage.language]}` })
  }
  const acknowledge = () => {
    setAcked(true)
    toast.success("Incident acknowledged", { description: `You own ${ticket.id} and ${c.outage ? c.outage.count - 1 : 0} linked tickets` })
  }

  const isIncident = Boolean(c.brief)

  const primary = isIncident ? (
    <Button size="lg" className="px-4" onClick={acknowledge} disabled={acked}>
      {acked ? <CheckIcon data-icon="inline-start" aria-hidden="true" /> : <UserCheckIcon data-icon="inline-start" aria-hidden="true" />}
      {acked ? "Acknowledged" : "Acknowledge incident"}
    </Button>
  ) : (
    <Button size="lg" className="px-4" onClick={approve} disabled={blocked || sent}>
      {sent ? <CheckIcon data-icon="inline-start" aria-hidden="true" /> : <SendIcon data-icon="inline-start" aria-hidden="true" />}
      {sent ? "Sent" : "Approve and send"}
    </Button>
  )

  const hint = isIncident
    ? acked
      ? "You own this incident."
      : "On-call engineer paged at 08:21."
    : sent
      ? `Sent to ${ticket.from}.`
      : needsResolution
        ? "Resolve 1 unsupported sentence first."
        : resolution === "escalated"
          ? "Waiting for billing lead."
          : "Ready to send in German."

  return (
    <CiteContext.Provider value={{ precedents: result.precedents, activeId, setActiveId }}>
      {c.outage ? <OutageBanner outage={c.outage} /> : null}
      <main className="mx-auto grid w-full max-w-[1440px] flex-1 content-start grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5 lg:px-6 lg:py-6 lg:pb-6 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <div className="min-w-0 lg:row-span-2 xl:row-span-1">
          <TicketPanel c={c} english={english} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {isIncident && c.brief ? (
            <section aria-labelledby="brief-h" className="ai-surface rounded-2xl">
              <header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 pt-6 sm:px-7">
                <AiMark />
                <div className="min-w-0">
                  <h2 id="brief-h" className="text-[0.9375rem] font-semibold">
                    Incident brief
                  </h2>
                  <p className="text-xs text-muted-foreground">For the on-call engineer · Gemini, grounded in {cited.size} past incidents</p>
                </div>
                <Badge variant="critical" className="ml-auto">
                  <SirenIcon data-icon="inline-start" aria-hidden="true" />
                  Escalated
                </Badge>
              </header>
              <div className="flex flex-col gap-6 px-5 py-6 sm:px-7">
                <section className="flex flex-col gap-1.5">
                  <h3 className="text-xs font-medium text-muted-foreground">Summary</h3>
                  <p className="text-[1.0625rem] leading-8 text-pretty">{c.brief.summary}</p>
                </section>
                <section className="flex flex-col gap-2.5">
                  <h3 className="text-xs font-medium text-muted-foreground">Likely cause and past fix</h3>
                  <ol className="flex flex-col gap-2">
                    {c.brief.cause.map((cause, i) => (
                      <li key={cause.title} className={cn("rounded-lg border p-3.5", i === 0 ? "bg-background" : "bg-transparent")}>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="text-[0.9375rem] font-semibold">{cause.title}</p>
                          <Badge variant={i === 0 ? "info" : "outline"}>{i === 0 ? "Most likely" : "Alternative"}</Badge>
                        </div>
                        <p className="text-[0.9375rem] leading-7 text-muted-foreground">
                          <WithCitations text={cause.detail} />
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
                <section className="flex flex-col gap-2.5">
                  <h3 className="text-xs font-medium text-muted-foreground">First steps</h3>
                  <ol className="flex flex-col gap-2.5">
                    {c.brief.steps.map((step, i) => (
                      <li key={step} className="flex gap-3 text-[0.9375rem] leading-7">
                        <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[0.6875rem] font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="min-w-0">
                          <WithCitations text={step} />
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
              <footer className="hidden items-center gap-3 border-t px-7 py-4 lg:flex">
                <Button variant="outline" size="lg" onClick={() => copy(stripCitations(briefText))}>
                  {copied ? <CheckIcon data-icon="inline-start" aria-hidden="true" /> : <CopyIcon data-icon="inline-start" aria-hidden="true" />}
                  {copied ? "Copied" : "Copy brief"}
                </Button>
                <p className="ml-auto text-[0.8125rem] text-muted-foreground">{hint}</p>
                {primary}
              </footer>
            </section>
          ) : null}

          <section aria-labelledby="reply-h" className="ai-surface rounded-2xl">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-3 px-5 pt-6 sm:px-7">
              <AiMark />
              <div className="min-w-0">
                <h2 id="reply-h" className="text-[0.9375rem] font-semibold">
                  {isIncident ? "Holding reply to customer" : "Grounded reply"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Gemini draft in {LANG_NAME[result.triage.language]}, the customer&apos;s language
                </p>
              </div>
              {result.sources.draft !== "real" ? (
                <Badge variant="outline" className="text-muted-foreground">
                  Mock
                </Badge>
              ) : null}
              {c.replyEn ? (
                <div className="flex items-center gap-2 sm:ml-auto">
                  <Switch id="show-en" checked={english} onCheckedChange={setEnglish} />
                  <Label htmlFor="show-en" className="text-[0.8125rem]">
                    Show in English
                  </Label>
                </div>
              ) : null}
            </header>

            <div className="flex flex-col gap-5 px-5 py-6 sm:px-7">
              <GroundingBar states={states} resolution={resolution} />
              <ReplyBody
                sentences={shown}
                states={states}
                resolution={resolution}
                size={isIncident ? "md" : "lg"}
                lang={english && c.replyEn ? "en" : result.triage.language}
              />
              {english && c.replyEn ? (
                <p className="text-xs text-muted-foreground">
                  Translation for your review. {ticket.from} receives the German original.
                </p>
              ) : null}

              {unsupportedIdx.length > 0 ? (
                <div
                  role="status"
                  className={cn(
                    "rounded-lg border p-3.5",
                    resolution === "removed" ? "bg-muted/60" : "border-warning/50 bg-warning-tint text-warning-fg"
                  )}
                >
                  {resolution === "pending" ? (
                    <>
                      <div className="flex items-center gap-2">
                        <TriangleAlertIcon className="size-4 shrink-0" aria-hidden="true" />
                        <p className="text-sm font-semibold">One sentence has no supporting precedent</p>
                      </div>
                      <p className="mt-1 ml-6 text-[0.8125rem] leading-5">
                        It promises a goodwill credit. Neither retrieved ticket offers one, so it cannot go out as written.
                      </p>
                      <div className="mt-3 ml-6 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setResolution("removed")}>
                          Remove sentence
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setResolution("escalated")}>
                          Escalate to billing lead
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {resolution === "removed" ? (
                        <CheckIcon className="size-4 shrink-0 text-success-fg" aria-hidden="true" />
                      ) : (
                        <TriangleAlertIcon className="size-4 shrink-0" aria-hidden="true" />
                      )}
                      <p className={cn("min-w-0 flex-1 text-[0.8125rem]", resolution === "removed" && "text-foreground")}>
                        {resolution === "removed"
                          ? "Unsupported sentence removed. The reply now only states what past tickets confirm."
                          : "Held for the billing lead. A goodwill credit needs their approval."}
                      </p>
                      {!sent ? (
                        <Button size="xs" variant="ghost" className="ml-auto" onClick={() => setResolution("pending")}>
                          <UndoIcon data-icon="inline-start" aria-hidden="true" />
                          Undo
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}

              <Legend />
            </div>

            <footer className={cn("items-center gap-3 border-t px-7 py-4", isIncident ? "flex flex-wrap" : "hidden lg:flex")}>
              <Button variant="outline" size={isIncident ? "default" : "lg"} onClick={() => copy(plainReply)}>
                {copied && !isIncident ? <CheckIcon data-icon="inline-start" aria-hidden="true" /> : <CopyIcon data-icon="inline-start" aria-hidden="true" />}
                {copied && !isIncident ? "Copied" : "Copy"}
              </Button>
              {isIncident ? (
                <Button variant="secondary" className="ml-auto" onClick={approve} disabled={sent}>
                  {sent ? <CheckIcon data-icon="inline-start" aria-hidden="true" /> : <SendIcon data-icon="inline-start" aria-hidden="true" />}
                  {sent ? "Holding reply sent" : "Send holding reply"}
                </Button>
              ) : (
                <>
                  <p className={cn("ml-auto text-[0.8125rem]", needsResolution ? "text-warning-fg" : "text-muted-foreground")}>{hint}</p>
                  {primary}
                </>
              )}
            </footer>
          </section>
        </div>

        <EvidenceRail precedents={result.precedents} cited={cited} />
      </main>

      <LatencyFooter c={c} />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <p className={cn("min-w-0 flex-1 text-[0.8125rem]", needsResolution ? "text-warning-fg" : "text-muted-foreground")}>{hint}</p>
          {primary}
        </div>
      </div>
    </CiteContext.Provider>
  )
}

/* ------------------------------------------------------------ evidence rail */

function EvidenceRail({ precedents, cited }: { precedents: Precedent[]; cited: Set<string> }) {
  const { activeId } = useCite()
  return (
    <aside aria-labelledby="evidence-h" className="flex min-w-0 flex-col gap-3 lg:col-start-2 xl:col-start-auto">
      <div className="flex items-baseline gap-2 px-1">
        <h2 id="evidence-h" className="text-sm font-semibold">
          Evidence
        </h2>
        <p className="text-xs text-muted-foreground">
          {precedents.length} retrieved · {precedents.filter((p) => cited.has(p.ticket_id)).length} cited
        </p>
      </div>
      <ol className="flex flex-col gap-2.5">
        {precedents.map((p, i) => {
          const isCited = cited.has(p.ticket_id)
          const active = activeId === p.ticket_id
          return (
            <li
              key={p.ticket_id}
              className={cn(
                "flex flex-col gap-2.5 rounded-xl border bg-card p-3.5 transition-colors duration-150",
                active && "border-primary bg-info-tint/40"
              )}
            >
              <div className="flex items-center gap-2">
                <RankChip n={i + 1} muted={!isCited} />
                <TicketId id={p.ticket_id} className="font-medium" />
                <span className="text-xs text-muted-foreground uppercase">{p.language}</span>
                <span
                  className={cn(
                    "ml-auto inline-flex items-center gap-1 text-xs",
                    isCited ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {isCited ? (
                    <CircleDotIcon className="size-3.5 text-info-fg" aria-hidden="true" />
                  ) : (
                    <CircleIcon className="size-3.5" aria-hidden="true" />
                  )}
                  {isCited ? "Cited" : "Retrieved only"}
                </span>
              </div>
              <p className="text-[0.8125rem] leading-5 font-medium">{p.subject}</p>
              <div className="flex items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div
                    className={cn("h-full rounded-full", isCited ? "bg-primary" : "bg-muted-foreground/45")}
                    style={{ width: `${p.similarity * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs">
                  <span className="sr-only">Similarity </span>
                  {p.similarity.toFixed(2)}
                </span>
              </div>
              <p lang={p.language || undefined} className="line-clamp-3 text-[0.8125rem] leading-5 text-muted-foreground">
                {p.answer_snippet}
              </p>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}

/* ----------------------------------------------------------- latency footer */

const STAGES = [
  { key: "triage_ms", source: "triage", label: "Triage", color: "bg-chart-1" },
  { key: "retrieval_ms", source: "retrieve", label: "Retrieval", color: "bg-chart-2" },
  { key: "gate_ms", source: "gate", label: "Gate", color: "bg-chart-3" },
  { key: "draft_ms", source: "draft", label: "Gemini draft", color: "latency-draft" },
] as const

function LatencyFooter({ c }: { c: CanvasCase }) {
  const t = c.result.timings_ms
  return (
    <footer aria-label="Pipeline latency" className="border-t bg-background">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2.5 px-4 py-3 pb-24 lg:flex-row lg:items-center lg:gap-5 lg:px-6 lg:pb-3">
        <div className="flex shrink-0 items-center gap-2">
          <TimerIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">End to end</span>
          <span className="font-mono text-sm font-semibold">{t.total_ms.toLocaleString("en-US")} ms</span>
        </div>
        <div className="flex h-2 min-w-0 flex-1 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
          {STAGES.map((s) => (
            <span key={s.key} className={cn("min-w-1 rounded-sm", s.color)} style={{ flexGrow: t[s.key] }} />
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {STAGES.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", s.color)} aria-hidden="true" />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-mono">{t[s.key].toLocaleString("en-US")} ms</span>
              {c.result.sources[s.source] !== "real" ? (
                <Badge variant="outline" className="h-4 px-1 text-[0.625rem] text-muted-foreground">
                  Mock
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}

/* -------------------------------------------------------------------- root */

export function CopilotCanvas() {
  const [caseKey, setCaseKey] = React.useState<CanvasCase["key"]>("billing")
  const c = CASES.find((x) => x.key === caseKey) ?? CASES[0]
  return (
    <div className="flex min-h-svh flex-col">
      <TopBar caseKey={caseKey} onCase={setCaseKey} />
      <div className="flex flex-1 flex-col">
        <Workspace key={c.key} c={c} />
      </div>
    </div>
  )
}
