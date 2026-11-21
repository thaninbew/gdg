"use client"

import { CheckIcon, LightbulbIcon, ShieldCheckIcon, SirenIcon, UsersRoundIcon } from "lucide-react"

import { AISurface } from "@/components/sentinel/ai"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableFooter, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { invoiceTotals, type Invoice } from "./logic"

const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" })

export function Urgent({ reasons }: { reasons: string[] }) {
  return (
    <div className="rounded-lg bg-critical-tint p-4 text-critical-fg">
      <div className="flex flex-wrap items-center gap-2">
        <SirenIcon className="size-4 shrink-0" aria-hidden="true" />
        <p className="text-sm font-semibold">Sent to on-call as urgent</p>
        <Badge variant="outline" className="border-critical/40 text-critical-fg">
          Simulated
        </Badge>
      </div>
      <ul className="mt-2 ml-6 list-disc space-y-0.5 text-[0.8125rem] marker:text-critical/60">
        {reasons.slice(0, 3).map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="mt-2 ml-6 text-[0.8125rem]">Updates show up in My requests.</p>
    </div>
  )
}

export function Breakdown({ invoice, previous }: { invoice: Invoice; previous: Invoice | null }) {
  const t = invoiceTotals(invoice)
  const added = previous
    ? invoice.lines.filter((l) => !previous.lines.some((p) => p.item === l.item))
    : []
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <ShieldCheckIcon className="size-4 shrink-0 text-success" aria-hidden="true" />
        <h2 className="text-sm font-semibold">Invoice breakdown</h2>
        <Badge variant="success">Verified, read-only</Badge>
        <span className="ml-auto font-mono text-[0.8125rem] text-muted-foreground">{invoice.id}</span>
      </div>
      <p className="mt-1 text-[0.8125rem] text-muted-foreground">
        {invoice.period} · {invoice.paid}
      </p>
      <Table className="mt-3">
        <TableBody>
          {invoice.lines.map((l) => (
            <TableRow key={l.item}>
              <TableCell className="whitespace-normal">{l.item}</TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {l.qty > 1 ? `${l.qty} × ${eur.format(l.unit)}` : ""}
              </TableCell>
              <TableCell className="text-right font-mono">{eur.format(l.qty * l.unit)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="text-muted-foreground">VAT {Math.round(invoice.vatRate * 100)}%</TableCell>
            <TableCell />
            <TableCell className="text-right font-mono">{eur.format(t.vat)}</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold">Total</TableCell>
            <TableCell />
            <TableCell className="text-right font-mono font-semibold">{eur.format(t.total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      {added.length && previous ? (
        <p className="mt-3 rounded-md bg-muted px-3 py-2 text-[0.8125rem]">
          New since {previous.period.split(" ")[0]}: {added.map((l) => `${l.item} (${eur.format(l.qty * l.unit)})`).join(", ")}
        </p>
      ) : null}
    </div>
  )
}

export type Source = { id: string; subject: string }

export function Answer({ sentences }: { sentences: { text: string; source: Source | null }[] }) {
  const sources = [...new Map(sentences.flatMap((s) => (s.source ? [[s.source.id, s.source] as const] : []))).values()]
  return (
    <AISurface
      title="Answer"
      action={
        sources.length ? (
          <Badge variant="outline">From {sources.length === 1 ? "1 past ticket" : `${sources.length} past tickets`}</Badge>
        ) : null
      }
    >
      <p className="text-[0.9375rem] leading-relaxed">
        {sentences.map((s, i) => (
          <span key={i}>
            {s.text}{" "}
            {s.source ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-sm border px-1 align-baseline font-mono text-xs text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    aria-label={`Source ${s.source.id}${s.source.subject ? `: ${s.source.subject}` : ""}`}
                  >
                    {s.source.id}
                  </button>
                </TooltipTrigger>
                {s.source.subject ? <TooltipContent>{s.source.subject}</TooltipContent> : null}
              </Tooltip>
            ) : null}{" "}
          </span>
        ))}
      </p>
    </AISurface>
  )
}

export function Handoff({ team, reason }: { team: string; reason: string }) {
  return (
    <div className="rounded-lg bg-info-tint p-4 text-info-fg">
      <div className="flex items-center gap-2">
        <UsersRoundIcon className="size-4 shrink-0" aria-hidden="true" />
        <p className="text-sm font-semibold">With our {team} team</p>
      </div>
      <p className="mt-1 ml-6 text-[0.8125rem]">{reason} Replies show up in My requests.</p>
    </div>
  )
}

const REVIEW_STEPS = [
  { label: "Received", note: null, done: true },
  { label: "Grouped with similar requests", note: "3 similar", done: true },
  { label: "Product review", note: "Shortlisted for planning", done: false },
]

export function Review() {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <LightbulbIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-semibold">Logged for product review</h2>
        <Badge variant="outline">Sample flow</Badge>
      </div>
      <ol className="mt-4 flex flex-col gap-3">
        {REVIEW_STEPS.map((s) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            <span
              className={
                s.done
                  ? "inline-flex size-5 items-center justify-center rounded-full bg-success-tint text-success-fg"
                  : "inline-flex size-5 items-center justify-center rounded-full border border-dashed text-muted-foreground"
              }
            >
              {s.done ? <CheckIcon className="size-3" aria-hidden="true" /> : null}
            </span>
            <span>{s.label}</span>
            {s.note ? <span className="text-[0.8125rem] text-muted-foreground">{s.note}</span> : null}
            <span className="sr-only">{s.done ? "done" : "sample outcome"}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[0.8125rem] text-muted-foreground">Sample outcome. Nothing has been built or shipped.</p>
    </div>
  )
}
