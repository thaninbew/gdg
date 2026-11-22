"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
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
import { TicketDetail } from "./[id]/detail"
import { outcome, TRIAGE_FIELDS } from "@/lib/gate"
import { useI18n } from "@/lib/i18n"
import type { CaseOutcome, Language } from "@/lib/types"
import { cn } from "@/lib/utils"

type Status = "all" | CaseOutcome
const STATUSES: { value: Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "clarify", label: "Clarify" },
  { value: "escalate", label: "Escalate" },
  { value: "draft", label: "Draft ready" },
]

export function Inbox({
  queue,
  category,
  status: initialStatus,
  language,
  open,
}: {
  queue: string | null
  category: string | null
  status: string | null
  /** Only tickets written in this language (from the dashboard's language filter). */
  language: Language | null
  /** Ticket shown in the side panel beside the list. */
  open: string | null
}) {
  const router = useRouter()
  const { cases, state, accept, escalate, restore } = useCases()
  const { t } = useI18n()
  const [status, setStatus] = React.useState<Status>(
    STATUSES.some((s) => s.value === initialStatus) ? (initialStatus as Status) : "all"
  )
  const [selected, setSelected] = React.useState<string | null>(null)
  const ticketLinks = React.useRef(new Map<string, HTMLAnchorElement>())

  const rows = sortQueue(cases, state).map((c) => ({ c, s: state[c.ticket_id], o: outcome(c, state[c.ticket_id]) }))
  const scoped = rows.filter(({ c, s }) => (!queue || s.triage.queue === queue) && (!category || c.category === category) && (!language || c.triage.language === language))
  const visible = scoped.filter(({ o }) => status === "all" || o === status)
  const activeId = visible.some((v) => v.c.ticket_id === selected) ? selected : (visible[0]?.c.ticket_id ?? null)

  // Tickets open beside the list; the URL keeps the filters so Back and Forward work.
  const listQuery = (extra: Record<string, string> = {}, keep: { scope?: boolean; language?: boolean } = {}) => {
    const { scope = true, language: keepLang = true } = keep
    const q = new URLSearchParams({
      ...(scope && queue ? { queue } : {}),
      ...(scope && category ? { category } : {}),
      ...(keepLang && language ? { lang: language } : {}),
      ...(status !== "all" ? { status } : {}),
      ...extra,
    })
    return `/tickets${q.size ? `?${q}` : ""}`
  }
  const openHref = (ticketId: string) => listQuery({ open: ticketId })

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const focusedId = e.target instanceof HTMLAnchorElement ? e.target.dataset.ticketId : undefined
      // Leave controls outside the queue to handle their own keys.
      if (e.target !== document.body && !focusedId) return
      const id = focusedId ?? activeId
      const i = visible.findIndex((v) => v.c.ticket_id === id)
      if (!id || i < 0) return
      const before = state[id]
      if (e.key === "j" || e.key === "k") {
        e.preventDefault()
        const next = visible[Math.min(visible.length - 1, Math.max(0, i + (e.key === "j" ? 1 : -1)))]
        const link = ticketLinks.current.get(next.c.ticket_id)
        link?.focus({ preventScroll: true })
        link?.scrollIntoView({ block: "nearest" })
      } else if (e.key === "Enter" && !focusedId) {
        e.preventDefault()
        router.push(openHref(id))
      } else if (e.key === "a") {
        if (TRIAGE_FIELDS.every((f) => before.fields[f] !== "suggested")) return
        accept(id)
        toast(t(`Accepted triage for ${id}`), { action: { label: t("Undo"), onClick: () => restore(id, before) } })
      } else if (e.key === "e") {
        escalate(id, "Operator escalated from the inbox")
        toast(t(`Escalated ${id}`), { action: { label: t("Undo"), onClick: () => restore(id, before) } })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- openHref only reads the filters from props
  }, [visible, activeId, state, router, accept, escalate, restore, t])


  return (
    <>
      <PageHeader
        title="Inbox"
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <Link href="/find">
                <SearchIcon data-icon="inline-start" aria-hidden="true" />
                <span className="hidden sm:inline">{t("Find a ticket")}</span>
              </Link>
            </Button>
            <NewTicket />
          </>
        }
      />
      <div className={cn(open && "lg:grid lg:grid-cols-[minmax(0,1fr)_clamp(22rem,46%,38rem)] lg:items-start")}>
      <div className="flex min-w-0 flex-col gap-4 p-4 lg:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={status}
            onValueChange={(v) => v && setStatus(v as Status)}
            aria-label={t("Status")}
          >
            {STATUSES.map((s) => (
              <ToggleGroupItem key={s.value} value={s.value} className="gap-1.5 px-2.5">
                {t(s.label)}
                <span className="font-mono text-xs text-muted-foreground">
                  {s.value === "all" ? scoped.length : scoped.filter((v) => v.o === s.value).length}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {queue || category ? (
            <Badge variant="info" asChild>
              <Link href={listQuery({}, { scope: false })} aria-label={t(`Clear filter ${queue ?? category}`)}>
                {queue ?? category}
                <XIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Badge>
          ) : null}
          {language ? (
            <Badge variant="info" asChild>
              <Link href={listQuery({}, { language: false })} aria-label={t("Clear language filter")}>
                {language === "de" ? t("German") : t("English")}
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
                  <TableHead className="w-24">{t("Priority")}</TableHead>
                  <TableHead className="w-24">{t("Ticket")}</TableHead>
                  <TableHead>{t("Subject")}</TableHead>
                  <TableHead className={cn("hidden w-44", !open && "lg:table-cell")}>{t("Queue")}</TableHead>
                  <TableHead className={cn("hidden w-36", !open && "md:table-cell")}>{t("Confidence")}</TableHead>
                  <TableHead className="w-28">{t("Status")}</TableHead>
                  <TableHead className={cn("hidden w-16 text-right", !open && "md:table-cell")}>{t("Received")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(({ c, s, o }) => {
                  const unsettled = TRIAGE_FIELDS.filter((f) => s.fields[f] === "suggested")
                  const conf = Math.min(1, ...unsettled.map((f) => s.triage[`${f}_conf` as const]))
                  return (
                    <TableRow
                      key={c.ticket_id}
                      data-state={(open ?? activeId) === c.ticket_id ? "selected" : undefined}
                      onClick={(e) => {
                        if (e.target instanceof Element && !e.target.closest("a")) router.push(openHref(c.ticket_id))
                      }}
                      onMouseEnter={() => {
                        if (document.activeElement === document.body) setSelected(c.ticket_id)
                      }}
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
                          href={openHref(c.ticket_id)}
                          data-ticket-id={c.ticket_id}
                          ref={(el) => {
                            if (el) ticketLinks.current.set(c.ticket_id, el)
                            else ticketLinks.current.delete(c.ticket_id)
                          }}
                          onFocus={() => setSelected(c.ticket_id)}
                          lang={c.triage.language}
                          className="block truncate rounded-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {c.subject}
                        </Link>
                      </TableCell>
                      <TableCell className={cn("hidden truncate text-[0.8125rem] text-muted-foreground", !open && "lg:table-cell")}>
                        {s.triage.queue}
                      </TableCell>
                      <TableCell className={cn("hidden", !open && "md:table-cell")}>
                        {unsettled.length ? (
                          <ConfidenceMeter value={conf} />
                        ) : (
                          <span className="text-xs text-muted-foreground">{t("Accepted")}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <OutcomeBadge outcome={o} />
                      </TableCell>
                      <TableCell className={cn("hidden text-right font-mono text-xs text-muted-foreground", !open && "md:table-cell")}>
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
              <EmptyDescription>{t("No tickets match these filters.")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => {
                  setStatus("all")
                  router.push("/tickets")
                }}
              >
                {t("Clear filters")}
              </Button>
            </EmptyContent>
          </Empty>
        )}

      </div>
      {open ? (
        <aside
          aria-label={t("Ticket")}
          className="overflow-y-auto border-l bg-canvas max-lg:fixed max-lg:inset-x-0 max-lg:top-(--topbar) max-lg:bottom-0 max-lg:z-30 lg:sticky lg:top-[calc(var(--topbar)+var(--header-height))] lg:h-[calc(100svh-var(--topbar)-var(--header-height))]"
        >
          <TicketDetail id={open} variant="panel" closeHref={listQuery()} />
        </aside>
      ) : null}
      </div>
    </>
  )
}

function NewTicket() {
  const [open, setOpen] = React.useState(false)
  const { t } = useI18n()
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          {t("New ticket")}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <form
          className="flex h-full flex-col"
          onSubmit={(e) => {
            e.preventDefault()
            setOpen(false)
            toast.error(t("Triage API not connected"), { description: t("Start the backend, then submit again.") })
          }}
        >
          <SheetHeader>
            <SheetTitle>{t("New ticket")}</SheetTitle>
            <SheetDescription>{t("English or German.")}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nt-subject">{t("Subject")}</Label>
              <Input id="nt-subject" name="subject" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nt-body">{t("Message")}</Label>
              <Textarea id="nt-body" name="body" rows={8} required />
            </div>
          </div>
          <SheetFooter>
            <Button type="submit">{t("Triage ticket")}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
