"use client"

import { useRef, useState } from "react"
import {
  BookOpenIcon,
  ChartColumnIcon,
  CheckIcon,
  CircleCheckIcon,
  InboxIcon,
  LanguagesIcon,
  LoaderCircleIcon,
  PencilIcon,
  PhoneCallIcon,
  QuoteIcon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  ShieldHalfIcon,
  SirenIcon,
  TimerIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react"
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"
import { ConfidenceMeter } from "@/components/sentinel/confidence"
import { AISurface, AIMark } from "@/components/sentinel/ai"
import { EscalationStatus, PriorityBadge, TicketId } from "@/components/sentinel/status"
import { volumeByHour } from "@/lib/mock"
import type { PipelineResult, Priority } from "@/lib/types"
import { cn } from "@/lib/utils"

import { CitedText, GroundedDraft, citedIds, splitSentences } from "./cite"
import { TICKETS, type QueueTicket } from "./data"

type Filter = "all" | "escalated" | "auto" | "vpn"
type Outcome = "sent" | "paged" | "escalated"
type Field = "type" | "queue" | "priority"
type FieldState = { value: string; state: "accepted" | "overridden" }
type DetailTab = "brief" | "precedents" | "pipeline"

const NOW = "09:19"
const ON_CALL = "Lena Hoffmann"
const CLUSTER = TICKETS.filter((t) => t.cluster === "vpn")

const FIELD_OPTIONS: Record<Field, string[]> = {
  type: ["Incident", "Request", "Problem", "Change"],
  queue: [
    "Technical Support",
    "IT Support",
    "Billing and Payments",
    "Product Support",
    "Service Outages and Maintenance",
    "Customer Service",
  ],
  priority: ["high", "medium", "low"],
}
const PRIORITY_LABEL: Record<string, string> = { high: "High", medium: "Medium", low: "Low" }

function isEscalated(t: QueueTicket, outcome?: Outcome) {
  return outcome === "escalated" || outcome === "paged" || Boolean(t.result?.escalate)
}

export function CommandCenter() {
  const [selectedId, setSelectedId] = useState("TKT-12044")
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [fields, setFields] = useState<Record<string, Partial<Record<Field, FieldState>>>>({})
  const [tab, setTab] = useState<DetailTab>("brief")
  const [highlight, setHighlight] = useState<string | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  const ticket = TICKETS.find((t) => t.id === selectedId) ?? TICKETS[0]

  const visible = TICKETS.filter((t) => {
    const o = outcomes[t.id]
    if (filter === "escalated" && !isEscalated(t, o)) return false
    if (filter === "auto" && (!t.result || isEscalated(t, o))) return false
    if (filter === "vpn" && t.cluster !== "vpn") return false
    if (query && !`${t.id} ${t.subject} ${t.customer}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  function select(id: string, opts?: { scroll?: boolean }) {
    const t = TICKETS.find((x) => x.id === id)
    setSelectedId(id)
    setTab(t?.result?.escalate ? "brief" : "precedents")
    setHighlight(null)
    if (opts?.scroll && window.matchMedia("(max-width: 1023px)").matches) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  function openCitation(id: string) {
    setTab("precedents")
    setHighlight(id)
    requestAnimationFrame(() =>
      document.getElementById(`prec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    )
  }

  function setOutcome(id: string, o: Outcome) {
    setOutcomes((prev) => ({ ...prev, [id]: o }))
  }

  return (
    <div className="flex min-h-svh lg:h-svh lg:overflow-hidden">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar query={query} onQuery={setQuery} />
        <OutageBanner
          onShow={() => setFilter("vpn")}
          onOpen={() => select("TKT-12044", { scroll: true })}
          active={filter === "vpn"}
        />
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]">
          <Queue
            tickets={visible}
            outcomes={outcomes}
            selectedId={selectedId}
            onSelect={(id) => select(id, { scroll: true })}
            filter={filter}
            onFilter={setFilter}
          />
          <div
            ref={detailRef}
            className="flex min-h-0 min-w-0 scroll-mt-14 flex-col border-t lg:overflow-y-auto lg:border-t-0 lg:border-l xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:overflow-hidden"
          >
            <TicketDetail
              key={ticket.id}
              ticket={ticket}
              outcome={outcomes[ticket.id]}
              fields={fields[ticket.id] ?? {}}
              onField={(f, v) => setFields((prev) => ({ ...prev, [ticket.id]: { ...prev[ticket.id], [f]: v } }))}
              tab={tab}
              onTab={setTab}
              highlight={highlight}
              onCite={openCitation}
            />
            <DraftPanel
              key={`draft-${ticket.id}`}
              ticket={ticket}
              outcome={outcomes[ticket.id]}
              draft={drafts[ticket.id] ?? ticket.result?.draft.reply ?? ""}
              edited={drafts[ticket.id] !== undefined}
              onDraft={(text) => setDrafts((prev) => ({ ...prev, [ticket.id]: text }))}
              onOutcome={(o) => setOutcome(ticket.id, o)}
              onCite={openCitation}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ shell */

const NAV = [
  { label: "Triage queue", Icon: InboxIcon, active: true },
  { label: "Incidents", Icon: SirenIcon },
  { label: "Analytics", Icon: ChartColumnIcon },
  { label: "Knowledge base", Icon: BookOpenIcon },
  { label: "On-call schedule", Icon: UsersIcon },
]

function NavRail() {
  return (
    <nav
      aria-label="Main"
      className="sticky top-0 hidden h-svh w-14 shrink-0 flex-col items-center gap-1 border-r bg-background py-3 lg:flex"
    >
      <div className="mb-3 grid size-8 place-items-center rounded-md bg-foreground text-background" aria-hidden="true">
        <ShieldHalfIcon className="size-4.5" />
      </div>
      {NAV.map(({ label, Icon, active }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <a
              href="#"
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={(e) => e.preventDefault()}
              className={cn(
                "grid size-9 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
                active && "bg-info-tint text-info-fg hover:bg-info-tint hover:text-info-fg"
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}
      <div className="mt-auto flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="#"
              aria-label="Settings"
              onClick={(e) => e.preventDefault()}
              className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <SettingsIcon className="size-4.5" aria-hidden="true" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
        <span
          className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold"
          aria-label="Signed in as Mara Okafor"
          role="img"
        >
          MO
        </span>
      </div>
    </nav>
  )
}

function TopBar({ query, onQuery }: { query: string; onQuery: (q: string) => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 lg:static">
      <div className="grid size-7 place-items-center rounded-md bg-foreground text-background lg:hidden" aria-hidden="true">
        <ShieldHalfIcon className="size-4" />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight">Triage queue</h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">Morning shift · SentinelDesk</p>
      </div>
      <div className="relative ml-auto hidden w-64 md:block">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search tickets, customers"
          aria-label="Search tickets"
          className="h-8 pl-8"
        />
      </div>
      <div className="hidden items-center gap-2 rounded-md border px-2.5 py-1 xl:flex">
        <span className="size-2 rounded-full bg-success" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">On call</span>
        <span className="text-xs font-medium">{ON_CALL} · Network</span>
      </div>
      <div className="ml-auto md:ml-0">
        <ThemeToggle />
      </div>
    </header>
  )
}

function OutageBanner({ onShow, onOpen, active }: { onShow: () => void; onOpen: () => void; active: boolean }) {
  return (
    <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-critical-tint px-4 py-2.5 text-critical-fg">
      <div className="flex min-w-0 basis-full items-start gap-3 md:grow md:basis-0 md:items-center">
        <SirenIcon className="mt-0.5 size-4 shrink-0 md:mt-0" aria-hidden="true" />
        <p className="min-w-0 text-sm">
          <span className="font-semibold">Major outage suspected: VPN gateway.</span>{" "}
          <span>
            {CLUSTER.length} tickets in 27 min describe remote clinics losing VPN and EMR access. Closest precedent{" "}
            <span className="font-mono text-[0.8125rem]">TKT-04187</span> (expired gateway certificate).
          </span>
        </p>
      </div>
      <div className="ml-7 flex gap-2 md:ml-0">
        <Button size="sm" variant="outline" onClick={onShow} aria-pressed={active} className="border-critical/40 bg-transparent text-critical-fg hover:bg-critical/10 hover:text-critical-fg dark:bg-transparent">
          Show {CLUSTER.length} tickets
        </Button>
        <Button size="sm" onClick={onOpen} className="bg-critical-fg text-background hover:bg-critical-fg/90">
          Open incident
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ queue */

const volumeConfig = {
  high: { label: "High", color: "var(--critical)" },
  medium: { label: "Medium", color: "var(--warning)" },
  low: { label: "Low", color: "var(--success)" },
} satisfies ChartConfig

function Queue({
  tickets,
  outcomes,
  selectedId,
  onSelect,
  filter,
  onFilter,
}: {
  tickets: QueueTicket[]
  outcomes: Record<string, Outcome>
  selectedId: string
  onSelect: (id: string) => void
  filter: Filter
  onFilter: (f: Filter) => void
}) {
  const listRef = useRef<HTMLUListElement>(null)
  const counts = {
    all: TICKETS.length,
    escalated: TICKETS.filter((t) => isEscalated(t, outcomes[t.id])).length,
    auto: TICKETS.filter((t) => t.result && !isEscalated(t, outcomes[t.id])).length,
    vpn: CLUSTER.length,
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const keys = ["ArrowDown", "ArrowUp", "j", "k"]
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const i = tickets.findIndex((t) => t.id === selectedId)
    const next = e.key === "ArrowDown" || e.key === "j" ? Math.min(tickets.length - 1, i + 1) : Math.max(0, i - 1)
    const id = tickets[next]?.id
    if (!id) return
    onSelect(id)
    listRef.current?.querySelector<HTMLButtonElement>(`[data-id="${id}"]`)?.focus()
  }

  return (
    <section aria-label="Ticket queue" className="flex min-h-0 flex-col bg-background">
      <div className="flex flex-col gap-3 border-b p-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-sm font-semibold">Inbound today</h2>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">214</span> tickets · burst 08:00 to 10:00
          </p>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
            {(["high", "medium", "low"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1">
                <span className="size-2 rounded-[2px]" style={{ background: volumeConfig[k].color }} />
                {volumeConfig[k].label}
              </span>
            ))}
          </div>
        </div>
        <ChartContainer config={volumeConfig} className="aspect-auto h-14 w-full" aria-label="Hourly ticket volume by priority">
          <BarChart data={volumeByHour} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={1}>
            <XAxis dataKey="hour" hide />
            <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
            <Bar dataKey="high" stackId="v" fill="var(--color-high)" />
            <Bar dataKey="medium" stackId="v" fill="var(--color-medium)" />
            <Bar dataKey="low" stackId="v" fill="var(--color-low)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartContainer>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={filter}
          onValueChange={(v) => v && onFilter(v as Filter)}
          aria-label="Filter queue"
          className="w-full"
        >
          {(
            [
              ["all", "All"],
              ["escalated", "Escalated"],
              ["auto", "Auto-draft"],
              ["vpn", "VPN outage"],
            ] as const
          ).map(([v, label]) => (
            <ToggleGroupItem key={v} value={v} className="flex-1 gap-1 px-2 text-xs data-[state=on]:bg-info-tint data-[state=on]:text-info-fg">
              {label}
              <span className="font-mono text-[0.6875rem] opacity-80">{counts[v]}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {tickets.length === 0 ? (
        <Empty className="flex-1 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No tickets match</EmptyTitle>
            <EmptyDescription>Clear the search or switch the filter to All.</EmptyDescription>
          </EmptyHeader>
          <Button size="sm" variant="outline" onClick={() => onFilter("all")}>
            Show all tickets
          </Button>
        </Empty>
      ) : (
        <ul ref={listRef} onKeyDown={onKeyDown} className="min-h-0 flex-1 divide-y lg:overflow-y-auto" aria-label="Tickets, newest first">
          {tickets.map((t) => (
            <QueueRow key={t.id} ticket={t} outcome={outcomes[t.id]} selected={t.id === selectedId} onSelect={onSelect} />
          ))}
        </ul>
      )}
      <p className="hidden border-t px-4 py-2 text-xs text-muted-foreground lg:block">
        <kbd className="font-mono">J</kbd> / <kbd className="font-mono">K</kbd> to move through the queue
      </p>
    </section>
  )
}

function RowStatus({ ticket, outcome }: { ticket: QueueTicket; outcome?: Outcome }) {
  if (!ticket.result)
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <LoaderCircleIcon className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Triaging
      </span>
    )
  if (outcome === "sent")
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <SendIcon className="size-3.5" aria-hidden="true" />
        Sent
      </span>
    )
  if (outcome === "paged")
    return (
      <span className="flex items-center gap-1 text-critical-fg">
        <PhoneCallIcon className="size-3.5" aria-hidden="true" />
        Paged
      </span>
    )
  if (isEscalated(ticket, outcome))
    return (
      <span className="flex items-center gap-1 font-medium text-critical-fg">
        <SirenIcon className="size-3.5" aria-hidden="true" />
        Escalate
      </span>
    )
  return (
    <span className="flex items-center gap-1 text-success-fg">
      <CircleCheckIcon className="size-3.5" aria-hidden="true" />
      Auto-draft
    </span>
  )
}

function QueueRow({
  ticket: t,
  outcome,
  selected,
  onSelect,
}: {
  ticket: QueueTicket
  outcome?: Outcome
  selected: boolean
  onSelect: (id: string) => void
}) {
  const triage = t.result?.triage
  return (
    <li>
      <button
        type="button"
        data-id={t.id}
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(t.id)}
        className={cn(
          "flex w-full flex-col gap-1.5 px-4 py-2.5 text-left transition-colors duration-150 outline-none hover:bg-muted focus-visible:bg-muted focus-visible:shadow-[inset_0_0_0_2px_var(--ring)]",
          selected && "bg-info-tint shadow-[inset_3px_0_0_var(--primary)] hover:bg-info-tint"
        )}
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className={cn("min-w-0 flex-1 truncate text-sm", selected ? "font-semibold" : "font-medium")}>{t.subject}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{t.age}</span>
        </span>
        <span className="flex min-w-0 items-center gap-2 text-xs">
          {triage ? <PriorityBadge priority={triage.priority} /> : <Skeleton className="h-5 w-14" />}
          <TicketId id={t.id} className="shrink-0 text-xs text-muted-foreground" />
          <span className="min-w-0 truncate text-muted-foreground">
            {triage ? `${triage.queue} · ${triage.language.toUpperCase()}` : t.customer}
          </span>
          <span className="ml-auto shrink-0">
            <RowStatus ticket={t} outcome={outcome} />
          </span>
        </span>
      </button>
    </li>
  )
}

/* ------------------------------------------------------------------ detail */

function StatusPill({ ticket, outcome }: { ticket: QueueTicket; outcome?: Outcome }) {
  if (!ticket.result) return <Badge variant="outline">Triaging</Badge>
  if (outcome === "sent")
    return (
      <Badge variant="success">
        <SendIcon data-icon="inline-start" aria-hidden="true" />
        Reply sent
      </Badge>
    )
  if (outcome === "paged")
    return (
      <Badge variant="critical">
        <PhoneCallIcon data-icon="inline-start" aria-hidden="true" />
        On-call paged
      </Badge>
    )
  if (isEscalated(ticket, outcome))
    return (
      <Badge variant="critical">
        <SirenIcon data-icon="inline-start" aria-hidden="true" />
        Escalate
      </Badge>
    )
  return (
    <Badge variant="success">
      <CircleCheckIcon data-icon="inline-start" aria-hidden="true" />
      Auto-draft ready
    </Badge>
  )
}

function TicketDetail({
  ticket,
  outcome,
  fields,
  onField,
  tab,
  onTab,
  highlight,
  onCite,
}: {
  ticket: QueueTicket
  outcome?: Outcome
  fields: Partial<Record<Field, FieldState>>
  onField: (f: Field, v: FieldState) => void
  tab: DetailTab
  onTab: (t: DetailTab) => void
  highlight: string | null
  onCite: (id: string) => void
}) {
  const r = ticket.result
  const lang = r?.triage.language ?? "de"
  return (
    <section aria-label={`Ticket ${ticket.id}`} className="flex min-w-0 flex-col bg-background xl:overflow-y-auto">
      <div className="flex flex-col gap-4 p-4 lg:p-5">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <TicketId id={ticket.id} className="text-muted-foreground" />
            <StatusPill ticket={ticket} outcome={outcome} />
            {ticket.cluster ? (
              <Badge variant="outline" className="gap-1">
                <UsersIcon data-icon="inline-start" aria-hidden="true" />
                Outage cluster · {CLUSTER.length} tickets
              </Badge>
            ) : null}
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-balance">{ticket.subject}</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[0.8125rem] sm:grid-cols-4">
            {[
              ["Customer", ticket.customer],
              ["Channel", ticket.channel],
              ["Received", `${ticket.received} · ${ticket.age === "now" ? "just now" : `${ticket.age} ago`}`],
              ["Language", lang === "de" ? "German" : "English"],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="font-medium break-words">{v}</dd>
              </div>
            ))}
          </dl>
        </header>

        {r ? <EscalationStatus escalate={isEscalated(ticket, outcome)} reasons={outcome === "escalated" ? ["Escalated manually by operator"] : r.reasons} /> : null}

        <figure className="rounded-lg border bg-canvas p-3">
          <figcaption className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <QuoteIcon className="size-3.5" aria-hidden="true" />
            Customer message
          </figcaption>
          <blockquote lang={lang} className="text-sm leading-relaxed">
            {ticket.body}
          </blockquote>
        </figure>

        {r ? <TriageCard result={r} fields={fields} onField={onField} /> : <TriageSkeleton />}

        {r ? (
          <Tabs value={tab} onValueChange={(v) => onTab(v as DetailTab)} className="gap-3">
            <TabsList variant="line" className="w-full justify-start border-b pb-1">
              <TabsTrigger value="brief" className="flex-none px-2">
                Incident brief
              </TabsTrigger>
              <TabsTrigger value="precedents" className="flex-none px-2">
                Precedents
                <span className="font-mono text-xs text-muted-foreground">{r.precedents.length}</span>
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="flex-none px-2">
                Pipeline
                <span className="font-mono text-xs text-muted-foreground">{(r.timings_ms.total_ms / 1000).toFixed(2)}s</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="brief">
              <BriefPanel ticket={ticket} onCite={onCite} />
            </TabsContent>
            <TabsContent value="precedents">
              <PrecedentList result={r} highlight={highlight} />
            </TabsContent>
            <TabsContent value="pipeline">
              <PipelinePanel result={r} />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </section>
  )
}

function TriageSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4" aria-busy="true" aria-label="Triage running">
      <div className="flex items-center gap-2 text-sm font-semibold">
        Triage
        <span className="text-xs font-normal text-muted-foreground">Classifier running · 0.4 s</span>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid grid-cols-[72px_1fr_120px] items-center gap-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  )
}

function TriageCard({
  result,
  fields,
  onField,
}: {
  result: PipelineResult
  fields: Partial<Record<Field, FieldState>>
  onField: (f: Field, v: FieldState) => void
}) {
  const t = result.triage
  const rows: { field: Field; label: string; value: string; conf: number }[] = [
    { field: "type", label: "Type", value: t.type, conf: t.type_conf },
    { field: "queue", label: "Queue", value: t.queue, conf: t.queue_conf },
    { field: "priority", label: "Priority", value: t.priority, conf: t.priority_conf },
  ]
  const pending = rows.filter((row) => !fields[row.field])
  return (
    <section aria-labelledby="triage-h" className="rounded-lg border">
      <header className="flex items-center gap-2 border-b px-4 py-2.5">
        <h3 id="triage-h" className="text-sm font-semibold">
          Triage
        </h3>
        <span className="text-xs text-muted-foreground">
          {pending.length ? `${pending.length} suggested` : "All applied"}
        </span>
        <Button
          size="xs"
          variant="outline"
          className="ml-auto"
          disabled={!pending.length}
          onClick={() => pending.forEach((row) => onField(row.field, { value: row.value, state: "accepted" }))}
        >
          <CheckIcon data-icon="inline-start" aria-hidden="true" />
          Accept all
        </Button>
      </header>
      <div className="divide-y">
        {rows.map((row) => {
          const applied = fields[row.field]
          const value = applied?.value ?? row.value
          return (
            <div
              key={row.field}
              className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2 sm:grid-cols-[72px_minmax(0,1fr)_auto_auto]"
            >
              <span className="text-[0.8125rem] text-muted-foreground">{row.label}</span>
              <div className="min-w-0">
                <Select value={value} onValueChange={(v) => onField(row.field, { value: v, state: v === row.value ? "accepted" : "overridden" })}>
                  <SelectTrigger
                    size="sm"
                    aria-label={`${row.label}: ${applied ? "applied" : "suggested"} ${value}`}
                    className={cn(
                      "max-w-full min-w-0 text-[0.8125rem] font-medium",
                      applied ? "border-solid bg-background" : "border-dashed border-muted-foreground/50 bg-transparent"
                    )}
                  >
                    {row.field === "priority" ? (
                      <PriorityBadge priority={value as Priority} className="h-4" />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent className="dir-a font-sans">
                    {FIELD_OPTIONS[row.field].map((o) => (
                      <SelectItem key={o} value={o}>
                        {row.field === "priority" ? PRIORITY_LABEL[o] : o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 col-start-2 row-start-2 sm:col-span-1 sm:col-start-auto sm:row-start-auto">
                {applied?.state === "overridden" ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <PencilIcon className="size-3" aria-hidden="true" />
                    Overridden · model said {row.field === "priority" ? PRIORITY_LABEL[row.value] : row.value}
                  </span>
                ) : (
                  <ConfidenceMeter value={row.conf} label={row.label} />
                )}
              </div>
              <div className="col-start-3 row-start-1 text-right sm:col-start-auto sm:row-start-auto sm:w-20">
                {applied ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success-fg">
                    <CheckIcon className="size-3.5" aria-hidden="true" />
                    Applied
                  </span>
                ) : (
                  <Button size="xs" variant="ghost" onClick={() => onField(row.field, { value: row.value, state: "accepted" })}>
                    Accept
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function BriefPanel({ ticket, onCite }: { ticket: QueueTicket; onCite: (id: string) => void }) {
  const r = ticket.result
  if (!r?.escalate || !ticket.brief) {
    return (
      <Empty className="rounded-lg border py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SirenIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No incident brief</EmptyTitle>
          <EmptyDescription>
            {r?.escalate
              ? "This ticket was escalated for low confidence, not an outage. Review the precedents instead."
              : "Briefs are written only for escalated incidents. This ticket can be answered from the draft."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  const b = ticket.brief
  return (
    <AISurface
      title="Incident brief"
      action={
        <span className="text-xs text-muted-foreground">For {ON_CALL}</span>
      }
    >
      <div className="flex flex-col gap-3 text-sm leading-relaxed">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground">Summary</h4>
          <p>{b.summary}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground">Likely cause and past fix</h4>
          <p>
            <CitedText text={b.cause} precedents={r.precedents} onOpen={onCite} />
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground">First steps</h4>
          <ol className="mt-1 flex flex-col gap-1.5">
            {b.steps.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[0.6875rem] text-muted-foreground">
                  {i + 1}
                </span>
                <span>
                  <CitedText text={s} precedents={r.precedents} onOpen={onCite} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </AISurface>
  )
}

function PrecedentList({ result, highlight }: { result: PipelineResult; highlight: string | null }) {
  const used = new Set(citedIds(result.draft.reply))
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        {result.precedents.length} similar past tickets found · {used.size} cited in the draft
      </p>
      <ul className="flex flex-col divide-y rounded-lg border">
        {result.precedents.map((p) => (
          <li
            key={p.ticket_id}
            id={`prec-${p.ticket_id}`}
            className={cn(
              "flex flex-col gap-1.5 p-3 transition-colors duration-200",
              highlight === p.ticket_id && "bg-info-tint"
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <TicketId id={p.ticket_id} className="font-medium" />
              {used.has(p.ticket_id) ? (
                <Badge variant="info">
                  <QuoteIcon data-icon="inline-start" aria-hidden="true" />
                  Cited
                </Badge>
              ) : (
                <Badge variant="outline">Found</Badge>
              )}
              {p.language ? <Badge variant="outline" className="font-mono">{p.language.toUpperCase()}</Badge> : null}
              <span className="ml-auto flex items-center gap-2">
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <span className="block h-full rounded-full bg-info" style={{ width: `${p.similarity * 100}%` }} />
                </span>
                <span className="w-16 text-right font-mono text-xs">{Math.round(p.similarity * 100)}% sim.</span>
              </span>
            </div>
            <p className="text-sm font-medium" lang={p.language || undefined}>
              {p.subject}
            </p>
            <p className="border-l-2 border-success pl-2 text-[0.8125rem] leading-relaxed text-muted-foreground" lang={p.language || undefined}>
              {p.answer_snippet}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

const STAGES = [
  { key: "triage", label: "Triage", ms: "triage_ms", color: "var(--chart-1)" },
  { key: "retrieve", label: "Retrieval", ms: "retrieval_ms", color: "var(--chart-2)" },
  { key: "gate", label: "Gate", ms: "gate_ms", color: "var(--chart-5)" },
  { key: "draft", label: "Gemini draft", ms: "draft_ms", color: "var(--chart-3)" },
] as const

const latencyConfig = { ms: { label: "Duration" } } satisfies ChartConfig

function PipelinePanel({ result }: { result: PipelineResult }) {
  const data = STAGES.map((s, i) => ({
    stage: s.label,
    offset: STAGES.slice(0, i).reduce((sum, p) => sum + result.timings_ms[p.ms], 0),
    ms: result.timings_ms[s.ms],
    color: s.color,
  }))
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-baseline gap-2">
        <TimerIcon className="size-4 self-center text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-semibold">End to end</h3>
        <span className="font-mono text-sm">{result.timings_ms.total_ms.toLocaleString("en-US")} ms</span>
        <span className="ml-auto text-xs text-muted-foreground">Waterfall, per stage</span>
      </div>
      <ChartContainer config={latencyConfig} className="aspect-auto h-36 w-full" aria-label="Latency per pipeline stage">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, bottom: 0, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide domain={[0, result.timings_ms.total_ms]} />
          <YAxis type="category" dataKey="stage" width={92} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <Bar dataKey="offset" stackId="w" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="ms" stackId="w" radius={2} minPointSize={2} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.stage} fill={d.color} />
            ))}
            <LabelList dataKey="ms" position="right" className="fill-foreground font-mono" fontSize={11} formatter={(v) => `${v} ms`} />
          </Bar>
        </BarChart>
      </ChartContainer>
      <ul className="flex flex-wrap gap-2 text-xs">
        {STAGES.map((s) => {
          const src = result.sources[s.key]
          return (
            <li key={s.key} className="flex items-center gap-1.5 rounded-md border px-2 py-1">
              <span className="size-2 rounded-[2px]" style={{ background: s.color }} aria-hidden="true" />
              {s.label}
              {src === "real" ? (
                <span className="text-muted-foreground">Live</span>
              ) : (
                <Badge variant="outline" className="h-4 px-1.5 text-[0.6875rem]">
                  Mock
                </Badge>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ AI panel */

function DraftPanel({
  ticket,
  outcome,
  draft,
  edited,
  onDraft,
  onOutcome,
  onCite,
}: {
  ticket: QueueTicket
  outcome?: Outcome
  draft: string
  edited: boolean
  onDraft: (text: string) => void
  onOutcome: (o: Outcome) => void
  onCite: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(draft)
  const [english, setEnglish] = useState(false)
  const [generating, setGenerating] = useState(false)
  const r = ticket.result
  const loading = !r || generating

  const sentences = splitSentences(draft)
  const unsupported = sentences.filter((s) => s.unsupported)
  const ids = [...new Set(citedIds(draft))]
  const invalid = r ? ids.filter((id) => !r.precedents.some((p) => p.ticket_id === id)) : []
  const showTranslation = english && ticket.translation && !edited
  const escalated = isEscalated(ticket, outcome)
  const done = outcome === "sent" || outcome === "paged"

  function regenerate() {
    setGenerating(true)
    setEnglish(false)
    window.setTimeout(() => setGenerating(false), 1400)
  }

  function send() {
    onOutcome("sent")
    toast.success(`Reply sent to ${ticket.customer}`, { description: `${ticket.id} · ${NOW}` })
  }

  function page() {
    onOutcome("paged")
    toast(`Paged ${ON_CALL}`, { description: `${ticket.id} · Network on-call · brief attached` })
  }

  return (
    <aside
      aria-label="Gemini draft reply"
      className="flex min-w-0 flex-col border-t bg-canvas xl:min-h-0 xl:border-t-0 xl:border-l"
    >
      <header className="flex items-center gap-2 border-b bg-background px-4 py-3">
        <AIMark />
        <h2 className="text-sm font-semibold">Draft reply</h2>
        {r ? (
          <Badge variant="outline" className="font-mono">
            {r.triage.language.toUpperCase()}
          </Badge>
        ) : null}
        {r && r.sources.draft !== "real" ? <Badge variant="outline">Mock</Badge> : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              className="ml-auto"
              aria-label="Regenerate draft"
              onClick={regenerate}
              disabled={loading || done || editing}
            >
              <RefreshCwIcon aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Regenerate</TooltipContent>
        </Tooltip>
      </header>

      <div className="flex flex-col gap-3 p-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        {ticket.translation && r && !edited && !loading ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <LanguagesIcon className="size-3.5" aria-hidden="true" />
            Show in English for review
            <Switch checked={english} onCheckedChange={setEnglish} size="sm" className="ml-auto" />
          </label>
        ) : null}

        <section
          data-generating={loading}
          aria-busy={loading}
          className="ai-surface rounded-lg p-4"
        >
          {loading ? (
            <div className="flex flex-col gap-2.5" aria-label="Gemini is writing the draft">
              <Skeleton className="h-3.5 w-11/12" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-10/12" />
              <Skeleton className="h-3.5 w-2/5" />
              <p className="mt-1 text-xs text-muted-foreground">
                {r ? "Regenerating from the same precedents" : "Waiting for triage and retrieval"}
              </p>
            </div>
          ) : editing ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="draft-edit" className="text-xs font-medium text-muted-foreground">
                Edit reply. Keep the [TKT-…] markers on sentences that rely on a past ticket.
              </label>
              <Textarea
                id="draft-edit"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-48 bg-background text-sm leading-relaxed"
                lang={r?.triage.language}
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setText(draft); setEditing(false) }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => { onDraft(text); setEditing(false) }}>
                  Save draft
                </Button>
              </div>
            </div>
          ) : (
            <div lang={showTranslation ? "en" : r?.triage.language}>
              {showTranslation ? (
                <p className="text-sm leading-7">
                  <CitedText text={ticket.translation!} precedents={r!.precedents} onOpen={onCite} />
                </p>
              ) : (
                <GroundedDraft text={draft} precedents={r!.precedents} onOpen={onCite} />
              )}
            </div>
          )}
        </section>

        {r && !loading ? (
          <div className="flex flex-col gap-2">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Grounding check">
              <li className="flex items-center gap-1 text-success-fg">
                <CircleCheckIcon className="size-3.5" aria-hidden="true" />
                {sentences.filter((s) => s.cited).length} of {sentences.filter((s) => !s.courtesy).length} claims cited
              </li>
              {unsupported.length ? (
                <li className="flex items-center gap-1 font-medium text-warning-fg">
                  <TriangleAlertIcon className="size-3.5" aria-hidden="true" />
                  {unsupported.length} unsupported claim{unsupported.length > 1 ? "s" : ""}
                </li>
              ) : null}
              {invalid.length ? (
                <li className="flex items-center gap-1 font-medium text-critical-fg">
                  <TriangleAlertIcon className="size-3.5" aria-hidden="true" />
                  {invalid.length} invalid citation{invalid.length > 1 ? "s" : ""}
                </li>
              ) : null}
            </ul>

            {unsupported.length && !done && !editing ? (
              <div role="status" className="flex flex-col gap-2 rounded-lg border border-warning/50 bg-warning-tint p-3 text-warning-fg">
                <p className="text-[0.8125rem] leading-relaxed">
                  <span className="font-semibold">No past ticket supports this sentence:</span>{" "}
                  <span lang={r.triage.language}>&ldquo;{unsupported[0].text}&rdquo;</span>
                </p>
                <Button
                  size="xs"
                  variant="outline"
                  className="self-start border-warning/60 bg-transparent text-warning-fg hover:bg-warning/15 hover:text-warning-fg dark:bg-transparent"
                  onClick={() => {
                    const next = draft.replace(unsupported[0].text, "").replace(/\s{2,}/g, " ").trim()
                    onDraft(next)
                    setText(next)
                    setEnglish(false)
                  }}
                >
                  Remove sentence
                </Button>
              </div>
            ) : null}

            <section aria-labelledby="sources-h" className="mt-2 flex flex-col gap-1.5">
              <h3 id="sources-h" className="text-xs font-semibold text-muted-foreground">
                Sources used · {ids.length - invalid.length} of {r.precedents.length} found
              </h3>
              <ul className="flex flex-col divide-y rounded-lg border bg-background">
                {r.precedents
                  .filter((p) => ids.includes(p.ticket_id))
                  .map((p) => (
                    <li key={p.ticket_id}>
                      <button
                        type="button"
                        onClick={() => onCite(p.ticket_id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <TicketId id={p.ticket_id} className="shrink-0 text-xs text-info-fg" />
                        <span className="min-w-0 flex-1 truncate text-[0.8125rem]" lang={p.language || undefined}>
                          {p.subject}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {Math.round(p.similarity * 100)}%
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          </div>
        ) : null}
      </div>

      <footer className="sticky bottom-0 flex flex-col gap-2 border-t bg-background p-4">
        {done ? (
          <p role="status" className="flex items-center gap-2 text-sm font-medium">
            {outcome === "sent" ? (
              <>
                <SendIcon className="size-4 text-success-fg" aria-hidden="true" />
                Sent to {ticket.customer} at {NOW}
              </>
            ) : (
              <>
                <PhoneCallIcon className="size-4 text-critical-fg" aria-hidden="true" />
                {ON_CALL} paged at {NOW}, brief attached
              </>
            )}
          </p>
        ) : escalated ? (
          <div className="flex flex-wrap gap-2">
            <Button className="flex-1 bg-critical-fg text-background hover:bg-critical-fg/90" onClick={page} disabled={!r}>
              <PhoneCallIcon data-icon="inline-start" aria-hidden="true" />
              Page on-call
            </Button>
            <Button variant="outline" onClick={send} disabled={loading || editing}>
              Send holding reply
            </Button>
            <Button variant="ghost" size="icon" aria-label="Edit draft" onClick={() => setEditing(true)} disabled={loading || editing}>
              <PencilIcon aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button className="flex-1" onClick={send} disabled={loading || editing}>
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Approve and send
            </Button>
            <Button variant="outline" onClick={() => setEditing(true)} disabled={loading || editing}>
              <PencilIcon data-icon="inline-start" aria-hidden="true" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => onOutcome("escalated")}
              disabled={loading}
              className="text-critical-fg hover:text-critical-fg"
            >
              <SirenIcon data-icon="inline-start" aria-hidden="true" />
              Escalate
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">AI generated. Check each citation before sending.</p>
      </footer>
    </aside>
  )
}
