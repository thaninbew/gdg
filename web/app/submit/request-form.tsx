"use client"

import { useEffect, useMemo, useState } from "react"
import { CircleCheckIcon, FlaskConicalIcon, SendIcon, UserRoundIcon } from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Priority } from "@/lib/types"
import { cn } from "@/lib/utils"

import { ACCOUNTS, SAMPLES, analyze, handoff, resolve, ticketId, type AccountId, type Analysis, type Outcome, type Topic } from "./logic"
import { Answer, Breakdown, Handoff, Review, Urgent } from "./outcomes"
import { mockStages, probe, toOutcome, triage } from "./pipeline"
import { TOPICS } from "./topics"

type Backend = "checking" | "online" | "offline"
type Classification = { type: string; typeConf: number; queue: string; queueConf: number; priority: Priority }
type Via = { kind: "pipeline"; mock: string[] } | { kind: "local"; fallback: boolean } | { kind: "person" }
type Done = { id: string; outcome: Outcome; via: Via; cls: Classification | null }
type Mine = { id: string; title: string; outcome: Outcome }

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
    if (!a) return
    const id = ticketId(full, accountId, sampleId)
    const ans = q && !person ? matchOption(a, answer) : null
    let d: Done
    if (person) {
      d = { id, outcome: handoff(a.topic, "You asked for a person."), via: { kind: "person" }, cls: null }
    } else if (backend === "online") {
      setSending(true)
      // No clarification field in the contract: the answer travels as body context.
      const body = [text.trim(), ans ? `${q?.prompt} ${ans}` : ""].filter(Boolean).join("\n\n")
      try {
        const r = await triage(title.trim(), body)
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
      } catch {
        d = { id, outcome: resolve(full, a, ans, accountId), via: { kind: "local", fallback: true }, cls: localClassification(a, topic) }
      } finally {
        setSending(false)
      }
    } else {
      d = { id, outcome: resolve(full, a, ans, accountId), via: { kind: "local", fallback: false }, cls: localClassification(a, topic) }
    }
    setDone(d)
    setMine((m) => [{ id: d.id, title: title.trim() || text.trim(), outcome: d.outcome }, ...m.filter((x) => x.id !== d.id)])
  }

  function reset(t = "") {
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
                      setTopic(s.topic)
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
                {done.outcome.kind === "answer" ? <Answer sentences={done.outcome.sentences} sample={done.outcome.sample} /> : null}
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
                  <Badge variant="outline">{done.via.kind === "person" ? "Your choice" : "Local rules"}</Badge>
                )}
                <span>Demo: not saved, no one notified.</span>
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
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Demo</Badge>
            {backend === "online"
              ? "Sends to the local pipeline. Nothing is saved, paged or charged."
              : "Local rules and sample data. Nothing is sent, paged or charged."}
          </p>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <section
            aria-label="Classification"
            aria-busy={sending}
            data-generating={sending}
            className={cn("p-4", sending || done?.via.kind === "pipeline" ? "ai-surface rounded-xl" : "rounded-lg border bg-card")}
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

function ClassRows({ type, typeConf, queue, queueConf, priority }: Classification) {
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
