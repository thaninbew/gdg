"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CircleCheckIcon, FlaskConicalIcon, SendIcon, UserRoundIcon } from "lucide-react"

import { CONFIDENCE_BANDS, ConfidenceMeter } from "@/components/sentinel/confidence"
import { Wordmark } from "@/components/sentinel/logo"
import { PriorityBadge, TicketId } from "@/components/sentinel/status"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PRESENTER_CONSOLE, PRESENTER_SUBMIT, usePresenterTicket, type PresenterTicket } from "@/lib/presenter-ticket"
import type { Priority } from "@/lib/types"
import { cn } from "@/lib/utils"

import { ACCOUNTS, SAMPLES, analyze, handoff, resolve, ticketId, type AccountId, type Analysis, type Outcome, type Topic } from "./logic"
import { Answer, Breakdown, Handoff, Review, Urgent } from "./outcomes"
import { canPresent, mockStages, probe, toOutcome, triage } from "./pipeline"
import { TOPICS } from "./topics"

type Backend = "checking" | "online" | "offline"
type Classification = { type: string; typeConf: number; queue: string; queueConf: number; priority: Priority }
type Via = { kind: "pipeline"; mock: string[] } | { kind: "local"; fallback: boolean } | { kind: "person" }
type Done = { id: string; outcome: Outcome; via: Via; cls: Classification | null }
// One saved request in this browser session. Only what the customer sent and was shown.
type Mine = { id: string; subject: string; message: string; sentAt: string; outcome: Outcome; via: Via }

// Offline stand-in for the classifier. Labelled "Local rules" wherever it shows.
const LOCAL_CLASS: Record<Topic | "none", { type: string; queue: string; priority: Priority }> = {
  billing: { type: "Request", queue: "Billing and Payments", priority: "low" },
  broken: { type: "Incident", queue: "Technical Support", priority: "medium" },
  question: { type: "Request", queue: "Customer Service", priority: "low" },
  improvement: { type: "Change", queue: "Product Support", priority: "low" },
  none: { type: "Request", queue: "Customer Service", priority: "low" },
}

function localClassification(a: Analysis, chosen: Topic | null): Classification {
  const c = a.critical ? { type: "Incident", queue: "Technical Support", priority: "high" as Priority } : LOCAL_CLASS[a.topic ?? "none"]
  const conf = chosen || a.critical ? 0.9 : a.topic ? 0.75 : 0.5
  return { ...c, typeConf: conf, queueConf: conf }
}

function matchOption(a: Analysis, typed: string) {
  const t = typed.trim()
  return a.question?.options.find((o) => o.toLowerCase() === t.toLowerCase()) ?? t
}

function status(o: Outcome) {
  if (o.kind === "action" || o.kind === "answer") return { label: "Answered", variant: "success" as const }
  if (o.kind === "urgent") return { label: "Urgent", variant: "critical" as const }
  if (o.kind === "review") return { label: "In review", variant: "outline" as const }
  return { label: o.team, variant: "outline" as const }
}

export function RequestForm() {
  const presenter = useSearchParams().get("presenter") === "1"
  const { ticket, setTicket } = usePresenterTicket()
  const [accountId, setAccountId] = useState<AccountId>("weber")
  const [sampleId, setSampleId] = useState<string | null>(null)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [answer, setAnswer] = useState("")
  const [done, setDone] = useState<Done | null>(null)
  const [sending, setSending] = useState(false)
  const [mine, setMine] = useState<Mine[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  // When the result replaces the form, put focus on its headline instead of dropping it on <body>.
  const resultHeading = useRef<HTMLHeadingElement | null>(null)
  useEffect(() => {
    if (done) resultHeading.current?.focus({ preventScroll: true })
  }, [done])
  const lastRow = useRef<HTMLButtonElement | null>(null)
  const opened = mine.find((m) => m.id === openId) ?? null
  const presenterTicket = presenter && ticket && done?.id === ticket.id ? ticket : null
  const [backend, setBackend] = useState<Backend>("checking")
  const account = ACCOUNTS[accountId]

  // Only the one missing-detail question is worked out while typing; classification waits for Send.
  const full = `${title} ${text}`.trim()
  const a = useMemo(() => (full ? analyze(full, topic, accountId) : null), [full, topic, accountId])
  const q = a?.question ?? null
  const ready = Boolean(text.trim()) && (!q || Boolean(answer.trim())) && !sending

  useEffect(() => {
    let off = false
    probe().then((ok) => !off && setBackend(ok ? "online" : "offline"))
    return () => {
      off = true
    }
  }, [])

  async function submit(person = false) {
    if (!a || sending) return
    const id = ticketId(full, accountId, sampleId)
    const ans = q && !person ? matchOption(a, answer) : null
    // No clarification field in the contract: the answer travels as body context.
    const request = {
      subject: title.trim(),
      body: [text.trim(), ans ? `${q?.prompt} ${ans}` : ""].filter(Boolean).join("\n\n"),
    }
    setSending(true)
    let d: Done
    if (person) {
      await localPause()
      d = { id, outcome: handoff(a.topic, "You asked for a person."), via: { kind: "person" }, cls: null }
      setSending(false)
    } else if (backend === "online") {
      try {
        const r = await triage(request.subject, request.body)
        d = {
          id,
          outcome: toOutcome(r, a),
          via: { kind: "pipeline", mock: mockStages(r) },
          cls: {
            type: r.triage.type,
            typeConf: r.triage.type_conf,
            queue: r.triage.queue,
            queueConf: r.triage.queue_conf,
            priority: r.triage.priority,
          },
        }
        if (presenter && canPresent(r)) setTicket({ id, request, result: r })
      } catch {
        d = { id, outcome: resolve(full, a, ans, accountId), via: { kind: "local", fallback: true }, cls: localClassification(a, topic) }
      } finally {
        setSending(false)
      }
    } else {
      await localPause()
      d = { id, outcome: resolve(full, a, ans, accountId), via: { kind: "local", fallback: false }, cls: localClassification(a, topic) }
      setSending(false)
    }
    setDone(d)
    const sentAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const entry: Mine = { id: d.id, subject: request.subject, message: request.body, sentAt, outcome: d.outcome, via: d.via }
    setMine((m) => [entry, ...m.filter((x) => x.id !== d.id)])
  }

  function reset(t = "") {
    if (presenter) setTicket(null)
    setTitle("")
    setText(t)
    setAnswer("")
    setDone(null)
  }

  return (
    <div className="min-h-svh bg-canvas">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Wordmark />
          <span className="text-sm text-muted-foreground">Support</span>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <span className="hidden min-w-0 truncate text-[0.8125rem] sm:inline">{account.org}</span>
            {account.criticalCare ? (
              <Badge variant="outline" className="hidden sm:inline-flex">
                Critical care
              </Badge>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <FlaskConicalIcon data-icon="inline-start" aria-hidden="true" />
                  Demo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Fill a sample</DropdownMenuLabel>
                {SAMPLES.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onSelect={() => {
                      setAccountId(s.account)
                      setSampleId(s.id)
                      setTopic(s.topic)
                      reset(s.text)
                    }}
                  >
                    {s.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <Link href={presenter ? "/submit" : PRESENTER_SUBMIT} onClick={() => setTicket(null)}>
                    {presenter ? "Exit presenter mode" : "Enter presenter mode"}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">New request</h1>
            {presenter ? <Badge variant="outline">Presenter mode · Use sample data</Badge> : null}
          </div>
          {sending ? (
            <section
              aria-busy="true"
              aria-live="polite"
              className="flex flex-col gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
            >
              <p className="text-base font-semibold">{backend === "online" ? "Checking your request…" : "Checking…"}</p>
              <div
                data-generating={backend === "online"}
                className={cn("flex flex-col gap-3 p-4", backend === "online" ? "ai-surface rounded-xl" : "rounded-lg border bg-card")}
              >
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3.5 w-3/5" />
              </div>
            </section>
          ) : done ? (
            <section className="flex flex-col gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
              <div className="flex flex-wrap items-center gap-2">
                {isAutomatic(done.outcome) ? (
                  <CircleCheckIcon className="size-5 text-success" aria-hidden="true" />
                ) : (
                  <UserRoundIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                )}
                <h2 ref={resultHeading} tabIndex={-1} className="text-base font-semibold outline-none">
                  {isAutomatic(done.outcome) ? "Answered automatically" : "An agent will take your request"}
                </h2>
                {done.outcome.kind === "urgent" ? <Badge variant="critical">Urgent</Badge> : null}
                <TicketId id={done.id} className="ml-auto rounded-md border bg-card px-1.5 py-0.5" />
              </div>
              {done.via.kind === "local" && done.via.fallback ? (
                <Alert>
                  <AlertDescription>The pipeline didn&apos;t respond, so local rules decided this.</AlertDescription>
                </Alert>
              ) : null}
              <div role="status">
                <OutcomeCard outcome={done.outcome} />
              </div>
              {presenter && !presenterTicket ? (
                <p role="status" className="text-sm text-muted-foreground">No pipeline result is available to hand off.</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {presenterTicket ? (
                  <Button asChild>
                    <Link href={PRESENTER_CONSOLE}>Open in console</Link>
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSampleId(null)
                    setTopic(null)
                    reset()
                  }}
                >
                  New request
                </Button>
              </div>
              {presenterTicket ? <PresenterDetails ticket={presenterTicket} /> : null}
            </section>
          ) : (
            <form
              className="flex flex-col rounded-xl border bg-card transition-colors focus-within:border-foreground/25"
              onSubmit={(e) => {
                e.preventDefault()
                if (ready) void submit()
              }}
            >
              <Label htmlFor="req-title" className="sr-only">
                Title, optional
              </Label>
              <Input
                id="req-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="h-11 rounded-none border-0 border-b bg-transparent px-4 text-[0.9375rem] font-medium shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <Label htmlFor="req-text" className="sr-only">
                Details
              </Label>
              <Textarea
                id="req-text"
                autoFocus
                rows={7}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  setSampleId(null)
                }}
                placeholder="Describe what you need"
                className="min-h-44 resize-none rounded-none border-0 bg-transparent px-4 py-3 text-[0.9375rem] leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              {q ? (
                <fieldset className="flex flex-col gap-2 border-t px-4 py-3">
                  <legend className="sr-only">{q.prompt}</legend>
                  <p className="text-sm font-medium">
                    {q.prompt} <span className="font-normal text-muted-foreground">{q.why}</span>
                  </p>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    spacing={2}
                    value={(q.options as string[]).includes(answer) ? answer : ""}
                    onValueChange={(v) => setAnswer(v)}
                    aria-label={q.prompt}
                    className="flex-wrap"
                  >
                    {q.options.map((o) => (
                      <ToggleGroupItem
                        key={o}
                        value={o}
                        className={cn(
                          "data-[state=on]:border-foreground/25 data-[state=on]:bg-muted data-[state=on]:text-foreground",
                          q.kind === "invoice" && "font-mono"
                        )}
                      >
                        {o}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </fieldset>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2.5">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  spacing={1}
                  value={topic ?? ""}
                  onValueChange={(v) => setTopic((v || null) as Topic | null)}
                  aria-label="Topic, optional"
                  className="flex-wrap"
                >
                  {TOPICS.map(({ id, label, Icon }) => (
                    <Tooltip key={id}>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem
                          value={id}
                          aria-label={label}
                          className="data-[state=on]:border-foreground/25 data-[state=on]:bg-muted data-[state=on]:text-foreground"
                        >
                          <Icon aria-hidden="true" />
                          <span className={cn("hidden", topic === id && "sm:inline")}>{label}</span>
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  ))}
                </ToggleGroup>
                <div className="ml-auto flex items-center gap-2">
                  {q ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => void submit(true)}>
                      <UserRoundIcon data-icon="inline-start" aria-hidden="true" />
                      Send to a person
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={!ready}>
                    <SendIcon data-icon="inline-start" aria-hidden="true" />
                    {sending ? "Sending…" : "Send request"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <section
            aria-label="Classification"
            aria-busy={sending}
            data-generating={sending && backend === "online"}
            className={cn("p-4", (sending && backend === "online") || done?.via.kind === "pipeline" ? "ai-surface rounded-xl" : "rounded-lg border bg-card")}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Classification</h2>
              <Badge variant="outline" className="ml-auto">
                {done?.via.kind === "pipeline"
                  ? done.via.mock.includes("triage")
                    ? "Mock"
                    : "Pipeline"
                  : backend === "online"
                    ? "Pipeline"
                    : "Local rules"}
              </Badge>
            </div>
            {sending ? (
              <div className="mt-3 flex flex-col gap-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-5 w-16" />
              </div>
            ) : done?.cls ? (
              <ClassRows {...done.cls} />
            ) : (
              <p className="mt-2 text-[0.8125rem] text-muted-foreground">
                {done ? "Not classified: sent straight to a person." : backend === "offline" ? "Pipeline offline. Runs on send." : "Runs when you send."}
              </p>
            )}
          </section>
          <section className="rounded-lg border bg-card p-4" aria-label="My requests">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">My requests</h2>
              <span className="ml-auto text-xs text-muted-foreground">This session</span>
            </div>
            {mine.length ? (
              <ul className="mt-2 flex flex-col">
                {mine.map((m) => {
                  const v = status(m.outcome)
                  return (
                    <li key={m.id} className="border-t first:border-t-0">
                      <button
                        type="button"
                        aria-haspopup="dialog"
                        aria-label={`Open ${m.id}: ${m.subject || firstLine(m.message)}`}
                        onClick={(e) => {
                          lastRow.current = e.currentTarget
                          setOpenId(m.id)
                        }}
                        className="-mx-2 flex w-[calc(100%+1rem)] flex-col gap-1 rounded-md px-2 py-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                      <span className="flex w-full items-center gap-2">
                        <TicketId id={m.id} className="text-muted-foreground" />
                        <Badge variant={v.variant} className="ml-auto max-w-40 truncate">
                          {v.variant === "outline" ? (
                            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-(image:--ai-gradient)" />
                          ) : null}
                          {v.label}
                        </Badge>
                      </span>
                      <span className="line-clamp-1 text-[0.8125rem]">{m.subject || firstLine(m.message)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-2 text-[0.8125rem] text-muted-foreground">Replies show up here.</p>
            )}
          </section>
        </aside>
      </main>

      <Sheet open={opened !== null} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent
          className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md"
          onCloseAutoFocus={(e) => {
            // The sheet opens from a row, not a SheetTrigger; hand focus back to that row.
            e.preventDefault()
            lastRow.current?.focus()
          }}
        >
          {opened ? <RequestDetail request={opened} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function PresenterDetails({ ticket }: { ticket: PresenterTicket }) {
  const { request, result } = ticket
  return (
    <details className="rounded-lg border bg-card p-4 text-sm">
      <summary className="cursor-pointer font-medium">Request and pipeline evidence</summary>
      <div className="mt-3 flex flex-col gap-3">
        <div className="break-words">
          {request.subject ? <p className="font-medium">{request.subject}</p> : null}
          <p className="whitespace-pre-wrap">{request.body}</p>
        </div>
        {result.reasons.length ? (
          <div>
            <h3 className="flex items-center gap-2 font-medium">
              Pipeline reasons
              {result.sources.gate !== "real" ? <Badge variant="outline">Mock</Badge> : null}
            </h3>
            <ul className="ml-4 list-disc">{result.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul>
          </div>
        ) : null}
        {result.precedents.length ? (
          <div>
            <h3 className="flex items-center gap-2 font-medium">
              Similar past tickets
              {result.sources.retrieve !== "real" ? <Badge variant="outline">Mock</Badge> : null}
            </h3>
            <ul className="mt-2 space-y-2">
              {result.precedents.map((precedent) => (
                <li key={precedent.ticket_id} className="break-words">
                  <TicketId id={precedent.ticket_id} /> {precedent.subject}
                  <blockquote className="line-clamp-2 text-muted-foreground">{precedent.answer_snippet}</blockquote>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  )
}

// Gradient bar for Confident/Likely; Ambiguous keeps the meter's warning color.
const GRADIENT_METER = (v: number) =>
  v >= CONFIDENCE_BANDS.likely ? "[&_[data-slot=progress-indicator]]:bg-(image:--ai-gradient)" : undefined

function ClassRows({ type, typeConf, queue, queueConf, priority }: Classification) {
  return (
    <dl className="mt-3 flex flex-col gap-3 text-[0.8125rem]">
      <div className="flex flex-col gap-1">
        <dt className="text-xs text-muted-foreground">Type</dt>
        <dd className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-medium">{type}</span>
          <ConfidenceMeter value={typeConf} label="Type" className={GRADIENT_METER(typeConf)} />
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-xs text-muted-foreground">Queue</dt>
        <dd className="flex items-center justify-between gap-2">
          <span className="min-w-0 font-medium">{queue}</span>
          <ConfidenceMeter value={queueConf} label="Queue" className={GRADIENT_METER(queueConf)} />
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-xs text-muted-foreground">Priority</dt>
        <dd>
          <PriorityBadge priority={priority} />
        </dd>
      </div>
    </dl>
  )
}

// Two outcomes for the customer: answered automatically, or an agent takes it (urgent included).
function isAutomatic(o: Outcome) {
  return o.kind === "answer" || o.kind === "action"
}

// Local rules answer instantly; a short pause keeps the result from flashing in. Skipped for reduced motion.
function localPause() {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  return new Promise((done) => setTimeout(done, reduced ? 0 : 600))
}

function firstLine(text: string) {
  return text.split("\n")[0]
}

function OutcomeCard({ outcome }: { outcome: Outcome }) {
  if (outcome.kind === "urgent") return <Urgent reasons={outcome.reasons} />
  if (outcome.kind === "action") return <Breakdown invoice={outcome.invoice} previous={outcome.previous} />
  if (outcome.kind === "answer") return <Answer sentences={outcome.sentences} sample={outcome.sample} />
  if (outcome.kind === "handoff") return <Handoff team={outcome.team} reason={outcome.reason} />
  return <Review />
}

// Customer-facing detail for one saved request: what they sent and what they were told.
function RequestDetail({ request: r }: { request: Mine }) {
  const v = status(r.outcome)
  return (
    <>
      <SheetHeader className="border-b pr-12">
        <TicketId id={r.id} className="text-muted-foreground" />
        <SheetTitle className="text-base">{r.subject || <span className="text-muted-foreground">No subject</span>}</SheetTitle>
        <SheetDescription className="flex flex-wrap items-center gap-2">
          <Badge variant={v.variant}>
            {v.variant === "outline" ? (
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-(image:--ai-gradient)" />
            ) : null}
            {r.outcome.kind === "handoff" ? `With ${r.outcome.team}` : v.label}
          </Badge>
          <span>Sent {r.sentAt}</span>
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-5 p-4">
        <section className="flex flex-col gap-1.5">
          <h3 className="text-xs text-muted-foreground">Your message</h3>
          <p className="rounded-lg border bg-card px-3 py-2.5 text-[0.8125rem] whitespace-pre-wrap">{r.message}</p>
        </section>
        <section className="flex flex-col gap-1.5">
          <h3 className="text-xs text-muted-foreground">Update</h3>
          <OutcomeCard outcome={r.outcome} />
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {r.via.kind === "pipeline" ? (
              <>
                Decided by the pipeline
                {r.via.mock.length ? <Badge variant="outline">Mock: {r.via.mock.join(", ")}</Badge> : null}
              </>
            ) : (
              <Badge variant="outline">{r.via.kind === "person" ? "Your choice" : "Local rules"}</Badge>
            )}
            <span>Demo: not saved, no one notified.</span>
          </p>
        </section>
      </div>
      <SheetFooter className="mt-auto border-t">
        <SheetClose asChild>
          <Button variant="outline">Back to my requests</Button>
        </SheetClose>
      </SheetFooter>
    </>
  )
}
