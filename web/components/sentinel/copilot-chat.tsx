"use client"

import * as React from "react"
import Link from "next/link"
import { Maximize2Icon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { AISurface } from "@/components/sentinel/ai"
import { MockBadge } from "@/components/sentinel/case-outcome"
import { CitedText } from "@/components/sentinel/grounded-reply"
import { suggestionsFor, type Conversation } from "@/lib/copilot"
import { useCopilot } from "@/lib/copilot-store"
import { useI18n } from "@/lib/i18n"
import type { TicketCase } from "@/lib/types"

/** Questions and answers of one conversation, in the console language. Needs a CitationProvider. */
export function CopilotMessages({ conversation }: { conversation: Conversation }) {
  const { lang } = useI18n()
  return (
    <ol className="flex flex-col gap-3">
      {conversation.messages.map((m, i) => (
        <li key={i} className="flex flex-col gap-1.5 border-b pb-3 last:border-b-0 last:pb-0">
          <p className="self-end rounded-md bg-secondary px-2 py-1 text-sm font-medium">{m.q}</p>
          {m.done ? (
            <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line" lang={lang}>
              <StreamedText text={m.a[lang]} streamKey={m.live ? `${conversation.id}:${i}` : null} />
            </p>
          ) : (
            <div className="flex flex-col gap-2 py-1" aria-busy="true">
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

// Reveals a fresh answer word by word, the way the model streams it. Answers from history, a
// language switch after streaming, and reduced motion all show the full text at once.
const streamed = new Set<string>()
function StreamedText({ text, streamKey }: { text: string; streamKey: string | null }) {
  const words = React.useMemo(() => text.split(/(?<=\s)/), [text])
  const [shown, setShown] = React.useState(() =>
    streamKey && !streamed.has(streamKey) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : Infinity
  )
  React.useEffect(() => {
    if (shown >= words.length) {
      if (streamKey) streamed.add(streamKey)
      return
    }
    const id = window.setTimeout(() => setShown((n) => n + 2), 35)
    return () => window.clearTimeout(id)
  }, [shown, words.length, streamKey])
  if (shown >= words.length) return <CitedText text={text} />
  return (
    <span aria-busy="true">
      <CitedText text={words.slice(0, shown).join("")} />
      <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-[1px] bg-muted-foreground/60 align-middle" aria-hidden="true" />
    </span>
  )
}

/** Suggested questions plus a free question box. */
export function CopilotComposer({ ticket, onAsk, inputId }: { ticket: TicketCase; onAsk: (q: string) => void; inputId: string }) {
  const { lang, t } = useI18n()
  const [text, setText] = React.useState("")
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {suggestionsFor(ticket, lang).map((s) => (
          <Button key={s} variant="outline" size="sm" onClick={() => onAsk(s)}>
            {s}
          </Button>
        ))}
      </div>
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!text.trim()) return
          onAsk(text.trim())
          setText("")
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Label htmlFor={inputId} className="text-xs text-muted-foreground">
            {t("Question about this ticket")}
          </Label>
          <Input id={inputId} value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
        </div>
        <Button type="submit" variant="secondary" disabled={!text.trim()}>
          {t("Ask")}
        </Button>
      </form>
    </div>
  )
}

/** "Ask the copilot" on a ticket: one question here, follow-ups continue on the Copilot page. */
export function TicketCopilot({ ticket }: { ticket: TicketCase }) {
  const copilot = useCopilot()
  const { t } = useI18n()
  const conv = copilot.current(ticket.ticket_id)
  const asked = !!conv?.messages.length
  const answered = asked && conv.messages.every((m) => m.done)

  return (
    <AISurface
      title={t("Ask the copilot")}
      generating={asked && !answered}
      action={
        <>
          {asked ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const undo = copilot.newChat(ticket.ticket_id)
                  toast(t("Started a new chat"), { description: t("The previous one is in Copilot."), action: { label: t("Undo"), onClick: undo } })
                }}
              >
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                {t("New chat")}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("Delete this conversation")}
                title={t("Delete")}
                onClick={() => {
                  const undo = copilot.remove([conv.id])
                  toast(t("Conversation deleted"), { action: { label: t("Undo"), onClick: undo } })
                }}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </>
          ) : null}
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={conv ? `/copilot?c=${conv.id}` : `/copilot?ticket=${ticket.ticket_id}`} aria-label={t("Open in Copilot")} title={t("Open in Copilot")}>
              <Maximize2Icon aria-hidden="true" />
            </Link>
          </Button>
          <MockBadge />
        </>
      }
    >
      {asked ? (
        <>
          <CopilotMessages conversation={conv} />
          {answered ? (
            <Button size="sm" className="self-end" asChild>
              <Link href={`/copilot?c=${conv.id}`}>
                <Maximize2Icon data-icon="inline-start" aria-hidden="true" />
                {t("Continue in Copilot")}
              </Link>
            </Button>
          ) : null}
        </>
      ) : (
        <CopilotComposer ticket={ticket} inputId={`ask-${ticket.ticket_id}`} onAsk={(q) => copilot.ask(ticket.ticket_id, q)} />
      )}
    </AISurface>
  )
}
