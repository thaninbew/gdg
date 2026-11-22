"use client"

import * as React from "react"
import Link from "next/link"
import { CheckIcon, SearchIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { PriorityBadge, TicketId } from "@/components/sentinel/status"
import { useCases } from "@/lib/case-store"
import { useI18n } from "@/lib/i18n"
import { EXAMPLES, findTicket, searchNumbers, searchTerms, STORE, type Match, type SearchResult } from "@/lib/ticket-search"
import type { Priority } from "@/lib/types"
import { cn } from "@/lib/utils"

const LEVEL: Record<Match["level"], { label: string; variant: "success" | "info" | "warning" | "outline" }> = {
  exact: { label: "Ticket number", variant: "success" },
  number: { label: "Number contains", variant: "info" },
  strong: { label: "Strong match", variant: "success" },
  partial: { label: "Partial match", variant: "warning" },
  weak: { label: "Weak match", variant: "outline" },
}

// Find a customer's ticket from what they say, or from a (partial) ticket number.
export function TicketFinder() {
  const { t, lang } = useI18n()
  const { include } = useCases()
  const [said, setSaid] = React.useState("")
  const [result, setResult] = React.useState<SearchResult | null>(null)
  const [confirmed, setConfirmed] = React.useState<string | null>(null)

  const run = (text: string) => {
    if (!text.trim()) return
    setSaid(text)
    setConfirmed(null)
    setResult(findTicket(text))
  }
  // Removing a term searches again with the rest.
  const drop = (term: string) => {
    if (!result) return
    const rest = result.terms.filter((x) => x !== term)
    setResult(rest.length ? (result.byNumber ? searchNumbers(rest) : searchTerms(rest)) : null)
  }
  const confirm = (id: string) => {
    include(id)
    setConfirmed(id)
    toast(t(`Linked ${id} to this customer`))
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 lg:p-6">
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          run(said)
        }}
      >
        <Input
          aria-label={t("What the customer says, or a ticket number")}
          placeholder={t("What the customer says, or a ticket number")}
          value={said}
          onChange={(e) => setSaid(e.target.value)}
          className="h-10"
        />
        <Button type="submit" className="h-10" disabled={!said.trim()}>
          <SearchIcon data-icon="inline-start" aria-hidden="true" />
          {t("Search")}
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES[lang].map((x) => (
          <Button key={x} size="xs" variant="outline" onClick={() => run(x)}>
            {x}
          </Button>
        ))}
      </div>

      {result ? (
        <section aria-label={t("Search")} aria-live="polite" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted-foreground">{t("Search terms")}</span>
            {result.terms.map((w) => (
              <Badge key={w} variant="secondary" className="gap-1 pr-1">
                {w}
                <button
                  type="button"
                  aria-label={t(`Remove ${w}`)}
                  onClick={() => drop(w)}
                  className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <XIcon className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
          </div>

          {result.ask ? <Clarify ask={result.ask} ids={[result.matches[0].ticket.id, result.matches[1].ticket.id]} /> : null}

          {result.matches.length ? (
            <ol className="flex flex-col gap-2">
              {result.matches.map((m) => (
                <Result key={m.ticket.id} match={m} confirmed={confirmed === m.ticket.id} onConfirm={() => confirm(m.ticket.id)} onOpen={() => include(m.ticket.id)} />
              ))}
            </ol>
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyDescription>
                  {t(
                    result.byNumber
                      ? "No ticket with that number. Check the digits with the customer, or describe the issue instead."
                      : "No match. Ask for something specific: an error message, the product name, or when it started."
                  )}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      ) : (
        <p className="text-xs text-muted-foreground">{t(`${STORE.length} tickets searchable`)}</p>
      )}
    </div>
  )
}

function Clarify({ ask, ids }: { ask: [string[], string[]]; ids: [string, string] }) {
  const { t } = useI18n()
  if (!ask[0].length && !ask[1].length) return null
  return (
    <div className="rounded-lg border border-warning-fg/30 bg-warning-tint p-3 text-sm">
      <p className="font-medium">{t("Too close to call. Ask the customer which one fits:")}</p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {ask.map((words, i) =>
          words.length ? (
            <li key={ids[i]} className="flex flex-wrap items-center gap-1.5">
              <TicketId id={ids[i]} />
              {words.map((w) => (
                <Badge key={w} variant="outline">
                  {w}
                </Badge>
              ))}
            </li>
          ) : null
        )}
      </ul>
    </div>
  )
}

function Result({ match, confirmed, onConfirm, onOpen }: { match: Match; confirmed: boolean; onConfirm: () => void; onOpen: () => void }) {
  const { t } = useI18n()
  const [full, setFull] = React.useState(false)
  const x = match.ticket
  const level = LEVEL[match.level]
  const body = x.b.replace(/\s+/g, " ").trim()
  return (
    <li className={cn("flex flex-col gap-2 rounded-lg border bg-card p-3", confirmed && "border-success-fg/40")}>
      <div className="flex flex-wrap items-center gap-2">
        <TicketId id={x.id} />
        <Badge variant={level.variant}>{t(level.label)}</Badge>
        {x.p in PRIORITIES ? <PriorityBadge priority={x.p as Priority} /> : null}
        <span className="text-xs text-muted-foreground">{x.q}</span>
        <span className="font-mono text-xs text-muted-foreground">{x.l.toUpperCase()}</span>
      </div>
      <p className="font-semibold">{highlight(x.s || "(no subject)", match.hit)}</p>
      <p className={cn("text-sm text-muted-foreground", !full && "line-clamp-2")}>{highlight(body, match.hit)}</p>
      <div className="flex flex-wrap items-center gap-2">
        {body.length > 160 ? (
          <Button size="xs" variant="ghost" onClick={() => setFull((f) => !f)} aria-expanded={full}>
            {t(full ? "Less" : "Full message")}
          </Button>
        ) : null}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant={confirmed ? "secondary" : "outline"} onClick={onConfirm} disabled={confirmed}>
            <CheckIcon data-icon="inline-start" aria-hidden="true" />
            {t("Customer confirmed")}
          </Button>
          <Button size="sm" asChild>
            <Link href={`/tickets?open=${x.id}`} onClick={onOpen}>
              {t("Open ticket")}
            </Link>
          </Button>
        </div>
      </div>
    </li>
  )
}

const PRIORITIES = { high: 1, medium: 1, low: 1 }

function highlight(text: string, words: string[]) {
  const ws = words.filter((w) => w.length > 2 || /^\d+$/.test(w) || w.startsWith("TKT-"))
  if (!ws.length) return text
  const re = new RegExp(`(${ws.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi")
  return text.split(re).map((part, i) =>
    i % 2 ? (
      <mark key={i} className="rounded-sm bg-info-tint px-0.5 text-foreground">
        {part}
      </mark>
    ) : (
      part
    )
  )
}
