"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts"

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { IncidentFlow } from "@/components/charts/incident-flow"
import { MockBadge } from "@/components/sentinel/case-outcome"
import { PageHeader } from "@/components/sentinel/page-header"
import { useCases } from "@/lib/case-store"
import { INCIDENT_SOURCES } from "@/lib/fixtures"
import { outcome } from "@/lib/gate"
import { KPI_TRENDS, VOLUME, type Range } from "@/lib/ops-mock"

const AXIS = { tickLine: false, axisLine: false, tickMargin: 6 } as const
const FILL = { high: 0.34, medium: 0.18, low: 0.1 } as const
const RANGES: Range[] = ["1h", "24h", "7d"]

const priorityConfig = {
  high: { label: "High", color: "var(--prio-high)" },
  medium: { label: "Medium", color: "var(--prio-medium)" },
  low: { label: "Low", color: "var(--prio-low)" },
} satisfies ChartConfig

const PRIO_SWATCH = { high: "bg-prio-high", medium: "bg-prio-medium", low: "bg-prio-low" } as const

type Lang = "all" | "en" | "de"

export function Dashboard() {
  const router = useRouter()
  const { cases, state } = useCases()
  const [lang, setLang] = React.useState<Lang>("all")
  const [range, setRange] = React.useState<Range>("24h")

  const outcomes = cases.map((c) => outcome(c, state[c.ticket_id]))
  const count = (o: string) => outcomes.filter((x) => x === o).length

  const kpis = [
    { key: "open", label: "Open", value: String(cases.length - count("draft")), trend: KPI_TRENDS.open, href: "/tickets", color: "var(--chart-1)" },
    {
      key: "escalation",
      label: "Escalation rate",
      value: `${Math.round((count("escalate") / cases.length) * 100)}%`,
      trend: KPI_TRENDS.escalation,
      href: "/tickets?status=escalate",
      color: "var(--critical)",
    },
    { key: "clarify", label: "Clarify", value: String(count("clarify")), trend: KPI_TRENDS.clarify, href: "/tickets?status=clarify", color: "var(--warning)" },
    { key: "drafts", label: "Drafts ready", value: String(count("draft")), trend: KPI_TRENDS.drafts, href: "/tickets?status=draft", color: "var(--success)" },
  ]

  // Drop the "Other teams" bucket so every node is a real team.
  const teams = INCIDENT_SOURCES.queues.slice(0, -1)
  const categories = React.useMemo(
    () => INCIDENT_SOURCES.data[lang].map((r) => ({ ...r, queues: r.queues.slice(0, -1) })),
    [lang]
  )
  const total = categories.reduce((a, r) => a + r.n, 0)
  const volume = VOLUME[range]

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="@container/main flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <section aria-label="Queue status" className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.key} className="relative gap-3">
              <CardHeader>
                <CardDescription>
                  <Link href={k.href} className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/50">
                    {k.label}
                  </Link>
                </CardDescription>
                <CardTitle className="font-mono text-2xl font-semibold tabular-nums">{k.value}</CardTitle>
                <CardAction>
                  <MockBadge />
                </CardAction>
              </CardHeader>
              <CardContent>
                <Sparkline values={k.trend} color={k.color} label={k.label} />
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Volume by priority</CardTitle>
            <CardAction className="flex items-center gap-2">
              <MockBadge />
              <ToggleGroup
                type="single"
                size="sm"
                variant="outline"
                value={range}
                onValueChange={(v) => v && setRange(v as Range)}
                aria-label="Time range"
                className="hidden @[540px]/card:flex"
              >
                {RANGES.map((r) => (
                  <ToggleGroupItem key={r} value={r} className="px-3">
                    {r}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Select value={range} onValueChange={(v) => setRange(v as Range)}>
                <SelectTrigger size="sm" className="w-20 @[540px]/card:hidden" aria-label="Time range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANGES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={priorityConfig} className="aspect-auto h-[232px] w-full">
              <AreaChart data={volume.points} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="2 3" />
                <XAxis dataKey="t" {...AXIS} interval="preserveStartEnd" minTickGap={24} />
                <YAxis {...AXIS} width={36} allowDecimals={false} />
                {volume.burst && volume.burst[0] !== volume.burst[1] ? (
                  <ReferenceArea
                    x1={volume.burst[0]}
                    x2={volume.burst[1]}
                    fill="var(--critical)"
                    fillOpacity={0.07}
                    stroke="var(--critical)"
                    strokeOpacity={0.45}
                    strokeDasharray="3 3"
                    label={{ value: "Outage burst", position: "insideTopRight", fill: "var(--critical-fg)", fontSize: 10.5, dy: -14, dx: 4 }}
                  />
                ) : null}
                {volume.burst && volume.burst[0] === volume.burst[1] ? (
                  <ReferenceLine
                    x={volume.burst[0]}
                    stroke="var(--critical)"
                    strokeDasharray="3 3"
                    label={{ value: "Outage burst", position: "insideTopRight", fill: "var(--critical-fg)", fontSize: 10.5, dy: -14 }}
                  />
                ) : null}
                <ChartTooltip cursor={{ strokeDasharray: "2 2" }} content={<ChartTooltipContent indicator="line" />} />
                <ChartLegend content={<ChartLegendContent />} />
                {(["high", "medium", "low"] as const).map((k) => (
                  <Area
                    key={k}
                    dataKey={k}
                    stackId="v"
                    type="linear"
                    stroke={`var(--color-${k})`}
                    strokeWidth={1.5}
                    fill={`var(--color-${k})`}
                    fillOpacity={FILL[k]}
                    isAnimationActive={false}
                    activeDot={{ r: 2.5, strokeWidth: 0 }}
                  />
                ))}
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where incidents come from</CardTitle>
            <CardDescription className="font-mono text-xs">{total.toLocaleString("en-US")} incidents in dataset</CardDescription>
            <CardAction>
              <ToggleGroup
                type="single"
                size="sm"
                variant="outline"
                value={lang}
                onValueChange={(v) => v && setLang(v as Lang)}
                aria-label="Language"
              >
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="en">EN</ToggleGroupItem>
                <ToggleGroupItem value="de">DE</ToggleGroupItem>
              </ToggleGroup>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {total ? (
              <>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-1.5 rounded-sm bg-info" aria-hidden="true" />
                    Team
                  </span>
                  {(["high", "medium", "low"] as const).map((k) => (
                    <span key={k} className="inline-flex items-center gap-1.5">
                      <span className={`h-2.5 w-1.5 rounded-sm ${PRIO_SWATCH[k]}`} aria-hidden="true" />
                      {priorityConfig[k].label}
                    </span>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <IncidentFlow
                    className="min-w-[760px]"
                    categories={categories}
                    teams={teams}
                    onSelect={({ kind, name }) =>
                      router.push(`/tickets?${kind === "team" ? "queue" : "category"}=${encodeURIComponent(name)}`)
                    }
                  />
                </div>
              </>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyDescription>No incidents for this language.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function Sparkline({ values, color, label }: { values: number[]; color: string; label: string }) {
  const id = `spark-${label.replace(/\W/g, "")}`
  const config = { v: { label, color } } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="aspect-auto h-9 w-full" aria-hidden="true">
      <AreaChart data={values.map((v) => ({ v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-v)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-v)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Area dataKey="v" type="linear" stroke="var(--color-v)" strokeWidth={1.25} fill={`url(#${id})`} isAnimationActive={false} dot={false} />
      </AreaChart>
    </ChartContainer>
  )
}
