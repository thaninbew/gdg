"use client"

import * as React from "react"
import Link from "next/link"
import { Bar, BarChart } from "recharts"
import { toast } from "sonner"
import {
  ChevronLeftIcon,
  CircleCheckIcon,
  InboxIcon,
  RadarIcon,
  SearchIcon,
  SirenIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Kbd } from "@/components/ui/kbd"
import { ThemeToggle } from "@/components/theme-toggle"
import { confidenceBand } from "@/components/sentinel/confidence"
import { cn } from "@/lib/utils"
import type { Priority } from "@/lib/types"

import { INBOUND_24H, OUTAGE, TICKETS, type Field, type Group, type InboxTicket, type TicketState } from "./data"
import { PriorityIcon, TicketDetail, type DetailTab } from "./detail"

const GROUPS: { key: Group; label: string; Icon: typeof InboxIcon; tone: string }[] = [
  { key: "triage", label: "Needs triage", Icon: InboxIcon, tone: "text-muted-foreground" },
  { key: "escalated", label: "Escalated", Icon: SirenIcon, tone: "text-critical-fg" },
  { key: "drafted", label: "Auto-drafted", Icon: CircleCheckIcon, tone: "text-success-fg" },
]
const FIELDS: Field[] = ["type", "queue", "priority"]

function initialState(t: InboxTicket): TicketState {
  const status = t.group === "triage" ? "suggested" : "accepted"
  const tr = t.result.triage
  return {
    group: t.group,
    byHand: false,
    fields: {
      type: { value: tr.type, status },
      queue: { value: tr.queue, status },
      priority: { value: tr.priority, status },
    },
  }
}

// Once every field is set, the ticket leaves triage for the group its gate decided.
function settle(t: InboxTicket, s: TicketState): TicketState {
  if (s.group !== "triage" || FIELDS.some((f) => s.fields[f].status === "suggested")) return s
  return { ...s, group: t.result.escalate ? "escalated" : "drafted" }
}

const GROUP_LABEL: Record<Group, string> = { triage: "Needs triage", escalated: "Escalated", drafted: "Auto-drafted" }

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return !!el.closest('input, textarea, select, [contenteditable="true"], [role="listbox"], [role="menu"], [role="dialog"]')
}

export function TriageInbox() {
  const [states, setStates] = React.useState<Record<string, TicketState>>(() =>
    Object.fromEntries(TICKETS.map((t) => [t.id, initialState(t)]))
  )
  const [selectedId, setSelectedId] = React.useState(TICKETS[0].id)
  const [clusterOnly, setClusterOnly] = React.useState(false)
  const [tabFor, setTabFor] = React.useState<{ id: string; tab: DetailTab } | null>(null)
  const sendRef = React.useRef<HTMLButtonElement>(null)
  const rowRefs = React.useRef(new Map<string, HTMLButtonElement>())

  const visible = React.useMemo(
    () => TICKETS.filter((t) => !clusterOnly || t.cluster === OUTAGE.cluster),
    [clusterOnly]
  )
  const ordered = React.useMemo(
    () =>
      GROUPS.flatMap((g) =>
        visible.filter((t) => states[t.id].group === g.key).sort((a, b) => a.receivedMin - b.receivedMin)
      ),
    [visible, states]
  )
  const selected = TICKETS.find((t) => t.id === selectedId) ?? TICKETS[0]
  const selState = states[selected.id]
  const defaultTab: DetailTab = selected.brief && selected.result.escalate ? "brief" : "reply"
  const tab = tabFor?.id === selected.id ? tabFor.tab : defaultTab
  const clusterCount = TICKETS.filter((t) => t.cluster === OUTAGE.cluster).length

  const update = (t: InboxTicket, next: TicketState, message?: string) => {
    const prev = states[t.id]
    setStates((all) => ({ ...all, [t.id]: next }))
    if (message) {
      toast(message, {
        action: { label: "Undo", onClick: () => setStates((all) => ({ ...all, [t.id]: prev })) },
      })
    }
  }

  const move = React.useCallback(
    (delta: number) => {
      if (!ordered.length) return
      const i = ordered.findIndex((t) => t.id === selectedId)
      const next = ordered[Math.min(ordered.length - 1, Math.max(0, (i < 0 ? 0 : i) + delta))]
      setSelectedId(next.id)
      rowRefs.current.get(next.id)?.scrollIntoView({ block: "nearest" })
    },
    [ordered, selectedId]
  )

  // Next ticket still in triage after this one, so A keeps the operator moving.
  const nextInTriage = (afterId: string) => {
    const triage = ordered.filter((t) => states[t.id].group === "triage")
    const i = triage.findIndex((t) => t.id === afterId)
    return (triage[i + 1] ?? triage[i - 1])?.id
  }

  const acceptField = (t: InboxTicket, f: Field) => {
    const s = states[t.id]
    const next = settle(t, { ...s, fields: { ...s.fields, [f]: { ...s.fields[f], status: "accepted" } } })
    update(t, next, next.group !== s.group ? `${t.id} moved to ${GROUP_LABEL[next.group]}` : undefined)
  }

  const changeField = (t: InboxTicket, f: Field, value: string) => {
    const s = states[t.id]
    const suggested = f === "type" ? t.result.triage.type : f === "queue" ? t.result.triage.queue : t.result.triage.priority
    const next = settle(t, {
      ...s,
      fields: { ...s.fields, [f]: { value, status: value === suggested ? "accepted" : "changed" } },
    })
    update(t, next, next.group !== s.group ? `${t.id} moved to ${GROUP_LABEL[next.group]}` : undefined)
  }

  const acceptAll = (t: InboxTicket) => {
    const s = states[t.id]
    if (s.group !== "triage") return
    const fields = { ...s.fields }
    for (const f of FIELDS) if (fields[f].status === "suggested") fields[f] = { ...fields[f], status: "accepted" }
    const next = settle(t, { ...s, fields })
    const after = nextInTriage(t.id)
    update(t, next, `${t.id} accepted · moved to ${GROUP_LABEL[next.group]}`)
    if (after) setSelectedId(after)
  }

  const escalate = (t: InboxTicket) => {
    const s = states[t.id]
    if (s.group === "escalated") return
    const fields = { ...s.fields }
    for (const f of FIELDS) if (fields[f].status === "suggested") fields[f] = { ...fields[f], status: "accepted" }
    update(t, { ...s, fields, group: "escalated", byHand: !t.result.escalate }, `${t.id} escalated to on-call`)
  }

  const reply = (t: InboxTicket) => {
    setTabFor({ id: t.id, tab: "reply" })
    requestAnimationFrame(() => {
      sendRef.current?.scrollIntoView({ block: "nearest" })
      sendRef.current?.focus()
    })
  }

  // Keep the latest handlers for the global key listener without re-binding it.
  const keys = React.useRef({ move, acceptAll, escalate, reply, selected })
  React.useEffect(() => {
    keys.current = { move, acceptAll, escalate, reply, selected }
  })
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented || isTypingTarget(e.target)) return
      const k = keys.current
      const key = e.key.toLowerCase()
      if (key === "j" || e.key === "ArrowDown") k.move(1)
      else if (key === "k" || e.key === "ArrowUp") k.move(-1)
      else if (key === "a") k.acceptAll(k.selected)
      else if (key === "e") k.escalate(k.selected)
      else if (key === "r") k.reply(k.selected)
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="flex min-h-svh flex-col md:h-svh md:min-h-0">
      <TopBar />
      <OutageBanner count={clusterCount} active={clusterOnly} onToggle={() => setClusterOnly((v) => !v)} />

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:grid-cols-[400px_minmax(0,1fr)]">
        {/* List */}
        <nav
          aria-label="Ticket inbox"
          className="max-h-[21rem] overflow-y-auto border-b bg-background md:max-h-none md:border-r md:border-b-0"
        >
          {GROUPS.map((g) => {
            const items = ordered.filter((t) => states[t.id].group === g.key)
            return (
              <section key={g.key} aria-labelledby={`b-group-${g.key}`}>
                <h2
                  id={`b-group-${g.key}`}
                  className="sticky top-0 z-10 flex h-8 items-center gap-2 border-b bg-background/95 px-3 text-xs font-medium backdrop-blur-sm"
                >
                  <g.Icon className={cn("size-3.5", g.tone)} aria-hidden="true" />
                  {g.label}
                  <span className="font-mono text-muted-foreground">{items.length}</span>
                </h2>
                {items.length ? (
                  <ul>
                    {items.map((t) => (
                      <li key={t.id}>
                        <Row
                          ticket={t}
                          state={states[t.id]}
                          selected={t.id === selected.id}
                          onSelect={() => setSelectedId(t.id)}
                          refCb={(el) => {
                            if (el) rowRefs.current.set(t.id, el)
                            else rowRefs.current.delete(t.id)
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-3 text-xs text-muted-foreground">
                    {g.key === "triage" ? "Inbox zero. Nothing waits for triage." : "No tickets here yet."}
                  </p>
                )}
              </section>
            )
          })}
        </nav>

        {/* Detail */}
        <main className="min-w-0 overflow-y-auto">
          <TicketDetail
            ticket={selected}
            state={selState}
            tab={tab}
            onTab={(next) => setTabFor({ id: selected.id, tab: next })}
            onAcceptField={(f) => acceptField(selected, f)}
            onChangeField={(f, v) => changeField(selected, f, v)}
            onAcceptAll={() => acceptAll(selected)}
            onEscalate={() => escalate(selected)}
            onReply={() => reply(selected)}
            sendRef={sendRef}
          />
        </main>
      </div>

      <KeyHints />
    </div>
  )
}

function Row({
  ticket,
  state,
  selected,
  onSelect,
  refCb,
}: {
  ticket: InboxTicket
  state: TicketState
  selected: boolean
  onSelect: () => void
  refCb: (el: HTMLButtonElement | null) => void
}) {
  const tr = ticket.result.triage
  const lowConf =
    state.group === "triage" && [tr.type_conf, tr.queue_conf, tr.priority_conf].some((c) => confidenceBand(c) === "Ambiguous")
  return (
    <button
      ref={refCb}
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "relative grid h-10 w-full grid-cols-[auto_4.5rem_minmax(0,1fr)_auto] items-center gap-2.5 px-3 text-left text-[0.8125rem] transition-colors duration-150 outline-none",
        "hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        selected && "bg-[var(--selected)] hover:bg-[var(--selected)] before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
      )}
    >
      <PriorityIcon priority={state.fields.priority.value as Priority} className="size-4" />
      <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
      <span className={cn("truncate", selected ? "font-medium" : "")} lang={tr.language}>
        {ticket.subject}
      </span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {lowConf ? (
          <TriangleAlertIcon className="size-3.5 text-warning-fg" role="img" aria-label="Low confidence suggestion" />
        ) : null}
        {tr.language === "de" ? <span className="font-mono text-[0.625rem] uppercase">de</span> : null}
        <span className="w-7 text-right font-mono">{ticket.receivedMin}m</span>
      </span>
    </button>
  )
}

const inboundConfig = {
  rest: { label: "Medium and low", color: "var(--chart-5)" },
  high: { label: "High", color: "var(--critical)" },
} satisfies ChartConfig

const wideQuery = "(min-width: 1024px)"
function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(wideQuery)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

function TopBar() {
  // Mount the sparkline only where it shows, so Recharts never measures a hidden box.
  const wide = React.useSyncExternalStore(subscribeWide, () => window.matchMedia(wideQuery).matches, () => false)
  const total = INBOUND_24H.reduce((n, d) => n + d.high + d.rest, 0)
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-3 md:px-4">
      <Link
        href="/references"
        aria-label="Back to design directions"
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" aria-hidden="true" />
      </Link>
      <div className="flex items-center gap-2">
        <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <RadarIcon className="size-3.5" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold tracking-[-0.01em]">SentinelDesk</span>
      </div>
      <span className="hidden text-sm text-muted-foreground sm:inline">/</span>
      <span className="hidden text-sm sm:inline">Triage</span>

      <div className="ml-auto flex items-center gap-3">
        {wide ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Inbound 24h</span>
          <ChartContainer config={inboundConfig} className="aspect-auto h-6 w-28" aria-hidden="true">
            <BarChart data={INBOUND_24H} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={1}>
              <Bar dataKey="rest" stackId="v" fill="var(--color-rest)" isAnimationActive={false} />
              <Bar dataKey="high" stackId="v" fill="var(--color-high)" radius={[1, 1, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
          <span className="font-mono text-xs">{total}</span>
          <span className="sr-only">tickets in the last 24 hours, with a high-priority burst between 08:00 and 10:00</span>
        </div>
        ) : null}
        <button
          type="button"
          className="hidden h-7 w-48 items-center gap-2 rounded-md border bg-muted/50 px-2 text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted md:flex"
        >
          <SearchIcon className="size-3.5" aria-hidden="true" />
          Search tickets
          <Kbd className="ml-auto">⌘K</Kbd>
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}

function OutageBanner({ count, active, onToggle }: { count: number; active: boolean; onToggle: () => void }) {
  return (
    <div
      role="status"
      className="relative flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b bg-critical-tint/60 py-2 pr-3 pl-4 text-[0.8125rem] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-critical md:pr-4"
    >
      <SirenIcon className="size-4 shrink-0 text-critical-fg" aria-hidden="true" />
      <p className="min-w-0 flex-1">
        <span className="font-medium text-critical-fg">Possible major outage.</span>{" "}
        <span>
          {count} tickets in {OUTAGE.windowMin} min describe the same {OUTAGE.label}
        </span>{" "}
        <span className="font-mono text-xs text-muted-foreground">({OUTAGE.baseline})</span>
      </p>
      <Button size="xs" variant={active ? "secondary" : "outline"} onClick={onToggle} aria-pressed={active}>
        {active ? <XIcon data-icon="inline-start" aria-hidden="true" /> : null}
        {active ? "Show all tickets" : "Show cluster"}
      </Button>
    </div>
  )
}

function KeyHints() {
  const hints = [
    { keys: ["J", "K"], label: "Move" },
    { keys: ["A"], label: "Accept all" },
    { keys: ["E"], label: "Escalate" },
    { keys: ["R"], label: "Reply" },
  ]
  return (
    <footer className="hidden h-8 shrink-0 items-center gap-5 border-t bg-background px-4 text-xs text-muted-foreground md:flex">
      {hints.map((h) => (
        <span key={h.label} className="flex items-center gap-1.5">
          {h.keys.map((k) => (
            <Kbd key={k} className="border border-border bg-background font-mono">
              {k}
            </Kbd>
          ))}
          {h.label}
        </span>
      ))}
      <span className="ml-auto">Suggestions from the triage model · drafts from Gemini</span>
    </footer>
  )
}
