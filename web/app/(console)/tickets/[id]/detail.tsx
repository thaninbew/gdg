"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  CopyIcon,
  MessageCircleQuestionIcon,
  RotateCcwIcon,
  SendIcon,
  SirenIcon,
  UserRoundIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AISurface } from "@/components/sentinel/ai"
import { MockBadge } from "@/components/sentinel/case-outcome"
import { ClarifyingQuestion } from "@/components/sentinel/clarifying-question"
import { ConfidenceMeter } from "@/components/sentinel/confidence"
import { EvidenceRail } from "@/components/sentinel/evidence-rail"
import { CitationProvider, CitedText, GroundedReply, citedIds } from "@/components/sentinel/grounded-reply"
import { PageHeader } from "@/components/sentinel/page-header"
import { PriorityBadge, TicketId } from "@/components/sentinel/status"
import { useCases } from "@/lib/case-store"
import {
  acceptField,
  applyAnswer,
  changeField,
  gateReasons,
  initialState,
  openQuestion,
  outcome,
  remainingQuestions,
  TRIAGE_FIELDS,
  type CaseState,
} from "@/lib/gate"
import type { Priority, TicketCase, TriageField } from "@/lib/types"
import { cn } from "@/lib/utils"
import { DEMO_CASES, type DemoCase } from "./demo-cases"

const LANG_NAME = { en: "English", de: "German" } as const
const FIELD_LABEL: Record<TriageField, string> = { type: "Type", queue: "Queue", priority: "Priority" }
const OPTIONS: Record<TriageField, string[]> = {
  type: ["Incident", "Request", "Problem", "Change"],
  queue: [
    "Technical Support",
    "Product Support",
    "Customer Service",
    "IT Support",
    "Billing and Payments",
    "Returns and Exchanges",
    "Service Outages and Maintenance",
    "Sales and Pre-Sales",
    "Human Resources",
    "General Inquiry",
    "Other",
  ],
  priority: ["high", "medium", "low"],
}
const PRIORITY_LABEL: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" }
const STAGES = [
  { key: "triage_ms", label: "Triage" },
  { key: "retrieval_ms", label: "Retrieval" },
  { key: "gate_ms", label: "Gate" },
  { key: "draft_ms", label: "Draft" },
] as const

/**
 * One outcome per ticket. Intended mapping from the pipeline result:
 * escalate with a high-priority reason → urgent; any other escalate → review by a person;
 * !escalate && draft.grounded → draft. clarify is the console's pre-draft question.
 */
type Lane = "urgent" | "review" | "clarify" | "draft"
const LANE = {
  urgent: { label: "Urgent", title: "Urgent incident", variant: "critical", tint: "bg-critical-tint text-critical-fg", Icon: SirenIcon },
  review: { label: "Human review", title: "Human review", variant: "warning", tint: "bg-warning-tint text-warning-fg", Icon: UserRoundIcon },
  clarify: { label: "Clarify", title: "One question first", variant: "warning", tint: "bg-warning-tint text-warning-fg", Icon: MessageCircleQuestionIcon },
  draft: { label: "Draft ready", title: "Reply ready", variant: "success", tint: "bg-success-tint text-success-fg", Icon: CircleCheckIcon },
} as const

type Done = { paged?: string; assigned?: boolean; sent?: boolean }

const now = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

/** Store tickets use the shared console store; demo IDs keep their state on this page only. */
function useTicket(id: string) {
  const store = useCases()
  const demo = DEMO_CASES.find((d) => d.ticket_id === id)
  const [local, setLocal] = React.useState<CaseState | null>(() => (demo ? initialState(demo) : null))
  if (!demo || !local) {
    const c = store.cases.find((x) => x.ticket_id === id)!
    return {
      c: c as TicketCase & Partial<Pick<DemoCase, "customer" | "brief">>,
      s: store.state[id],
      answer: (i: number | null, text?: string) => store.answer(id, i, text),
      accept: (f: TriageField) => store.accept(id, f),
      change: (f: TriageField, v: string) => store.change(id, f, v),
      escalate: (reason: string) => store.escalate(id, reason),
      reset: () => store.reset(id),
    }
  }
  return {
    c: demo,
    s: local,
    answer: (i: number | null, text?: string) => setLocal((s) => applyAnswer(demo, s!, i, text)),
    accept: (f: TriageField) => setLocal((s) => acceptField(s!, f)),
    change: (f: TriageField, v: string) => setLocal((s) => changeField(demo, s!, f, v)),
    escalate: (reason: string) => setLocal((s) => ({ ...s!, forced: [...s!.forced, reason] })),
    reset: () => setLocal(initialState(demo)),
  }
}

export function TicketDetail({ id }: { id: string }) {
  const { c, s, answer, accept, change, escalate, reset } = useTicket(id)
  const o = outcome(c, s)
  const reasons = gateReasons(c, s)
  const q = openQuestion(c, s)
  const urgent = reasons.some((r) => r.startsWith("High-priority"))
  const lane: Lane = o === "clarify" ? "clarify" : o === "draft" ? "draft" : urgent ? "urgent" : "review"
  const [editing, setEditing] = React.useState(false)
  const [done, setDone] = React.useState<Done>({})
  const touched =
    s.answers.length > 0 || s.forced.length > 0 || TRIAGE_FIELDS.some((f) => s.fields[f] !== "suggested") || Object.keys(done).length > 0

  const act = () => {
    if (lane === "urgent") {
      setDone((d) => ({ ...d, paged: now() }))
      toast(`On-call paged for ${id}`, { description: "Simulated. No one was paged." })
    } else {
      setDone((d) => ({ ...d, assigned: true }))
      toast(`Assigned ${id} to you`, { description: "Simulated." })
    }
  }
  const send = () => {
    setDone((d) => ({ ...d, sent: true }))
    toast(`Reply sent for ${id}`, { description: "Simulated. Nothing was sent." })
  }
  const startOver = () => {
    reset()
    setDone({})
    setEditing(false)
  }

  // A reply is shown when it is the outcome, or alongside an escalation when it passed grounding.
  const showReply = !!c.draft.reply && (lane === "draft" || ((lane === "urgent" || lane === "review") && c.draft.grounded))
  const cited = new Set([
    ...citedIds(c.note),
    ...(c.brief ?? []).flatMap((b) => [...citedIds(b.text)]),
    ...s.answers.flatMap((a) => [...citedIds(a.reply)]),
    ...(showReply ? c.draft.cited_ticket_ids : []),
  ])
  const primary =
    lane === "urgent"
      ? { label: done.paged ? "On-call paged" : "Page on-call", run: act, off: !!done.paged }
      : lane === "review"
        ? { label: done.assigned ? "Assigned to you" : "Assign to me", run: act, off: !!done.assigned }
        : lane === "draft"
          ? { label: done.sent ? "Sent" : "Approve and send", run: send, off: !!done.sent }
          : null

  return (
    <CitationProvider precedents={c.precedents}>
      <PageHeader
        title={<TicketId id={c.ticket_id} className="text-xl" />}
        actions={
          <>
            {touched ? (
              <Button variant="ghost" size="sm" onClick={startOver}>
                <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
                Start over
              </Button>
            ) : null}
            <LaneBadge lane={lane} />
          </>
        }
      />

      {/* Phones read request, outcome, classification, evidence; wider screens put the outcome column beside the request. */}
      <div className="grid gap-6 p-4 pb-24 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:p-6 xl:grid-cols-[20rem_minmax(0,1fr)_19rem] xl:pb-6">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <CustomerRequest c={c} />
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {lane === "clarify" ? null : (
          <Outcome
            lane={lane}
            reasons={reasons}
            route={s.route}
            escalate={reasons.length > 0 || (!!c.draft.reply && !c.draft.grounded)}
            grounded={c.draft.grounded}
            hasDraft={!!c.draft.reply}
            done={done}
            primary={primary}
          />
          )}

          {lane === "urgent" && c.brief ? <OnCallBrief id={c.ticket_id} lines={c.brief} customer={c.customer} mock={c.sources.draft !== "real"} /> : null}

          {lane === "urgent" && c.brief ? null : (
          <AISurface title="Copilot read" action={c.sources.triage !== "real" ? <MockBadge /> : null}>
            <p className="text-[0.9375rem] leading-relaxed">
              <CitedText text={c.note} />
            </p>
            {s.answers.length ? (
              <ol className="flex flex-col gap-3 border-t pt-3">
                {s.answers.map((a) => (
                  <li key={a.question} className="flex flex-col gap-1.5">
                    <p className="text-xs text-muted-foreground">{a.question}</p>
                    <p className="self-start rounded-md bg-secondary px-2 py-1 text-sm font-medium">{a.label}</p>
                    <p className="text-[0.9375rem] leading-relaxed">
                      <CitedText text={a.reply} />
                    </p>
                  </li>
                ))}
              </ol>
            ) : null}
          </AISurface>
          )}

          {lane === "clarify" && q ? (
            <ClarifyingQuestion
              question={q}
              step={s.answers.length + 1}
              total={s.answers.length + remainingQuestions(c, s).length}
              onAnswer={(i, text) => answer(i, text)}
            />
          ) : null}

          {showReply ? (
            <AISurface
              title={lane === "draft" ? `Draft reply in ${LANG_NAME[c.triage.language]}` : "Reply to customer"}
              action={
                <>
                  {c.sources.draft !== "real" ? <MockBadge /> : null}
                  {!done.sent ? (
                    <Button variant="ghost" size="sm" onClick={() => setEditing((e) => !e)}>
                      {editing ? "Done" : "Edit"}
                    </Button>
                  ) : null}
                </>
              }
            >
              <GroundedReply draft={c.draft} lang={c.triage.language} editing={editing && !done.sent} />
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {done.sent ? (
                  <p role="status" className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-success-fg">
                    <CheckIcon className="size-4" aria-hidden="true" />
                    Sent {lane === "draft" ? "" : "to customer "}
                    <Badge variant="outline">Simulated</Badge>
                  </p>
                ) : lane === "draft" ? (
                  <div className="hidden gap-2 md:flex">
                    <Button onClick={send}>Approve and send</Button>
                    <Button variant="outline" onClick={() => escalate("Operator sent it for review")}>
                      Escalate
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={send}>
                    <SendIcon data-icon="inline-start" aria-hidden="true" />
                    Send reply
                  </Button>
                )}
              </div>
            </AISurface>
          ) : null}

          <Latency c={c} />
        </div>

        <div className="min-w-0 self-start lg:col-start-1 lg:row-start-2">
          <Classification c={c} s={s} onAccept={accept} onChange={change} />
        </div>

        <div className="min-w-0 lg:col-start-2 lg:row-start-3 xl:col-start-3 xl:row-span-2 xl:row-start-1">
          <EvidenceRail precedents={c.precedents} cited={cited} mock={c.sources.retrieve !== "real"} />
        </div>
      </div>

      {primary ? (
        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
          <PrimaryButton lane={lane} primary={primary} className="flex-1" />
          {lane === "draft" && !done.sent ? (
            <Button variant="outline" onClick={() => escalate("Operator sent it for review")}>
              Escalate
            </Button>
          ) : null}
        </div>
      ) : null}
    </CitationProvider>
  )
}

function LaneBadge({ lane }: { lane: Lane }) {
  const { label, variant, Icon } = LANE[lane]
  return (
    <Badge variant={variant}>
      <Icon data-icon="inline-start" aria-hidden="true" />
      {label}
    </Badge>
  )
}

type Primary = { label: string; run: () => void; off: boolean }

function PrimaryButton({ lane, primary, className }: { lane: Lane; primary: Primary; className?: string }) {
  const Icon = primary.off ? CheckIcon : lane === "urgent" ? SirenIcon : lane === "review" ? UserRoundIcon : null
  return (
    <Button variant={lane === "urgent" && !primary.off ? "destructive" : "default"} className={className} onClick={primary.run} disabled={primary.off}>
      {Icon ? <Icon data-icon="inline-start" aria-hidden="true" /> : null}
      {primary.label}
    </Button>
  )
}

/** The request as the customer wrote it, who sent it, and (for /submit tickets) the shared-ID path. */
function CustomerRequest({ c }: { c: TicketCase & Partial<Pick<DemoCase, "customer">> }) {
  const [expanded, setExpanded] = React.useState(false)
  const lang = c.triage.language
  const cu = c.customer
  return (
    <section aria-labelledby="request-title" className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-4">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1 self-start rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
        Inbox
      </Link>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <h2 id="request-title" className="font-semibold text-foreground">
          Customer request
        </h2>
        <span className="ml-auto uppercase">{lang}</span>
        <span className="font-mono">{c.received}</span>
      </div>
      {cu ? (
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold"
          >
            {cu.name
              .split(" ")
              .map((p) => p[0])
              .join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{cu.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {cu.org}
              {cu.criticalCare ? " · critical care" : ""}
            </p>
          </div>
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-balance" lang={lang}>
        {c.subject}
      </h3>
      <blockquote
        lang={lang}
        className={cn(
          "border-l-2 pl-3 text-[0.9375rem] leading-relaxed whitespace-pre-line",
          !expanded && !cu && "line-clamp-3"
        )}
      >
        {c.body}
      </blockquote>
      {!cu ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1 self-start rounded-sm text-xs font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {expanded ? "Less" : "Full message"}
          <ChevronDownIcon className={cn("size-3.5 transition-transform duration-150", expanded && "rotate-180")} aria-hidden="true" />
        </button>
      ) : (
        <div className="flex flex-col gap-2 border-t pt-3">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem]">
            <span className="text-muted-foreground">/submit receipt</span>
            <TicketId id={c.ticket_id} />
            <ArrowRightIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">same ID here</span>
            <Badge variant="outline" className="ml-auto">
              Simulated link
            </Badge>
          </p>
          <p className="text-[0.8125rem]">
            <span className="text-muted-foreground">Customer sees: </span>
            {cu.sees}
          </p>
        </div>
      )}
    </section>
  )
}

function Classification({
  c,
  s,
  onAccept,
  onChange,
}: {
  c: TicketCase
  s: CaseState
  onAccept: (f: TriageField) => void
  onChange: (f: TriageField, v: string) => void
}) {
  return (
    <section aria-labelledby="class-title" className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 id="class-title" className="text-sm font-semibold">
          Classification
        </h2>
        {c.sources.triage !== "real" ? <MockBadge /> : null}
      </div>
      {TRIAGE_FIELDS.map((f) => {
        const status = s.fields[f]
        const value = s.triage[f]
        const conf = s.triage[`${f}_conf` as const]
        const labelId = `${c.ticket_id}-${f}`
        return (
          <div key={f} className="grid grid-cols-[4rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1">
            <span id={labelId} className="pt-1.5 text-xs text-muted-foreground">
              {FIELD_LABEL[f]}
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Select value={value} onValueChange={(v) => onChange(f, v)}>
                <SelectTrigger
                  size="sm"
                  aria-labelledby={labelId}
                  className={cn("h-7 w-full min-w-0 text-[0.8125rem]", status === "suggested" && "border-dashed border-muted-foreground/60")}
                >
                  {f === "priority" ? <PriorityBadge priority={value as Priority} /> : <SelectValue />}
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  {OPTIONS[f].map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-[0.8125rem]">
                      {f === "priority" ? PRIORITY_LABEL[opt as Priority] : opt}
                      {opt === c.triage[f] ? <span className="ml-1 text-xs text-muted-foreground">suggested</span> : null}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex min-h-6 items-center justify-between gap-2">
                {status === "suggested" ? (
                  <>
                    <ConfidenceMeter value={conf} label={FIELD_LABEL[f]} />
                    <Button size="xs" variant="ghost" className="text-primary hover:text-primary" onClick={() => onAccept(f)}>
                      <CheckIcon data-icon="inline-start" aria-hidden="true" />
                      Accept
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {status === "changed" ? `Changed from ${f === "priority" ? PRIORITY_LABEL[c.triage.priority] : c.triage[f]}` : "Accepted"}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}

/** The single outcome: what happens next, why, and the one action. */
function Outcome({
  lane,
  reasons,
  route,
  escalate,
  grounded,
  hasDraft,
  done,
  primary,
}: {
  lane: Lane
  reasons: string[]
  route: string | null
  escalate: boolean
  grounded: boolean
  hasDraft: boolean
  done: Done
  primary: Primary | null
}) {
  const [all, setAll] = React.useState(false)
  const { title, tint, Icon } = LANE[lane]
  const shown = all ? reasons : reasons.slice(0, 3)
  const team = route?.split(" · ")[0]
  const heading = lane === "review" && team ? `${title}: ${team}` : title
  return (
    <section aria-labelledby="outcome-title" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div role="status" className={cn("flex flex-col gap-1.5 rounded-lg px-3 py-2.5", tint)}>
        <div className="flex items-center gap-2">
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          <h2 id="outcome-title" className="text-sm font-semibold">
            {heading}
          </h2>
        </div>
        {lane === "urgent" || lane === "review" ? (
          shown.length ? (
            <ul className="ml-6 list-disc space-y-0.5 text-[0.8125rem] marker:opacity-60">
              {shown.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null
        ) : null}
      </div>
      {reasons.length > 3 && (lane === "urgent" || lane === "review") ? (
        <Button variant="link" size="sm" className="h-auto self-start p-0" onClick={() => setAll((a) => !a)}>
          {all ? "Less" : `More (${reasons.length - 3})`}
        </Button>
      ) : null}
      {lane === "urgent" && route ? <p className="text-[0.8125rem] text-muted-foreground">{route.replace(" · ", ": ")}</p> : null}

      {done.paged ? (
        <p className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium">
          <CheckIcon className="size-4 text-success-fg" aria-hidden="true" />
          On-call paged <span className="font-mono text-muted-foreground">{done.paged}</span>
          <Badge variant="outline">Simulated</Badge>
        </p>
      ) : null}
      {done.assigned ? (
        <p className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium">
          <CheckIcon className="size-4 text-success-fg" aria-hidden="true" />
          Assigned to you
          <Badge variant="outline">Simulated</Badge>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {primary && lane !== "draft" ? <PrimaryButton lane={lane} primary={primary} className="hidden md:inline-flex" /> : null}
        <p className="ml-auto font-mono text-xs text-muted-foreground" aria-label="Pipeline result">
          escalate {String(escalate)} · grounded {hasDraft ? String(grounded) : "n/a"}
        </p>
      </div>
      {lane === "draft" && !grounded ? (
        <p className="text-xs text-warning-fg">Pipeline would escalate: draft not fully grounded.</p>
      ) : null}
    </section>
  )
}

function OnCallBrief({
  id,
  lines,
  customer,
  mock,
}: {
  id: string
  lines: NonNullable<DemoCase["brief"]>
  customer?: DemoCase["customer"]
  mock: boolean
}) {
  const copy = async () => {
    const text = [`${id} on-call brief`, ...(customer ? [`Contact: ${customer.name}, ${customer.org}`] : []), ...lines.map((l) => `${l.label}: ${l.text}`)].join("\n")
    try {
      await navigator.clipboard.writeText(text)
      toast("Brief copied")
    } catch {
      toast("Couldn't copy the brief")
    }
  }
  return (
    <AISurface
      title="On-call brief"
      action={
        <>
          {mock ? <MockBadge /> : null}
          <Button variant="ghost" size="sm" onClick={copy}>
            <CopyIcon data-icon="inline-start" aria-hidden="true" />
            Copy
          </Button>
        </>
      }
    >
      <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-[0.9375rem] leading-relaxed">
        {lines.map((l) => (
          <React.Fragment key={l.label}>
            <dt className="pt-0.5 text-xs text-muted-foreground">{l.label}</dt>
            <dd className="min-w-0">
              <CitedText text={l.text} />
            </dd>
          </React.Fragment>
        ))}
      </dl>
    </AISurface>
  )
}

// Time per pipeline stage, from PipelineResult.timings_ms.
function Latency({ c }: { c: TicketCase }) {
  const t = c.timings_ms
  const mock = Object.values(c.sources).some((v) => v !== "real")
  return (
    <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Pipeline latency">
      {STAGES.map(({ key, label }) => (
        <span key={key}>
          {label} <span className="font-mono text-foreground">{t[key] ? `${t[key]} ms` : "skipped"}</span>
        </span>
      ))}
      <span>
        Total <span className="font-mono text-foreground">{(t.total_ms / 1000).toFixed(1)} s</span>
      </span>
      {mock ? <MockBadge /> : null}
    </footer>
  )
}
