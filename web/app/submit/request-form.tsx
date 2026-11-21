"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CircleCheckIcon, FlaskConicalIcon, SendIcon, SirenIcon, UserRoundIcon } from "lucide-react"

import { ConfidenceMeter } from "@/components/sentinel/confidence"
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
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Priority } from "@/lib/types"
import { cn } from "@/lib/utils"

import {
  ACCOUNTS,
  SAMPLES,
  analyze,
  handoff,
  resolve,
  ticketId,
  type AccountId,
  type Analysis,
  type Outcome,
  type Topic,
} from "./logic"
import { Answer, Breakdown, Handoff, Review, Urgent } from "./outcomes"
import { mockStages, probe, toOutcome, triage, type Triaged } from "./pipeline"
import { TOPICS } from "./topics"

type Backend = "checking" | "online" | "offline"
type Via = { kind: "pipeline"; mock: string[] } | { kind: "local"; fallback: boolean }
type Done = { id: string; outcome: Outcome; via: Via }
type Mine = { id: string; title: string; outcome: Outcome }

// Local stand-in for the classifier when the backend is offline.
const LOCAL_CLASS: Record<Topic | "none", { type: string; queue: string; priority: Priority }> = {
  billing: { type: "Request", queue: "Billing & Payments", priority: "low" },
  broken: { type: "Incident", queue: "Technical support", priority: "medium" },
  question: { type: "Request", queue: "Customer service", priority: "low" },
  improvement: { type: "Change", queue: "Product", priority: "low" },
  none: { type: "Request", queue: "Customer service", priority: "low" },
}

function matchOption(a: Analysis, typed: string) {
  const t = typed.trim()
  return a.question?.options.find((o) => o.toLowerCase() === t.toLowerCase()) ?? t
}

function status(o: Outcome) {
  if (o.kind === "action" || o.kind === "answer") return { label: "Answered", variant: "success" as const }
  if (o.kind === "urgent") return { label: "Urgent", variant: "critical" as const }
  if (o.kind === "review") return { label: "In review", variant: "outline" as const }
  return { label: o.team, variant: "info" as const }
}

export function RequestForm() {
  const [accountId, setAccountId] = useState<AccountId>("weber")
  const [sampleId, setSampleId] = useState<string | null>(null)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [answer, setAnswer] = useState("")
  const [done, setDone] = useState<Done | null>(null)
  const [sending, setSending] = useState(false)
  const [mine, setMine] = useState<Mine[]>([])
  const [backend, setBackend] = useState<Backend>("checking")
  const [live, setLive] = useState<{ key: string; result: Triaged } | null>(null)
  const [classifying, setClassifying] = useState(false)
  const account = ACCOUNTS[accountId]

  const full = `${title} ${text}`.trim()
  const a = useMemo(() => (full ? analyze(full, topic, accountId) : null), [full, topic, accountId])
  const q = a?.question ?? null
  const answerText = q && answer.trim() && a ? `${q.prompt} ${matchOption(a, answer)}` : ""
  const body = [text.trim(), answerText].filter(Boolean).join("\n\n")
  const key = `${title.trim()}\u0000${body}`
  const ready = Boolean(text.trim()) && (!q || Boolean(answer.trim())) && !sending

  useEffect(() => {
    let off = false
    probe().then((ok) => !off && setBackend(ok ? "online" : "offline"))
    return () => {
      off = true
    }
  }, [])

  // Classify as the customer types, once they pause.
  const inflight = useRef<AbortController | null>(null)
  useEffect(() => {
    if (backend !== "online" || done || text.trim().length < 12 || live?.key === key) return
    const t = setTimeout(() => {
      inflight.current?.abort()
      const ctrl = new AbortController()
      inflight.current = ctrl
      setClassifying(true)
      triage(title.trim(), body, ctrl.signal)
        .then((result) => setLive({ key, result }))
        .catch(() => {})
        .finally(() => !ctrl.signal.aborted && setClassifying(false))
    }, 700)
    return () => clearTimeout(t)
  }, [backend, done, text, title, body, key, live?.key])

  async function submit(person = false) {
    if (!a) return
    const id = ticketId(full, accountId, sampleId)
    const ans = q && !person ? matchOption(a, answer) : null
    let d: Done
    if (person) {
      d = { id, outcome: handoff(a.topic, "You asked for a person."), via: { kind: "local", fallback: false } }
    } else if (backend === "online") {
      setSending(true)
      try {
        const r = live?.key === key ? live.result : await triage(title.trim(), body)
        d = { id, outcome: toOutcome(r, full, a, ans, accountId), via: { kind: "pipeline", mock: mockStages(r) } }
      } catch {
        d = { id, outcome: resolve(full, a, ans, accountId), via: { kind: "local", fallback: true } }
      } finally {
        setSending(false)
      }
    } else {
      d = { id, outcome: resolve(full, a, ans, accountId), via: { kind: "local", fallback: false } }
    }
    setDone(d)
    setMine((m) => [{ id: d.id, title: title.trim() || text.trim(), outcome: d.outcome }, ...m.filter((x) => x.id !== d.id)])
  }

  function reset(t = "") {
    setTitle("")
    setText(t)
    setAnswer("")
    setDone(null)
    setLive(null)
  }

  const liveResult = backend === "online" && live && !done ? live.result : null
  const shownTopic = topic ?? a?.topic ?? null
  const predicted = (() => {
    if (!a || done) return null
    if (q && !answer.trim()) return "one detail first"
    const ans = q ? matchOption(a, answer) : null
    const o = liveResult ? toOutcome(liveResult, full, a, ans, accountId) : resolve(full, a, ans, accountId)
    if (o.kind === "urgent") return "straight to on-call"
    if (o.kind === "action") return "invoice breakdown now"
    if (o.kind === "answer") return "answer right away"
    if (o.kind === "review") return "product review"
    return `to ${o.team}`
  })()
  const localCls = a ? (a.critical ? { type: "Incident", queue: "Network & Access", priority: "high" as Priority } : LOCAL_CLASS[a.topic ?? "none"]) : null
  const localConf = !a ? 0 : topic || a.critical ? 0.92 : a.topic ? 0.78 : 0.5

  return (
    <div className="min-h-svh bg-canvas">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Wordmark />
          <span className="text-sm text-muted-foreground">Support</span>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <span className="hidden min-w-0 truncate text-[0.8125rem] sm:inline">{account.org}</span>
            {account.criticalCare ? (
              <Badge variant="info" className="hidden sm:inline-flex">
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
                      setTopic(null)
                      reset(s.text)
                    }}
                  >
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <h1 className="text-xl font-semibold">New request</h1>
          {done ? (
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <CircleCheckIcon className="size-5 text-success" aria-hidden="true" />
                <p className="text-base font-semibold">Request received</p>
                <TicketId id={done.id} className="ml-auto rounded-md border bg-card px-1.5 py-0.5" />
              </div>
              {done.via.kind === "local" && done.via.fallback ? (
                <Alert>
                  <AlertDescription>The pipeline didn&apos;t respond, so local rules decided this.</AlertDescription>
                </Alert>
              ) : null}
              <div role="status">
                {done.outcome.kind === "urgent" ? <Urgent reasons={done.outcome.reasons} /> : null}
                {done.outcome.kind === "action" ? <Breakdown invoice={done.outcome.invoice} previous={done.outcome.previous} /> : null}
                {done.outcome.kind === "answer" ? <Answer sentences={done.outcome.sentences} /> : null}
                {done.outcome.kind === "handoff" ? <Handoff team={done.outcome.team} reason={done.outcome.reason} /> : null}
                {done.outcome.kind === "review" ? <Review /> : null}
              </div>
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {done.via.kind === "pipeline" ? (
                  <>
                    Decided by the pipeline
                    {done.via.mock.length ? <Badge variant="outline">Mock: {done.via.mock.join(", ")}</Badge> : null}
                  </>
                ) : (
                  <>
                    <Badge variant="outline">Local rules</Badge>
                    {done.outcome.kind === "urgent" ? "Simulated: nobody was paged." : null}
                  </>
                )}
              </p>
              <div>
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
              {a?.critical ? (
                <p role="status" className="flex items-center gap-2 border-t bg-critical-tint px-4 py-2 text-[0.8125rem] text-critical-fg">
                  <SirenIcon className="size-3.5 shrink-0" aria-hidden="true" />
                  Urgent: goes straight to on-call, no questions
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2.5">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  spacing={1}
                  value={shownTopic ?? ""}
                  onValueChange={(v) => setTopic((v || null) as Topic | null)}
                  aria-label="Topic"
                  className="flex-wrap"
                >
                  {TOPICS.map(({ id, label, Icon }) => (
                    <Tooltip key={id}>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem
                          value={id}
                          aria-label={label}
                          className={cn(
                            "data-[state=on]:border-foreground/25 data-[state=on]:bg-muted data-[state=on]:text-foreground",
                            !topic && "data-[state=on]:border-dashed"
                          )}
                        >
                          <Icon aria-hidden="true" />
                          <span className={cn("hidden", (shownTopic === id || !shownTopic) && "md:inline")}>{label}</span>
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  ))}
                </ToggleGroup>
                {!topic && a?.topic ? <span className="sr-only">Suggested topic</span> : null}
                {topic ? (
                  <Button type="button" variant="link" size="xs" className="text-muted-foreground" onClick={() => setTopic(null)}>
                    Auto-detect
                  </Button>
                ) : null}
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
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Demo</Badge>
            {backend === "online"
              ? "Local pipeline connected. Nothing is paged or charged."
              : "Local rules and sample data. Nothing is sent, paged or charged."}
          </p>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <section
            aria-label="Classification"
            aria-busy={classifying}
            data-generating={classifying}
            className={cn("p-4", liveResult ? "ai-surface rounded-xl" : "rounded-lg border bg-card")}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Classification</h2>
              <Badge variant="outline" className="ml-auto">
                {backend === "online" ? (liveResult && mockStages(liveResult).includes("triage") ? "Mock" : "Pipeline") : "Local rules"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {backend === "checking"
                ? "Connecting…"
                : backend === "online"
                  ? liveResult && liveResult.timings_ms.total_ms >= 50
                    ? `${(liveResult.timings_ms.total_ms / 1000).toFixed(1)} s`
                    : "Classifies as you type"
                  : "Pipeline offline"}
            </p>
            {liveResult ? (
              <ClassRows
                type={liveResult.triage.type}
                typeConf={liveResult.triage.type_conf}
                queue={liveResult.triage.queue}
                queueConf={liveResult.triage.queue_conf}
                priority={liveResult.triage.priority}
              />
            ) : localCls && backend !== "online" ? (
              <ClassRows type={localCls.type} typeConf={localConf} queue={localCls.queue} queueConf={localConf} priority={localCls.priority} />
            ) : (
              <p className="mt-3 text-[0.8125rem] text-muted-foreground">Start typing to classify.</p>
            )}
            {predicted ? (
              <p className="mt-4 border-t pt-3 text-[0.8125rem]">
                <span className="text-muted-foreground">On send: </span>
                {predicted}
              </p>
            ) : null}
          </section>
          <section className="rounded-lg border bg-card p-4" aria-label="My requests">
            <h2 className="text-sm font-semibold">My requests</h2>
            {mine.length ? (
              <ul className="mt-2 flex flex-col">
                {mine.map((m) => {
                  const v = status(m.outcome)
                  return (
                    <li key={m.id} className="flex flex-col gap-1 border-t py-2 first:border-t-0">
                      <span className="flex items-center gap-2">
                        <TicketId id={m.id} className="text-muted-foreground" />
                        <Badge variant={v.variant} className="ml-auto max-w-40 truncate">
                          {v.label}
                        </Badge>
                      </span>
                      <span className="line-clamp-1 text-[0.8125rem]">{m.title}</span>
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
    </div>
  )
}

function ClassRows({
  type,
  typeConf,
  queue,
  queueConf,
  priority,
}: {
  type: string
  typeConf: number
  queue: string
  queueConf: number
  priority: Priority
}) {
  return (
    <dl className="mt-3 flex flex-col gap-3 text-[0.8125rem]">
      <div className="flex flex-col gap-1">
        <dt className="text-xs text-muted-foreground">Type</dt>
        <dd className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-medium">{type}</span>
          <ConfidenceMeter value={typeConf} label="Type" />
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-xs text-muted-foreground">Queue</dt>
        <dd className="flex items-center justify-between gap-2">
          <span className="min-w-0 font-medium">{queue}</span>
          <ConfidenceMeter value={queueConf} label="Queue" />
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
