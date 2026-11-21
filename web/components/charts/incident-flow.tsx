"use client"

import * as React from "react"
import { Sankey } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

// Flow map of where incidents come from: incident categories (left) flow into the teams that
// received them (right). Band width = incident count. Hover or focus highlights one node's flows;
// selecting a node hands it to `onSelect` (the dashboard opens the inbox filtered to it).

export interface FlowCategory {
  name: string
  n: number
  high: number
  medium: number
  low: number
  /** Incidents per team, same order as `teams`. */
  queues: readonly number[]
}

type FlowNode = { name: string; kind: "category" | "team"; n: number; high?: number; medium?: number; low?: number }
type Selected = { kind: "category" | "team"; name: string }

const MIN_SHARE = 0.03 // hide flows under 3% of a category's incidents
const config = { n: { label: "Incidents", color: "var(--info)" } } satisfies ChartConfig

export function IncidentFlow({
  categories,
  teams,
  onSelect,
  className,
}: {
  categories: FlowCategory[]
  teams: readonly string[]
  onSelect?: (node: Selected) => void
  className?: string
}) {
  const [active, setActive] = React.useState<string | null>(null)

  const data = React.useMemo(() => {
    const cats = categories.slice().sort((a, b) => b.n - a.n)
    const teamTotals = teams.map((_, j) => cats.reduce((a, c) => a + c.queues[j], 0))
    const teamOrder = teams.map((t, j) => ({ t, j })).filter(({ j }) => teamTotals[j] > 0).sort((a, b) => teamTotals[b.j] - teamTotals[a.j])
    const nodes: FlowNode[] = [
      ...cats.map((c) => ({ name: c.name, kind: "category" as const, n: c.n, high: c.high, medium: c.medium, low: c.low })),
      ...teamOrder.map(({ t, j }) => ({ name: t, kind: "team" as const, n: teamTotals[j] })),
    ]
    const links = cats.flatMap((c, i) =>
      teamOrder
        .map(({ j }, k) => ({ source: i, target: cats.length + k, value: c.queues[j] }))
        .filter((l) => c.n > 0 && l.value / c.n >= MIN_SHARE)
    )
    return { nodes, links }
  }, [categories, teams])

  const touches = (sourceName: string, targetName: string) => !active || active === sourceName || active === targetName

  return (
    <ChartContainer config={config} className={cn("aspect-auto h-[440px] w-full", className)}>
      <Sankey
        data={data}
        nodeWidth={10}
        nodePadding={18}
        sort={false}
        iterations={0}
        margin={{ top: 8, right: 260, bottom: 8, left: 250 }}
        link={(props: LinkProps) => {
          const on = touches(props.payload.source.name, props.payload.target.name)
          return (
            <path
              d={`M${props.sourceX},${props.sourceY}C${props.sourceControlX},${props.sourceY} ${props.targetControlX},${props.targetY} ${props.targetX},${props.targetY}`}
              fill="none"
              stroke={active && on ? "var(--primary)" : "var(--muted-foreground)"}
              strokeOpacity={on ? (active ? 0.45 : 0.18) : 0.04}
              strokeWidth={Math.max(1, props.linkWidth)}
              className="transition-[stroke-opacity] duration-150"
            />
          )
        }}
        node={(props: NodeProps) => {
          const p = props.payload as FlowNode & { value: number }
          const dim = active !== null && active !== p.name && !data.links.some((l) => {
            const s = data.nodes[l.source].name
            const t = data.nodes[l.target].name
            return (s === active && t === p.name) || (t === active && s === p.name)
          })
          const select = () => onSelect?.({ kind: p.kind, name: p.name })
          const left = p.kind === "category"
          let y = props.y
          return (
            <g
              tabIndex={0}
              role="button"
              aria-label={`${p.name}: ${p.value.toLocaleString("en-US")} incidents. Open in inbox.`}
              onPointerEnter={() => setActive(p.name)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(p.name)}
              onBlur={() => setActive(null)}
              onClick={select}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  select()
                }
              }}
              className={cn("cursor-pointer outline-none transition-opacity duration-150 focus-visible:[&>text]:underline", dim && "opacity-30")}
            >
              {left ? (
                // Category bar split by priority, top to bottom: high, medium, low.
                (["high", "medium", "low"] as const).map((k) => {
                  const h = (props.height * (p[k] ?? 0)) / p.n
                  const rect = <rect key={k} x={props.x} y={y} width={props.width} height={Math.max(0, h - 1)} fill={`var(--prio-${k})`} />
                  y += h
                  return rect
                })
              ) : (
                <rect x={props.x} y={props.y} width={props.width} height={props.height} rx={2} fill="var(--info)" />
              )}
              <text
                x={left ? props.x - 10 : props.x + props.width + 10}
                y={props.y + props.height / 2}
                textAnchor={left ? "end" : "start"}
                dominantBaseline="middle"
                className="fill-foreground text-xs"
              >
                {p.name}
                <tspan dx={6} className="fill-muted-foreground font-mono text-[11px]">
                  {p.value.toLocaleString("en-US")}
                </tspan>
              </text>
            </g>
          )
        }}
      />
    </ChartContainer>
  )
}

interface NodeProps {
  x: number
  y: number
  width: number
  height: number
  index: number
  payload: unknown
}

interface LinkProps {
  sourceX: number
  sourceY: number
  sourceControlX: number
  targetX: number
  targetY: number
  targetControlX: number
  linkWidth: number
  index: number
  payload: { source: { name: string }; target: { name: string }; value: number }
}
