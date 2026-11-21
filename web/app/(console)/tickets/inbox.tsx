"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { MockBadge, OutcomeBadge } from "@/components/sentinel/case-outcome"
import { ConfidenceMeter } from "@/components/sentinel/confidence"
import { PageHeader } from "@/components/sentinel/page-header"
import { PriorityBadge, TicketId } from "@/components/sentinel/status"
import { sortQueue, useCases } from "@/lib/case-store"
import { outcome, TRIAGE_FIELDS } from "@/lib/gate"
import type { CaseOutcome } from "@/lib/types"

type Status = "all" | CaseOutcome
const STATUSES: { value: Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "clarify", label: "Clarify" },
  { value: "escalate", label: "Escalate" },
  { value: "draft", label: "Draft ready" },
]

function isTyping(el: EventTarget | null) {
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
}

export function Inbox({ queue, category, status: initialStatus }: { queue: string | null; category: string | null; status: string | null }) {
  const router = useRouter()
  const { cases, state, accept, escalate, restore } = useCases()
  const [status, setStatus] = React.useState<Status>(
    STATUSES.some((s) => s.value === initialStatus) ? (initialStatus as Status) : "all"
  )
  const [selected, setSelected] = React.useState<string | null>(null)
  const rowRefs = React.useRef(new Map<string, HTMLTableRowElement>())

  const rows = sortQueue(cases, state).map((c) => ({ c, s: state[c.ticket_id], o: outcome(c, state[c.ticket_id]) }))
  const scoped = rows.filter(({ c, s }) => (!queue || s.triage.queue === queue) && (!category || c.category === category))
  const visible = scoped.filter(({ o }) => status === "all" || o === status)
  const activeId = visible.some((v) => v.c.ticket_id === selected) ? selected : (visible[0]?.c.ticket_id ?? null)

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey || !activeId) return
      const i = visible.findIndex((v) => v.c.ticket_id === activeId)
      const before = state[activeId]
      if (e.key === "j" || e.key === "k") {
        e.preventDefault()
        const next = visible[Math.min(visible.length - 1, Math.max(0, i + (e.key === "j" ? 1 : -1)))]
        if (!next) return
        setSelected(next.c.ticket_id)
        rowRefs.current.get(next.c.ticket_id)?.scrollIntoView({ block: "nearest" })
      } else if (e.key === "Enter") {
        e.preventDefault()
        router.push(`/tickets/${activeId}`)
      } else if (e.key === "a") {
        if (TRIAGE_FIELDS.every((f) => before.fields[f] !== "suggested")) return
        accept(activeId)
        toast(`Accepted triage for ${activeId}`, { action: { label: "Undo", onClick: () => restore(activeId, before) } })
      } else if (e.key === "e") {
        escalate(activeId, "Operator escalated from the inbox")
        toast(`Escalated ${activeId}`, { action: { label: "Undo", onClick: () => restore(activeId, before) } })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [visible, activeId, state, router, accept, escalate, restore])

  const clearHref = status === "all" ? "/tickets" : `/tickets?status=${status}`

  return (
    <>
      <PageHeader title="Inbox" actions={<NewTicket />} />
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={status}
            onValueChange={(v) => v && setStatus(v as Status)}
            aria-label="Status"
          >
            {STATUSES.map((s) => (
              <ToggleGroupItem key={s.value} value={s.value} className="gap-1.5 px-2.5">
                {s.label}
                <span className="font-mono text-xs text-muted-foreground">
                  {s.value === "all" ? scoped.length : scoped.filter((v) => v.o === s.value).length}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {queue || category ? (
            <Badge variant="info" asChild>
              <Link href={clearHref} aria-label={`Clear filter ${queue ?? category}`}>
                {queue ?? category}
                <XIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Badge>
          ) : null}
          <span className="ml-auto">
            <MockBadge />
          </span>
        </div>

        {visible.length ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-24">Priority</TableHead>
                  <TableHead className="w-24">Ticket</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden w-44 lg:table-cell">Queue</TableHead>
                  <TableHead className="hidden w-36 md:table-cell">Confidence</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="hidden w-16 text-right md:table-cell">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(({ c, s, o }) => {
                  const unsettled = TRIAGE_FIELDS.filter((f) => s.fields[f] === "suggested")
                  const conf = Math.min(1, ...unsettled.map((f) => s.triage[`${f}_conf` as const]))
                  return (
                    <TableRow
                      key={c.ticket_id}
                      ref={(el) => {
                        if (el) rowRefs.current.set(c.ticket_id, el)
                      }}
                      data-state={activeId === c.ticket_id ? "selected" : undefined}
                      onClick={() => router.push(`/tickets/${c.ticket_id}`)}
                      onMouseEnter={() => setSelected(c.ticket_id)}
                      className="h-10 cursor-pointer"
                    >
                      <TableCell>
                        <PriorityBadge priority={s.triage.priority} />
                      </TableCell>
                      <TableCell>
                        <TicketId id={c.ticket_id} className="text-muted-foreground" />
                      </TableCell>
                      <TableCell className="max-w-0">
                        <Link
                          href={`/tickets/${c.ticket_id}`}
                          onFocus={() => setSelected(c.ticket_id)}
                          lang={c.triage.language}
                          className="block truncate rounded-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {c.subject}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden truncate text-[0.8125rem] text-muted-foreground lg:table-cell">
                        {s.triage.queue}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {unsettled.length ? (
                          <ConfidenceMeter value={conf} />
                        ) : (
                          <span className="text-xs text-muted-foreground">Accepted</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <OutcomeBadge outcome={o} />
                      </TableCell>
                      <TableCell className="hidden text-right font-mono text-xs text-muted-foreground md:table-cell">
                        {c.received}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty className="border bg-card">
            <EmptyHeader>
              <EmptyDescription>No tickets match these filters.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => {
                  setStatus("all")
                  router.push("/tickets")
                }}
              >
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        )}

        <p className="hidden flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground md:flex">
          <span className="inline-flex items-center gap-1">
            <Kbd>J</Kbd>
            <Kbd>K</Kbd> move
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Enter</Kbd> open
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>A</Kbd> accept triage
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>E</Kbd> escalate
          </span>
        </p>
      </div>
    </>
  )
}

function NewTicket() {
  const [open, setOpen] = React.useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          New ticket
        </Button>
      </SheetTrigger>
      <SheetContent>
        <form
          className="flex h-full flex-col"
          onSubmit={(e) => {
            e.preventDefault()
            setOpen(false)
            toast.error("Triage API not connected", { description: "Start the backend, then submit again." })
          }}
        >
          <SheetHeader>
            <SheetTitle>New ticket</SheetTitle>
            <SheetDescription>English or German.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nt-subject">Subject</Label>
              <Input id="nt-subject" name="subject" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nt-body">Message</Label>
              <Textarea id="nt-body" name="body" rows={8} required />
            </div>
          </div>
          <SheetFooter>
            <Button type="submit">Triage ticket</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
