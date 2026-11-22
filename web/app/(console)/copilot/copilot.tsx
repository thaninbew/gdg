"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRightIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AISurface } from "@/components/sentinel/ai"
import { MockBadge } from "@/components/sentinel/case-outcome"
import { CopilotComposer, CopilotMessages } from "@/components/sentinel/copilot-chat"
import { CitationProvider } from "@/components/sentinel/grounded-reply"
import { PageHeader } from "@/components/sentinel/page-header"
import { TicketId } from "@/components/sentinel/status"
import { sortQueue, useCases } from "@/lib/case-store"
import { useCopilot } from "@/lib/copilot-store"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function CopilotPage({ conversation, ticket }: { conversation: string | null; ticket: string | null }) {
  const copilot = useCopilot()
  const { cases, state, find } = useCases()
  const { t } = useI18n()
  const [selected, setSelected] = React.useState<string | null>(conversation)
  const [confirmAll, setConfirmAll] = React.useState(false)
  const started = React.useRef(false)

  // ?ticket=<id>: open that ticket's current conversation, or start one.
  React.useEffect(() => {
    if (!ticket || started.current) return
    started.current = true
    setSelected(copilot.current(ticket)?.id ?? copilot.create(ticket))
  }, [ticket, copilot])

  const saved = copilot.conversations.filter((c) => c.messages.length || c.id === selected)
  const conv = (selected && copilot.byId(selected)) || saved[0] || null
  const c = conv ? find(conv.ticketId) ?? null : null
  const withMessages = copilot.conversations.filter((x) => x.messages.length)

  const startNew = () => setSelected(copilot.create(conv?.ticketId ?? sortQueue(cases, state)[0].ticket_id))
  const remove = (ids: string[], label: string) => {
    const undo = copilot.remove(ids)
    if (selected && ids.includes(selected)) setSelected(null)
    setConfirmAll(false)
    toast(label, { action: { label: t("Undo"), onClick: undo } })
  }

  return (
    <>
      <PageHeader
        title="Copilot"
        actions={
          <Button size="sm" onClick={startNew}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            {t("New chat")}
          </Button>
        }
      />
      <div className="grid gap-6 p-4 lg:grid-cols-[18.5rem_minmax(0,1fr)] lg:p-6">
        <aside aria-label={t("Conversations")} className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-[calc(var(--topbar)+var(--header-height)+1.5rem)] lg:self-start">
          <div className="flex min-h-7 items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{t(`${withMessages.length} conversations`)}</span>
            {withMessages.length ? (
              confirmAll ? (
                <span role="alert" className="flex items-center gap-1.5 text-xs font-medium text-critical-fg">
                  {t(`Delete all ${withMessages.length}?`)}
                  <Button size="xs" variant="destructive" onClick={() => remove(withMessages.map((x) => x.id), t(`Deleted ${withMessages.length} conversations`))}>
                    {t("Delete")}
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => setConfirmAll(false)}>
                    {t("Cancel")}
                  </Button>
                </span>
              ) : (
                <Button size="xs" variant="ghost" onClick={() => setConfirmAll(true)}>
                  <Trash2Icon data-icon="inline-start" aria-hidden="true" />
                  {t("Delete all")}
                </Button>
              )
            ) : null}
          </div>
          {saved.length ? (
            <ul className="flex flex-col gap-1.5">
              {saved.map((x) => {
                const tk = cases.find((k) => k.ticket_id === x.ticketId)
                const title = x.messages[0]?.q ?? t("New conversation")
                return (
                  <li key={x.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => setSelected(x.id)}
                      aria-current={x.id === conv?.id ? "true" : undefined}
                      className={cn(
                        "flex w-full flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 pr-10 text-left outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                        x.id === conv?.id && "border-primary bg-info-tint"
                      )}
                    >
                      <span className="truncate text-sm font-medium">{title}</span>
                      <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                        <TicketId id={x.ticketId} className="shrink-0 text-xs" />
                        <span className="truncate">{tk?.subject}</span>
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {t(`${x.messages.length} ${x.messages.length === 1 ? "answer" : "answers"}`)}
                        <span className="ml-auto font-mono">{x.updated}</span>
                        {copilot.current(x.ticketId)?.id === x.id ? <Badge variant="info">{t("Current")}</Badge> : null}
                      </span>
                    </button>
                    {x.messages.length ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${t("Delete conversation")}: ${title}`}
                        title={t("Delete")}
                        onClick={() => remove([x.id], t("Conversation deleted"))}
                        className="absolute top-2 right-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-critical-tint hover:text-critical-fg [@media(hover:none)]:opacity-100"
                      >
                        <Trash2Icon aria-hidden="true" />
                      </Button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed bg-card p-4 text-sm text-muted-foreground">{t("No conversations yet.")}</p>
          )}
        </aside>

        <section aria-label={t("Conversation")} className="flex min-w-0 max-w-3xl flex-col gap-4">
          {conv && c ? (
            <>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-balance">{conv.messages[0]?.q ?? t("New conversation")}</h2>
                  {conv.messages.length ? (
                    <Link href={`/tickets?open=${c.ticket_id}`} className="mt-1 inline-flex items-center gap-1 rounded-sm text-[0.8125rem] text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                      <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                      {c.ticket_id}: {c.subject}
                    </Link>
                  ) : (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <Label htmlFor="cp-ticket" className="text-xs text-muted-foreground">
                        {t("About ticket")}
                      </Label>
                      <Select value={c.ticket_id} onValueChange={(v) => copilot.setTicket(conv.id, v)}>
                        <SelectTrigger id="cp-ticket" size="sm" className="max-w-md">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sortQueue(cases, state).map((k) => (
                            <SelectItem key={k.ticket_id} value={k.ticket_id}>
                              {k.ticket_id}: {k.subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                {conv.messages.length ? (
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => remove([conv.id], t("Conversation deleted"))}>
                    <Trash2Icon data-icon="inline-start" aria-hidden="true" />
                    {t("Delete")}
                  </Button>
                ) : null}
              </div>
              <CitationProvider precedents={c.precedents}>
                <AISurface title={t("Ask the copilot")} action={<MockBadge />} generating={conv.messages.some((m) => !m.done)}>
                  {conv.messages.length ? (
                    <CopilotMessages conversation={conv} />
                  ) : (
                    <p className="text-sm text-muted-foreground">{t(`Ask anything about ${c.ticket_id}. Answers come only from the ticket and its past tickets.`)}</p>
                  )}
                  <CopilotComposer ticket={c} inputId="copilot-q" onAsk={(q) => copilot.ask(c.ticket_id, q, conv.id)} />
                </AISurface>
              </CitationProvider>
            </>
          ) : (
            <Empty className="border bg-card">
              <EmptyHeader>
                <EmptyDescription>{t("No conversation selected.")}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={startNew}>
                  <PlusIcon data-icon="inline-start" aria-hidden="true" />
                  {t("New chat")}
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </section>
      </div>
    </>
  )
}
