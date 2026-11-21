"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Slider } from "@/components/ui/slider"
import { calibration, coverage } from "@/lib/mock"
import { cn } from "@/lib/utils"
import type { KpiSeries, VolumePoint } from "./data"

const AXIS = { tickLine: false, axisLine: false, tickMargin: 6 } as const

// --- Sparkline -------------------------------------------------------------------------------

export function Sparkline({ data, color, label }: { data: KpiSeries; color: string; label: string }) {
  const config = { v: { label, color } } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="aspect-auto h-9 w-full" aria-hidden="true">
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${label.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-v)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-v)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Area
          dataKey="v"
          type="linear"
          stroke="var(--color-v)"
          strokeWidth={1.25}
          fill={`url(#spark-${label.replace(/\W/g, "")})`}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}

// --- Ticket volume by priority ---------------------------------------------------------------

const volumeConfig = {
  high: { label: "High", color: "var(--prio-high)" },
  medium: { label: "Medium", color: "var(--prio-medium)" },
  low: { label: "Low", color: "var(--prio-low)" },
} satisfies ChartConfig

// Ordinal ramp: the more urgent the series, the heavier its fill. High sits on the baseline so
// its burst reads at true height.
const FILL = { high: 0.34, medium: 0.18, low: 0.1 } as const

export function VolumeChart({
  points,
  burst,
  hidden,
}: {
  points: VolumePoint[]
  burst?: [string, string]
  hidden: Set<string>
}) {
  return (
    <ChartContainer config={volumeConfig} className="aspect-auto min-h-[232px] w-full flex-1">
      <AreaChart data={points} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="2 3" />
        <XAxis dataKey="t" {...AXIS} interval="preserveStartEnd" minTickGap={20} />
        <YAxis {...AXIS} width={36} allowDecimals={false} />
        {burst && burst[0] !== burst[1] ? (
          <ReferenceArea
            x1={burst[0]}
            x2={burst[1]}
            fill="var(--critical)"
            fillOpacity={0.07}
            stroke="var(--critical)"
            strokeOpacity={0.45}
            strokeDasharray="3 3"
            label={{ value: "VPN burst · 37 high", position: "insideTopRight", fill: "var(--critical-fg)", fontSize: 10.5, dy: -14, dx: 4 }}
          />
        ) : null}
        {burst && burst[0] === burst[1] ? (
          <ReferenceLine
            x={burst[0]}
            stroke="var(--critical)"
            strokeDasharray="3 3"
            label={{ value: "VPN outage", position: "insideTopRight", fill: "var(--critical-fg)", fontSize: 10.5, dy: -14 }}
          />
        ) : null}
        <ChartTooltip cursor={{ strokeDasharray: "2 2" }} content={<ChartTooltipContent indicator="line" />} />
        {(["high", "medium", "low"] as const).map((k) => (
          <Area
            key={k}
            dataKey={k}
            stackId="v"
            type="linear"
            hide={hidden.has(k)}
            stroke={`var(--color-${k})`}
            strokeWidth={1.25}
            fill={`var(--color-${k})`}
            fillOpacity={FILL[k]}
            isAnimationActive={false}
            activeDot={{ r: 2.5, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  )
}

// --- Calibration -----------------------------------------------------------------------------

const calibrationConfig = {
  observed: { label: "Observed accuracy", color: "var(--chart-1)" },
  ideal: { label: "Perfect calibration", color: "var(--chart-5)" },
} satisfies ChartConfig

export const ECE = calibration.reduce((a, p) => a + Math.abs(p.observed - p.predicted), 0) / calibration.length

export function CalibrationChart() {
  return (
    <ChartContainer config={calibrationConfig} className="aspect-auto h-[196px] w-full">
      <LineChart data={calibration} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="2 3" />
        <XAxis
          dataKey="predicted"
          type="number"
          domain={[0, 1]}
          ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          tickFormatter={(v: number) => v.toFixed(1)}
          {...AXIS}
        />
        <YAxis
          type="number"
          domain={[0, 1]}
          ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          tickFormatter={(v: number) => v.toFixed(1)}
          width={30}
          {...AXIS}
        />
        <ReferenceArea x1={0.4} x2={0.7} fill="var(--warning)" fillOpacity={0.08} />
        <ChartTooltip
          cursor={{ strokeDasharray: "2 2" }}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(_, payload) => `Predicted ${Number(payload?.[0]?.payload?.predicted ?? 0).toFixed(1)}`}
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">{calibrationConfig[name as keyof typeof calibrationConfig]?.label}</span>
                  <span className="font-mono text-foreground">{(Number(value) * 100).toFixed(0)}%</span>
                </div>
              )}
            />
          }
        />
        <Line
          dataKey="ideal"
          type="linear"
          stroke="var(--color-ideal)"
          strokeDasharray="4 4"
          strokeWidth={1}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="observed"
          type="linear"
          stroke="var(--color-observed)"
          strokeWidth={1.5}
          dot={{ r: 2.25, strokeWidth: 0, fill: "var(--color-observed)" }}
          activeDot={{ r: 3.5, strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}

// --- Risk dial -------------------------------------------------------------------------------

const riskConfig = {
  coverage: { label: "Auto-handled", color: "var(--chart-1)" },
  accuracy: { label: "Accuracy", color: "var(--chart-2)" },
} satisfies ChartConfig

export const CURRENT_GATE = 0.8

export function RiskDial() {
  const [threshold, setThreshold] = useState(0.7)
  const sliderRow = useRef<HTMLDivElement>(null)
  // The shared Slider puts aria-label on the root, so the focusable thumb has no name. Name it here.
  useEffect(() => {
    sliderRow.current?.querySelector('[role="slider"]')?.setAttribute("aria-labelledby", "dirc-threshold-label")
  }, [])
  const point = useMemo(
    () => coverage.reduce((best, p) => (Math.abs(p.threshold - threshold) < Math.abs(best.threshold - threshold) ? p : best)),
    [threshold]
  )
  const gate = coverage.find((p) => p.threshold === CURRENT_GATE)!
  const dCov = Math.round((point.coverage - gate.coverage) * 100)
  const dAcc = Math.round((point.accuracy - gate.accuracy) * 100)
  const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "±0")

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-snug" aria-live="polite">
        Auto-handle <span className="font-mono text-lg font-semibold text-info-fg">{Math.round(point.coverage * 100)}%</span> at{" "}
        <span className="font-mono text-lg font-semibold text-success-fg">{Math.round(point.accuracy * 100)}%</span> accuracy
        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
          {signed(dCov)} pts coverage · {signed(dAcc)} pts accuracy vs current gate
        </span>
      </p>
      <div ref={sliderRow} className="flex items-center gap-3">
        <span id="dirc-threshold-label" className="shrink-0 text-xs text-muted-foreground">
          Confidence threshold
        </span>
        <Slider
          min={0.05}
          max={0.95}
          step={0.05}
          value={[threshold]}
          onValueChange={([v]) => setThreshold(Number(v.toFixed(2)))}
          className="flex-1 [&_[data-slot=slider-thumb]]:size-3.5"
        />
        <span className="w-9 text-right font-mono text-sm">{threshold.toFixed(2)}</span>
      </div>
      <ChartContainer config={riskConfig} className="aspect-auto h-[150px] w-full">
        <LineChart data={coverage} margin={{ top: 4, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="2 3" vertical={false} />
          <XAxis
            dataKey="threshold"
            type="number"
            domain={[0.05, 0.95]}
            ticks={[0.2, 0.4, 0.6, 0.8]}
            tickFormatter={(v: number) => v.toFixed(1)}
            {...AXIS}
          />
          <YAxis domain={[0, 1]} ticks={[0, 0.5, 1]} tickFormatter={(v: number) => `${v * 100}%`} width={44} {...AXIS} />
          <ReferenceLine
            x={CURRENT_GATE}
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            label={{ value: "gate", position: "insideBottomRight", fill: "var(--muted-foreground)", fontSize: 10 }}
          />
          <ReferenceLine x={point.threshold} stroke="var(--foreground)" strokeWidth={1} />
          <ChartTooltip
            cursor={{ strokeDasharray: "2 2" }}
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(_, payload) => `Threshold ${Number(payload?.[0]?.payload?.threshold ?? 0).toFixed(2)}`}
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-muted-foreground">{riskConfig[name as keyof typeof riskConfig]?.label}</span>
                    <span className="font-mono text-foreground">{Math.round(Number(value) * 100)}%</span>
                  </div>
                )}
              />
            }
          />
          <Line dataKey="coverage" type="linear" stroke="var(--color-coverage)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line dataKey="accuracy" type="linear" stroke="var(--color-accuracy)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <LegendSwatch color="var(--chart-1)" label="Auto-handled share" />
        <LegendSwatch color="var(--chart-2)" label="Accuracy of auto-handled" />
      </div>
    </div>
  )
}

export function LegendSwatch({ color, label, className }: { color: string; label: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  )
}

// --- Outage arrivals -------------------------------------------------------------------------

const arrivalsConfig = { v: { label: "Cluster tickets", color: "var(--critical)" } } satisfies ChartConfig

export function ArrivalsBars({ data }: { data: { t: string; v: number }[] }) {
  return (
    <ChartContainer config={arrivalsConfig} className="aspect-auto h-10 w-full">
      <BarChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }} barCategoryGap={2}>
        <XAxis dataKey="t" hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator labelFormatter={(l) => `${l}, 10 min`} />} />
        <Bar dataKey="v" fill="var(--color-v)" fillOpacity={0.7} radius={1} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

// --- Latency per stage -----------------------------------------------------------------------

const latencyConfig = {
  triage_ms: { label: "Triage", color: "var(--lat-triage)" },
  retrieval_ms: { label: "Retrieval", color: "var(--lat-retrieval)" },
  gate_ms: { label: "Gate", color: "var(--lat-gate)" },
  draft_ms: { label: "Draft", color: "var(--lat-draft)" },
} satisfies ChartConfig

export function LatencyBar({ timings }: { timings: Record<keyof typeof latencyConfig, number> }) {
  const data = [{ name: "total", ...timings }]
  return (
    <div className="flex flex-col gap-2">
      <ChartContainer config={latencyConfig} className="aspect-auto h-5 w-full">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={0}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis type="category" dataKey="name" hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel formatter={undefined} indicator="dot" />}
          />
          {(Object.keys(latencyConfig) as (keyof typeof latencyConfig)[]).map((k, i, arr) => (
            <Bar
              key={k}
              dataKey={k}
              stackId="t"
              fill={`var(--color-${k})`}
              isAnimationActive={false}
              radius={i === 0 ? [3, 0, 0, 3] : i === arr.length - 1 ? [0, 3, 3, 0] : 0}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        {(Object.keys(latencyConfig) as (keyof typeof latencyConfig)[]).map((k) => (
          <div key={k} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: latencyConfig[k].color }} aria-hidden="true" />
            <dt className="text-muted-foreground">{latencyConfig[k].label}</dt>
            <dd className="ml-auto font-mono sm:ml-1">{timings[k].toLocaleString()} ms</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// --- Stage latency percentiles ----------------------------------------------------------------

const STAGE_KEYS = Object.keys(latencyConfig) as (keyof typeof latencyConfig)[]

export function StageLatencyChart({ rows }: { rows: ({ name: string } & Record<keyof typeof latencyConfig, number>)[] }) {
  return (
    <div className="flex flex-col gap-2">
      <ChartContainer config={latencyConfig} className="aspect-auto w-full" style={{ height: rows.length * 30 + 22 }}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }} barCategoryGap={7}>
          <CartesianGrid horizontal={false} strokeDasharray="2 3" />
          <XAxis type="number" {...AXIS} tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}s`} />
          <YAxis type="category" dataKey="name" {...AXIS} width={92} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          {STAGE_KEYS.map((k, i) => (
            <Bar
              key={k}
              dataKey={k}
              stackId="s"
              fill={`var(--color-${k})`}
              isAnimationActive={false}
              radius={i === 0 ? [2, 0, 0, 2] : i === STAGE_KEYS.length - 1 ? [0, 2, 2, 0] : 0}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {STAGE_KEYS.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px]" style={{ backgroundColor: latencyConfig[k].color }} aria-hidden="true" />
            {latencyConfig[k].label}
          </span>
        ))}
      </div>
    </div>
  )
}
