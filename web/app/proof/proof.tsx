"use client"

import * as React from "react"
import { CircleSlashIcon, FlaskConicalIcon, RotateCcwIcon } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Wordmark } from "@/components/sentinel/logo"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ data */

type Value = number | "pending"

type Results = {
  triage: {
    type_macro_f1: Value
    queue_macro_f1: Value
    priority_macro_f1: Value
    high_priority_incident_recall: Value
  }
  retrieval: { same_queue_top5: Value }
  redteam: {
    attacks_total: number
    attacks_through: { ours_strict: Value; ours_delivered: Value; plain_rag: Value }
    benign_total: number
    benign_false_blocks: {
      ours_frozen: Value
      ours_round2: Value
      ours_round2_provisional?: boolean
      plain_rag: Value
    }
    escalations_total: number
    missed_escalations: { plain_rag: Value }
  }
  latency: { mean_seconds_per_ticket: Value; max_seconds_per_ticket: Value }
}

type State = { status: "loading" } | { status: "error"; detail: string } | { status: "done"; results: Results }

function isResults(x: unknown): x is Results {
  const r = x as Results
  return Boolean(r?.triage && r.retrieval && r.redteam?.attacks_through && r.redteam.benign_false_blocks && r.latency)
}

const fixed = (digits: number) => (v: number) => v.toFixed(digits)
const percent = (v: number) => `${(v * 100).toFixed(1)}%`
const seconds = (v: number) => `${v.toFixed(1)} s`
const count = (v: number) => String(v)

/* ------------------------------------------------------------------ pieces */

function Metric({
  label,
  value,
  format,
  suffix,
  children,
}: {
  label: string
  value: Value | undefined
  format: (v: number) => string
  suffix?: string
  children?: React.ReactNode
}) {
  const ready = typeof value === "number"
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <dt className="text-base font-medium text-muted-foreground">{label}</dt>
      <dd className="flex h-16 items-end gap-2 lg:h-20">
        {ready ? (
          <>
            <span className="font-mono text-6xl leading-none font-semibold tracking-tight tabular-nums lg:text-7xl">
              {format(value)}
            </span>
            {suffix && <span className="pb-1 font-mono text-2xl text-muted-foreground tabular-nums">{suffix}</span>}
          </>
        ) : (
          <span className="pb-1 text-2xl font-medium text-muted-foreground">Pending</span>
        )}
      </dd>
      {children && (
        <dd className="flex flex-wrap items-center gap-2 text-base text-muted-foreground">{children}</dd>
      )}
    </div>
  )
}

function Section({
  title,
  note,
  className,
  children,
}: {
  title: string
  note?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-5 rounded-lg border bg-card p-5 lg:p-6", className)}>
      <h2 className="flex flex-wrap items-baseline gap-x-2 text-lg font-semibold">
        {title}
        {note && <span className="text-base font-normal text-muted-foreground">{note}</span>}
      </h2>
      {children}
    </section>
  )
}

function Note({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-5 lg:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  )
}

function LoadingGrid() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Loading results">
      {[4, 1, 5].map((n, i) => (
        <div key={i} className="flex flex-col gap-5 rounded-lg border bg-card p-5 lg:p-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {Array.from({ length: n }, (_, j) => (
              <div key={j} className="flex flex-col gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-16 w-36 lg:h-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ page */

export function Proof() {
  const [state, setState] = React.useState<State>({ status: "loading" })
  const [attempt, setAttempt] = React.useState(0)

  React.useEffect(() => {
    const controller = new AbortController()
    fetch("/results.json", { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`results.json returned ${res.status}`)
        const data: unknown = await res.json()
        if (!isResults(data)) throw new Error("results.json is missing a section")
        setState({ status: "done", results: data })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: "error", detail: err instanceof Error ? err.message : String(err) })
      })
    return () => controller.abort()
  }, [attempt])

  const retry = () => {
    setState({ status: "loading" })
    setAttempt((a) => a + 1)
  }

  return (
    <div className="flex min-h-svh flex-col bg-canvas text-foreground">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2.5 lg:px-6">
          <Wordmark />
          <span className="text-muted-foreground" aria-hidden="true">
            /
          </span>
          <h1 className="text-sm text-muted-foreground">Proof</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
        {state.status === "loading" && <LoadingGrid />}

        {state.status === "error" && (
          <Alert variant="destructive" role="alert">
            <AlertTitle>Results did not load</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span className="font-mono">{state.detail}</span>
              <Button size="sm" variant="outline" onClick={retry}>
                <RotateCcwIcon aria-hidden="true" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {state.status === "done" && <ResultsView r={state.results} />}

        <section className="flex min-w-0 flex-col gap-5 rounded-lg border bg-card p-5 lg:flex-row lg:items-start lg:gap-8 lg:p-6">
          <div className="flex shrink-0 flex-col gap-2">
            <h2 className="text-lg font-semibold">Label check</h2>
            <span className="font-mono text-6xl leading-none font-semibold tracking-tight tabular-nums lg:text-7xl">
              36%
            </span>
            <span className="text-base text-muted-foreground">Gemini agrees</span>
          </div>
          <p className="max-w-3xl text-lg leading-relaxed">
            An independent AI (Gemini) agreed with the dataset&apos;s priority labels on only 36% of 28,587 tickets. On
            tickets mentioning outages, breaches or EMR, the dataset says high 53% of the time and Gemini 75%; on simple
            inquiries, 31% vs 4%. Example: &apos;<span lang="de">Unbefugte Zugriffe auf Krankenhausdaten</span>&apos;
            (unauthorized access to hospital data) is labeled low.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <Note icon={FlaskConicalIcon} title="How we tested">
            <p className="text-lg leading-relaxed">
              40 attacks and 30 normal tickets, written before testing and locked with a SHA-256 hash; plain RAG uses
              the same search and model with no safety layers.
            </p>
          </Note>
          <Note icon={CircleSlashIcon} title="What we don't claim">
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-lg leading-relaxed">
              <li>Not 100%: these are measured rates.</li>
              <li>The dataset&apos;s labels are noisy.</li>
              <li>The 90% recall threshold was tuned on the test split.</li>
              <li>Every reply is a draft; nothing is sent without a human.</li>
            </ul>
          </Note>
        </div>
      </main>
    </div>
  )
}

function ResultsView({ r }: { r: Results }) {
  const attacks = `/ ${r.redteam.attacks_total}`
  const benign = `/ ${r.redteam.benign_total}`
  const blocks = r.redteam.benign_false_blocks
  const missed = r.redteam.missed_escalations?.plain_rag
  return (
    <>
      <Section title="Triage" note="macro-F1">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          <Metric label="Type" value={r.triage.type_macro_f1} format={fixed(3)} />
          <Metric label="Queue" value={r.triage.queue_macro_f1} format={fixed(3)} />
          <Metric label="Priority" value={r.triage.priority_macro_f1} format={fixed(3)} />
          <Metric label="High-priority recall" value={r.triage.high_priority_incident_recall} format={percent} />
        </dl>
      </Section>

      <Section title="Red team" note="lower is better">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-4">
            <h3 className="text-base font-semibold">Attacks through</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
              <Metric label="Ours, strict" value={r.redteam.attacks_through.ours_strict} format={count} suffix={attacks} />
              <Metric
                label="Ours, delivered"
                value={r.redteam.attacks_through.ours_delivered}
                format={count}
                suffix={attacks}
              />
              <Metric label="Plain RAG" value={r.redteam.attacks_through.plain_rag} format={count} suffix={attacks} />
            </dl>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <h3 className="text-base font-semibold">Benign blocked</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
              <Metric label="Ours, frozen run" value={blocks.ours_frozen} format={count} suffix={benign} />
              <Metric label="Ours, round 2" value={blocks.ours_round2} format={count} suffix={benign}>
                <span>Tuned after, on the same set</span>
                {blocks.ours_round2_provisional && <Badge variant="outline">Provisional</Badge>}
              </Metric>
              <Metric label="Plain RAG" value={blocks.plain_rag} format={count} suffix={benign}>
                {typeof missed === "number" && (
                  <span>
                    Missed <span className="font-mono tabular-nums">{missed} / {r.redteam.escalations_total}</span>{" "}
                    escalations
                  </span>
                )}
              </Metric>
            </dl>
          </div>
        </div>
      </Section>

      <div className="grid gap-5 sm:grid-cols-2">
        <Section title="Retrieval">
          <dl>
            <Metric label="Same queue in top 5" value={r.retrieval.same_queue_top5} format={percent} />
          </dl>
        </Section>
        <Section title="Latency">
          <dl className="grid grid-cols-2 gap-x-6">
            <Metric label="Mean per ticket" value={r.latency.mean_seconds_per_ticket} format={seconds} />
            <Metric label="Max" value={r.latency.max_seconds_per_ticket} format={seconds} />
          </dl>
        </Section>
      </div>
    </>
  )
}
