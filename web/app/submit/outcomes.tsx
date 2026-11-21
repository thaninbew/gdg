"use client"

import { CheckIcon, CircleDashedIcon, FileTextIcon, LightbulbIcon, Link2Icon, SirenIcon, UsersRoundIcon } from "lucide-react"

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
        <p className="text-sm font-semibold">On-call will take it first</p>
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
        <FileTextIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-semibold">Invoice breakdown</h2>
        <Badge variant="outline">Sample record, read-only</Badge>
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

export function Answer({ sentences, sample = false }: { sentences: { text: string; source: Source | null }[]; sample?: boolean }) {
  const cited = new Set(sentences.flatMap((s) => (s.source ? [s.source.id] : []))).size
  return (
    <AISurface
      title="Answer"
      action={
        sample ? (
          <Badge variant="outline">Sample answer</Badge>
        ) : cited ? (
          <Badge variant="outline">Grounded in {cited === 1 ? "1 past ticket" : `${cited} past tickets`}</Badge>
        ) : null
      }
    >
      <p className="text-[0.9375rem] leading-relaxed">
        {sentences.map((s, i) => (
          <span key={i}>
            {s.text}{" "}
            {s.source ? (
              // Ticket ID only: past tickets belong to other customers, so no subject or snippet is shown.
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Source: resolved past ticket ${s.source.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 align-baseline font-mono text-xs text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <Link2Icon className="size-3 text-muted-foreground" aria-hidden="true" />
                    {s.source.id}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Backed by a resolved past ticket</TooltipContent>
              </Tooltip>
            ) : null}{" "}
          </span>
        ))}
      </p>
    </AISurface>
  )
}

export function Handoff({ team, reason, checked = false }: { team: string; reason: string; checked?: boolean }) {
  return (
    <div className="ai-surface rounded-xl p-4">
      <div className="flex items-center gap-2">
        <UsersRoundIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-semibold">With our {team} team</p>
      </div>
      <p className="mt-1 ml-6 text-[0.8125rem] text-muted-foreground">{reason} Replies show up in My requests.</p>
      {checked ? (
        // Pre-triage finished; nobody has accepted the ticket yet, so this stops at "ready".
        <ol className="mt-3 ml-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" aria-label="Progress">
          <li className="flex items-center gap-1.5 text-success-fg">
            <CheckIcon className="size-3.5" aria-hidden="true" />
            Request checked
          </li>
          <li className="flex items-center gap-1.5 text-muted-foreground">
            <CircleDashedIcon className="size-3.5" aria-hidden="true" />
            Ready for engineer review
          </li>
        </ol>
      ) : null}
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
