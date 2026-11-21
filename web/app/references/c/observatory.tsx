"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowDownRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CircleCheckIcon,
  MinusIcon,
  RadioTowerIcon,
  SirenIcon,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { PriorityBadge, TicketId } from "@/components/sentinel/status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { ArrivalsBars, CalibrationChart, ECE, RiskDial, Sparkline, StageLatencyChart, VolumeChart } from "./charts"
import { OUTAGE, STAGE_LATENCY, TICKETS, VOLUME, kpisFor, type Kpi, type Range } from "./data"
import { TicketDetail } from "./ticket-detail"

type Filter = "all" | "cluster" | "escalated" | "auto"

const PRIORITY_KEYS = [
  { key: "high", label: "High", color: "var(--prio-high)" },
  { key: "medium", label: "Medium", color: "var(--prio-medium)" },
  { key: "low", label: "Low", color: "var(--prio-low)" },
] as const

function PanelHead({ title, meta, children }: { title: string; meta?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1">
      <h2 className="text-sm font-medium">{title}</h2>
      {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
      {children ? <div className="ml-auto flex items-center gap-2">{children}</div> : null}
    </header>
  )
}

const TONE: Record<Kpi["tone"], string> = {
  neutral: "text-muted-foreground",
  warning: "text-warning-fg",
  critical: "text-critical-fg",
  success: "text-success-fg",
}

function KpiTile({ kpi }: { kpi: Kpi }) {
  const TrendIcon = kpi.trend === "up" ? ArrowUpRightIcon : kpi.trend === "down" ? ArrowDownRightIcon : MinusIcon
  return (
    <section className="flex min-w-0 flex-col gap-1 rounded-lg border bg-card px-3 pt-3 pb-2" aria-label={kpi.label}>
      <h2 className="truncate text-xs text-muted-foreground">{kpi.label}</h2>
      <div className="flex flex-col gap-x-2 sm:flex-row sm:items-baseline">
        <p className="font-mono text-2xl font-semibold tracking-tight whitespace-nowrap">{kpi.value}</p>
        <p className={cn("flex min-w-0 items-center gap-0.5 truncate text-xs", TONE[kpi.tone])}>
          <TrendIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{kpi.delta}</span>
        </p>
      </div>
      <Sparkline data={kpi.series} color={kpi.color} label={kpi.key} />
      <p className="truncate text-[0.6875rem] text-muted-foreground">{kpi.hint}</p>
    </section>
  )
}

export function Observatory() {
  const [range, setRange] = useState<Range>("24h")
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<Filter>("all")
  const [selectedId, setSelectedId] = useState(TICKETS[0].id)

  const volume = VOLUME[range]
  const kpis = useMemo(() => kpisFor(range), [range])
  const totals = useMemo(
    () =>
      Object.fromEntries(PRIORITY_KEYS.map(({ key }) => [key, volume.points.reduce((a, p) => a + p[key], 0)])) as Record<
        "high" | "medium" | "low",
        number
      >,
    [volume]
  )
  const rows = TICKETS.filter((r) =>
    filter === "cluster" ? r.cluster : filter === "escalated" ? r.escalate : filter === "auto" ? !r.escalate : true
  )
  const selected = TICKETS.find((r) => r.id === selectedId) ?? TICKETS[0]

  const toggleSeries = (k: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  const showDetail = (id: string) => {
    setSelectedId(id)
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        document.getElementById("dirc-detail")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    })
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
        <Link
          href="/references"
          aria-label="Back to design directions"
          className="-ml-1 rounded-md p-1 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
        </Link>
        <RadioTowerIcon className="size-4 text-primary" aria-hidden="true" />
        <p className="text-sm font-semibold">SentinelDesk</p>
        <span className="hidden text-sm text-muted-foreground sm:inline">Ops Observatory</span>
        <span className="hidden items-center gap-1.5 font-mono text-xs text-muted-foreground md:inline-flex">
          <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
          Live · 10:47
        </span>
        <div className="ml-auto flex items-center gap-2">
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            spacing={0}
            value={range}
            onValueChange={(v) => v && setRange(v as Range)}
            aria-label="Time range"
          >
            {(["1h", "24h", "7d"] as const).map((r) => (
              <ToggleGroupItem key={r} value={r} className="font-mono text-xs data-[state=on]:text-foreground">
                {r}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-3 p-3 md:p-4">
        {/* Major-outage banner */}
        <section
          role="alert"
          aria-labelledby="dirc-outage"
          className="grid gap-3 rounded-lg border border-critical/40 bg-critical-tint px-4 py-3 text-critical-fg lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)_auto] lg:items-center"
        >
          <div className="flex min-w-0 items-start gap-3">
            <SirenIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2 id="dirc-outage" className="text-sm font-semibold">
                Major outage · {OUTAGE.title}
              </h2>
              <p className="text-[0.8125rem]">
                <span className="font-mono">{OUTAGE.ticketCount}</span> tickets describe the same failure since{" "}
                <span className="font-mono">{OUTAGE.firstSeen}</span> across {OUTAGE.queues.length} queues ·{" "}
                <span className="font-mono">{OUTAGE.languages}</span> · on-call paged
              </p>
            </div>
          </div>
          <div className="min-w-0">
            <p className="mb-0.5 font-mono text-[0.6875rem]">Arrivals per 10 min since {OUTAGE.firstSeen}</p>
            <ArrivalsBars data={OUTAGE.arrivals} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="destructive" onClick={() => { setFilter("cluster"); showDetail("TKT-12418") }} className="bg-critical text-white hover:bg-critical/90 dark:bg-critical dark:text-[#1a0806]">
              Open incident brief
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
          </div>
        </section>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <KpiTile key={k.key} kpi={k} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-3 lg:grid-cols-12">
          <section className="flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-4 lg:col-span-6" aria-labelledby="dirc-volume">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 id="dirc-volume" className="text-sm font-medium">
                Ticket volume by priority
              </h2>
              <span className="text-xs text-muted-foreground">Stacked, {volume.unit}</span>
              <div className="ml-auto flex flex-wrap items-center gap-1" role="group" aria-label="Show series">
                {PRIORITY_KEYS.map(({ key, label, color }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={!hidden.has(key)}
                    onClick={() => toggleSeries(key)}
                    className="inline-flex h-6 items-center gap-1.5 rounded-md px-1.5 text-xs transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-[pressed=false]:text-muted-foreground aria-[pressed=false]:line-through"
                  >
                    <span className="size-2 rounded-[2px]" style={{ backgroundColor: color }} aria-hidden="true" />
                    {label}
                    <span className="font-mono text-muted-foreground">{totals[key]}</span>
                  </button>
                ))}
              </div>
            </header>
            <VolumeChart points={volume.points} burst={volume.burst} hidden={hidden} />
          </section>

          <section className="flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-4 md:col-span-1 lg:col-span-3" aria-labelledby="dirc-calibration">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 id="dirc-calibration" className="text-sm font-medium">
                Calibration
              </h2>
              <span className="text-xs text-muted-foreground">Priority model, holdout</span>
              <span className="ml-auto font-mono text-xs">ECE {(ECE * 100).toFixed(1)}%</span>
            </header>
            <CalibrationChart />
            <p className="text-xs text-muted-foreground">
              <span className="text-warning-fg">Overconfident 0.4–0.7:</span> observed accuracy runs 3–5 pts below predicted.
            </p>
          </section>

          <section className="flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-4 lg:col-span-3" aria-labelledby="dirc-risk">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 id="dirc-risk" className="text-sm font-medium">
                Risk dial
              </h2>
              <span className="text-xs text-muted-foreground">Auto-draft threshold</span>
            </header>
            <RiskDial />
          </section>
        </div>

        {/* Queue + selected ticket */}
        <div className="grid items-start gap-3 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-7">
          <section className="flex min-w-0 flex-col rounded-lg border bg-card" aria-labelledby="dirc-queue">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-3 pb-2">
              <PanelHead title="Queue" meta={`${rows.length} of ${TICKETS.length} recent`} />
              <ToggleGroup
                type="single"
                size="sm"
                variant="outline"
                spacing={0}
                value={filter}
                onValueChange={(v) => v && setFilter(v as Filter)}
                aria-label="Filter tickets"
                className="ml-auto"
              >
                <ToggleGroupItem value="all" className="text-xs">All</ToggleGroupItem>
                <ToggleGroupItem value="cluster" className="text-xs">VPN cluster</ToggleGroupItem>
                <ToggleGroupItem value="escalated" className="text-xs">Escalated</ToggleGroupItem>
                <ToggleGroupItem value="auto" className="text-xs">Auto-draft</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <h2 id="dirc-queue" className="sr-only">
              Ticket queue
            </h2>
            <Table className="text-[0.8125rem]">
              <TableHeader>
                <TableRow className="hover:bg-transparent [&>th]:h-8 [&>th]:text-xs [&>th]:font-normal [&>th]:text-muted-foreground">
                  <TableHead className="pl-4">Ticket</TableHead>
                  <TableHead className="w-full">Subject</TableHead>
                  <TableHead className="hidden md:table-cell">Priority</TableHead>
                  <TableHead className="hidden 2xl:table-cell">Queue</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Min conf</TableHead>
                  <TableHead className="hidden text-right md:table-cell">E2E</TableHead>
                  <TableHead className="pr-4 text-right">Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const active = r.id === selected.id
                  return (
                    <TableRow
                      key={r.id}
                      data-state={active ? "selected" : undefined}
                      aria-selected={active}
                      onClick={() => showDetail(r.id)}
                      className="h-10 cursor-pointer data-[state=selected]:bg-info-tint/60 [&>td]:py-1.5"
                    >
                      <TableCell className={cn("pl-4", active && "shadow-[inset_2px_0_0_var(--primary)]")}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            showDetail(r.id)
                          }}
                          className="rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                          aria-label={`Open ${r.id}: ${r.subject}`}
                        >
                          <TicketId id={r.id} />
                        </button>
                      </TableCell>
                      <TableCell className="max-w-0 whitespace-normal md:whitespace-nowrap">
                        <div className="flex min-w-0 items-center gap-1.5">
                          {r.cluster ? (
                            <span className="size-1.5 shrink-0 rounded-full bg-critical" aria-label="VPN cluster" role="img" />
                          ) : null}
                          <span lang={r.language} className="line-clamp-2 md:truncate">
                            {r.subject}
                          </span>
                          <span className="shrink-0 font-mono text-[0.6875rem] text-muted-foreground uppercase">{r.language}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <PriorityBadge priority={r.priority} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground 2xl:table-cell">{r.queue}</TableCell>
                      <TableCell>
                        {r.escalate ? (
                          <span className="inline-flex items-center gap-1 text-critical-fg">
                            <SirenIcon className="size-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">Escalate</span>
                            <span className="sr-only sm:hidden">Escalate</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-success-fg">
                            <CircleCheckIcon className="size-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">Auto-draft</span>
                            <span className="sr-only sm:hidden">Auto-draft</span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={cn("hidden text-right font-mono sm:table-cell", r.minConf < 0.6 && "text-warning-fg")}>
                        {Math.round(r.minConf * 100)}%
                      </TableCell>
                      <TableCell className="hidden text-right font-mono md:table-cell">{(r.totalMs / 1000).toFixed(2)}s</TableCell>
                      <TableCell className="pr-4 text-right font-mono text-muted-foreground">{r.age}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <p className="border-t px-4 py-2 text-xs text-muted-foreground">
              Showing the 7 most recent. <Badge variant="critical" className="align-middle">19 more</Badge> VPN cluster tickets linked to the incident.
            </p>
          </section>

          <section className="flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-4" aria-labelledby="dirc-stages">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 id="dirc-stages" className="text-sm font-medium">
                Pipeline latency by stage
              </h2>
              <span className="text-xs text-muted-foreground">End to end, last {range}</span>
              <span className="ml-auto font-mono text-xs">p95 {kpis[3].value} · draft 87%</span>
            </header>
            <StageLatencyChart rows={STAGE_LATENCY} />
          </section>
          </div>

          <section id="dirc-detail" className="min-w-0 scroll-mt-14 rounded-lg border bg-card lg:sticky lg:top-14 lg:col-span-5 lg:max-h-[calc(100svh-4.5rem)] lg:overflow-y-auto" aria-label="Selected ticket">
            <TicketDetail key={selected.id} row={selected} />
          </section>
        </div>
      </main>
    </div>
  )
}
