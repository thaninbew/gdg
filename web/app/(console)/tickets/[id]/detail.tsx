"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeftIcon, CheckIcon, ChevronDownIcon, EyeIcon, Maximize2Icon, RefreshCwIcon, RotateCcwIcon, SirenIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AISurface } from "@/components/sentinel/ai"
import { MockBadge, OutcomeBadge } from "@/components/sentinel/case-outcome"
import { ClarifyingQuestion } from "@/components/sentinel/clarifying-question"
import { ConfidenceMeter } from "@/components/sentinel/confidence"
import { EvidenceRail } from "@/components/sentinel/evidence-rail"
import { CitationProvider, CitedText, GroundedReply, citedIds } from "@/components/sentinel/grounded-reply"
import { PageHeader } from "@/components/sentinel/page-header"
import { EscalationStatus, PriorityBadge, TicketId } from "@/components/sentinel/status"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { CustomerUpdate } from "@/components/sentinel/customer-update"
import { TicketCopilot } from "@/components/sentinel/copilot-chat"
import { useCases } from "@/lib/case-store"
import { nowTime, useCustomerUpdates } from "@/lib/customer-updates"
import { assignment, stripCitations, type CustomerPost } from "@/lib/customer-view"
import { gateReasons, openQuestion, outcome, remainingQuestions, TRIAGE_FIELDS, type CaseState } from "@/lib/gate"
import type { Priority, TicketCase, TriageField } from "@/lib/types"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

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

export function TicketDetail({
  id,
  variant = "page",
  closeHref = "/tickets",
}: {
  id: string
  /** "panel": beside the inbox list (single column, its own header). "page": full screen. */
  variant?: "page" | "panel"
  closeHref?: string
}) {
  const panel = variant === "panel"
  const { find, include, state, answer, accept, change, escalate, reset } = useCases()
  const updates = useCustomerUpdates()
  const { t, tc } = useI18n()
  const [editing, setEditing] = React.useState(false)
  const drafting = useDrafting()
  const c = find(id)
  // A ticket opened from Find a ticket loads from the store on first view.
  React.useEffect(() => {
    if (!c) include(id)
  }, [c, id, include])
  if (!c) return <MissingTicket id={id} />
  const s = state[id]
  const o = outcome(c, s)
  const reasons = gateReasons(c, s)
  const q = openQuestion(c, s)
  const urgent = reasons.some((r) => r.startsWith("High-priority"))
  const lang = c.triage.language
  // Each action posts what the customer should see; Undo takes it back.
  const post = (p: CustomerPost, message: string) => {
    updates.publish(id, p)
    toast(t(message), { description: t("The customer sees it in My requests."), action: { label: t("Undo"), onClick: () => updates.retract(id) } })
  }
  const act = () => post(assignment(s.triage.queue, s.triage.priority, lang, urgent, nowTime()), urgent ? `Paged on-call for ${id}` : `Assigned ${id} to you`)
  const send = () => post({ kind: "reply", text: stripCitations(c.draft.reply), at: nowTime() }, `Sent reply for ${id}`)
  const askRequester = (text: string) => post({ kind: "question", text, at: nowTime() }, "Question sent to the customer")
  const touched = s.answers.length > 0 || s.forced.length > 0 || TRIAGE_FIELDS.some((f) => s.fields[f] !== "suggested")

  const cited = new Set([
    ...citedIds(c.note),
    ...s.answers.flatMap((a) => [...citedIds(a.reply)]),
    ...(o === "draft" ? c.draft.cited_ticket_ids : []),
  ])

  const headerActions = (
    <>
      {touched ? (
        <Button variant="ghost" size="sm" onClick={() => reset(id)}>
          <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
          {t("Start over")}
        </Button>
      ) : null}
      <OutcomeBadge outcome={o} />
    </>
  )

  return (
    <CitationProvider precedents={c.precedents}>
      {panel ? (
        <div className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background px-4">
          <TicketId id={c.ticket_id} className="text-base font-semibold" />
          <div className="ml-auto flex items-center gap-1">
            {headerActions}
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href={`/tickets/${id}`} aria-label={t("Open full screen")} title={t("Full screen")}>
                <Maximize2Icon aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href={closeHref} aria-label={t("Close panel")} title={t("Close")}>
                <XIcon aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <PageHeader title={<TicketId id={c.ticket_id} className="text-xl" />} actions={headerActions} />
      )}

      <div
        className={cn(
          panel
            ? "flex flex-col gap-4 p-4"
            : "grid gap-6 p-4 pb-24 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:p-6 xl:grid-cols-[20rem_minmax(0,1fr)_19rem] xl:pb-6"
        )}
      >
        <TicketPanel
          backHref={panel ? null : `/tickets?open=${id}`}
          c={c}
          s={s}
          onAccept={(f) => accept(id, f)}
          onChange={(f, v) => change(id, f, v)}
        />

        <div className="flex min-w-0 flex-col gap-4">
          <AISurface title={t("Copilot read")} action={c.sources.triage !== "real" ? <MockBadge /> : null}>
            <p className="text-[0.9375rem] leading-relaxed">
              <CitedText text={tc(c.note)} />
            </p>
            {s.answers.length ? (
              <ol className="flex flex-col gap-3 border-t pt-3">
                {s.answers.map((a) => (
                  <li key={a.question} className="flex flex-col gap-1.5">
                    <p className="text-xs text-muted-foreground">{tc(a.question)}</p>
                    <p className="self-start rounded-md bg-secondary px-2 py-1 text-sm font-medium">{tc(a.label)}</p>
                    <p className="text-[0.9375rem] leading-relaxed">
                      <CitedText text={tc(a.reply)} />
                    </p>
                  </li>
                ))}
              </ol>
            ) : null}
          </AISurface>

          {o === "clarify" && q ? (
            <ClarifyingQuestion
              question={q}
              step={s.answers.length + 1}
              total={s.answers.length + remainingQuestions(c, s).length}
              onAnswer={(i, text) => answer(id, i, text)}
              onAskRequester={() => askRequester(q.ask_requester)}
            />
          ) : null}

          {o === "escalate" ? <Escalation reasons={reasons} route={s.route} urgent={urgent} onAct={act} /> : null}

          {o === "draft" ? (
            <AISurface
              title={t(`Draft reply in ${LANG_NAME[c.triage.language]}`)}
              generating={drafting.phase !== null}
              action={
                <>
                  {c.sources.draft !== "real" ? <MockBadge /> : null}
                  <Button variant="ghost" size="sm" onClick={drafting.start} disabled={drafting.phase !== null}>
                    <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
                    {t("Regenerate")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing((e) => !e)}>
                    {t(editing ? "Done" : "Edit")}
                  </Button>
                </>
              }
            >
              {drafting.phase ? (
                <div className="flex flex-col gap-2 py-1">
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    {t(
                      drafting.phase === "writing"
                        ? "Writing"
                        : `Checking ${c.draft.sentences?.length ?? 0} sentences against ${c.precedents.length} past tickets`
                    )}
                  </p>
                  <Skeleton className="h-3 w-11/12" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ) : (
                <GroundedReply draft={c.draft} lang={c.triage.language} editing={editing} />
              )}
              <div className="hidden flex-wrap gap-2 pt-2 md:flex">
                <Button onClick={send}>{t("Approve and send")}</Button>
                <Button variant="outline" onClick={() => escalate(id, "Operator sent it for review")}>
                  {t("Escalate")}
                </Button>
              </div>
            </AISurface>
          ) : null}

          <TicketCopilot ticket={c} />

          <section aria-labelledby="customer-sees" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <EyeIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              <h2 id="customer-sees" className="text-sm font-semibold">
                {t("Customer sees")}
              </h2>
              <span className="ml-auto text-xs text-muted-foreground uppercase">{lang}</span>
            </div>
            <CustomerUpdate posts={updates.posts(id)} lang={lang} />
          </section>

          <Latency c={c} />
        </div>

        <div className={cn(!panel && "lg:col-start-2 xl:col-start-auto")}>
          <EvidenceRail precedents={c.precedents} cited={cited} mock={c.sources.retrieve !== "real"} />
        </div>
      </div>

      {o !== "clarify" && !panel ? (
        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
          {o === "draft" ? (
            <>
              <Button className="flex-1" onClick={send}>
                {t("Approve and send")}
              </Button>
              <Button variant="outline" onClick={() => escalate(id, "Operator sent it for review")}>
                {t("Escalate")}
              </Button>
            </>
          ) : (
            <Button variant={urgent ? "destructive" : "default"} className="flex-1" onClick={act}>
              {urgent ? <SirenIcon data-icon="inline-start" aria-hidden="true" /> : null}
              {t(urgent ? "Page on-call" : "Assign to me")}
            </Button>
          )}
        </div>
      ) : null}
    </CitationProvider>
  )
}

// Simulated model run for Regenerate: writing, then the grounding check. The real API streams.
function useDrafting() {
  const [phase, setPhase] = React.useState<"writing" | "checking" | null>(null)
  const timers = React.useRef<number[]>([])
  React.useEffect(() => () => timers.current.forEach(window.clearTimeout), [])
  const start = () => {
    setPhase("writing")
    timers.current = [window.setTimeout(() => setPhase("checking"), 1100), window.setTimeout(() => setPhase(null), 1900)]
  }
  return { phase, start }
}

function TicketPanel({
  backHref,
  c,
  s,
  onAccept,
  onChange,
}: {
  /** Back to the inbox (with this ticket open beside it); hidden when already beside the inbox. */
  backHref: string | null
  c: TicketCase
  s: CaseState
  onAccept: (f: TriageField) => void
  onChange: (f: TriageField, v: string) => void
}) {
  const [expanded, setExpanded] = React.useState(false)
  const { t } = useI18n()
  const lang = c.triage.language
  return (
    <section aria-label={t("Ticket")} className="flex min-w-0 flex-col gap-4 self-start rounded-lg border bg-card p-4">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 self-start rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
          {t("Inbox")}
        </Link>
      ) : null}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="uppercase">{lang}</span>
          <span className="font-mono">{c.received}</span>
        </div>
        <h2 className="text-base font-semibold text-balance" lang={lang}>
          {c.subject}
        </h2>
        <p lang={lang} className={cn("text-[0.8125rem] leading-relaxed whitespace-pre-line text-muted-foreground", !expanded && "line-clamp-3")}>
          {c.body}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1 self-start rounded-sm text-xs font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t(expanded ? "Less" : "Full message")}
          <ChevronDownIcon className={cn("size-3.5 transition-transform duration-150", expanded && "rotate-180")} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("Triage")}</h3>
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
                {t(FIELD_LABEL[f])}
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <Select value={value} onValueChange={(v) => onChange(f, v)}>
                  <SelectTrigger
                    size="sm"
                    aria-labelledby={labelId}
                    className={cn(
                      "h-7 w-full min-w-0 text-[0.8125rem]",
                      status === "suggested" && "border-dashed border-muted-foreground/60"
                    )}
                  >
                    {f === "priority" ? (
                      <PriorityBadge priority={value as Priority} />
                    ) : (
                      <SelectValue>
                        <span className="truncate" title={value}>
                          {t(value)}
                        </span>
                      </SelectValue>
                    )}
                  </SelectTrigger>
                  <SelectContent position="popper" align="start">
                    {OPTIONS[f].map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-[0.8125rem]">
                        {t(f === "priority" ? PRIORITY_LABEL[opt as Priority] : opt)}
                        {opt === c.triage[f] ? <span className="ml-1 text-xs text-muted-foreground">{t("suggested")}</span> : null}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex min-h-6 items-center justify-between gap-2">
                  {status === "suggested" ? (
                    <>
                      <ConfidenceMeter value={conf} label={t(FIELD_LABEL[f])} />
                      <Button size="xs" variant="ghost" className="text-primary hover:text-primary" onClick={() => onAccept(f)}>
                        <CheckIcon data-icon="inline-start" aria-hidden="true" />
                        {t("Accept")}
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t(status === "changed" ? `Changed from ${f === "priority" ? PRIORITY_LABEL[c.triage.priority] : c.triage[f]}` : "Accepted")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Escalation({ reasons, route, urgent, onAct }: { reasons: string[]; route: string | null; urgent: boolean; onAct: () => void }) {
  const [all, setAll] = React.useState(false)
  const { t, tc } = useI18n()
  const shown = all ? reasons : reasons.slice(0, 3)
  return (
    <section aria-label={t("Escalation")} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <EscalationStatus escalate reasons={shown} />
      {reasons.length > 3 ? (
        <Button variant="link" size="sm" className="h-auto self-start p-0" onClick={() => setAll((a) => !a)}>
          {t(all ? "Less" : `More (${reasons.length - 3})`)}
        </Button>
      ) : null}
      {route ? <p className="text-[0.8125rem] text-muted-foreground">{tc(route).replace(" · ", ": ")}</p> : null}
      <div className="hidden gap-2 md:flex">
        <Button variant={urgent ? "destructive" : "default"} onClick={onAct}>
          {urgent ? <SirenIcon data-icon="inline-start" aria-hidden="true" /> : null}
          {t(urgent ? "Page on-call" : "Assign to me")}
        </Button>
      </div>
    </section>
  )
}

// Time per pipeline stage, from PipelineResult.timings_ms.
function Latency({ c }: { c: TicketCase }) {
  const ms = c.timings_ms
  const { t } = useI18n()
  const mock = Object.values(c.sources).some((v) => v !== "real")
  return (
    <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label={t("Pipeline latency")}>
      {STAGES.map(({ key, label }) => (
        <span key={key}>
          {t(label)} <span className="font-mono text-foreground">{ms[key] ? `${ms[key]} ms` : t("skipped")}</span>
        </span>
      ))}
      <span>
        {t("Total")} <span className="font-mono text-foreground">{(ms.total_ms / 1000).toFixed(1)} s</span>
      </span>
      {mock ? <MockBadge /> : null}
    </footer>
  )
}

// A ticket ID that isn't a demo case or the customer's live ticket in this session.
function MissingTicket({ id }: { id: string }) {
  const { t } = useI18n()
  return (
    <div className="p-4 lg:p-6">
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyDescription>{t(`${id} isn't in this session. Live tickets appear after a customer sends one from /submit.`)}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" asChild>
            <Link href="/tickets">{t("Back to inbox")}</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
