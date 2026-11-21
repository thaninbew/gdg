"use client"

import { useEffect, useId, useRef, useState } from "react"
import {
  ArrowRightIcon,
  CheckIcon,
  CircleCheckIcon,
  CopyIcon,
  FileTextIcon,
  FlaskConicalIcon,
  LightbulbIcon,
  MessageCircleQuestionIcon,
  PencilIcon,
  PlusIcon,
  SendIcon,
  ShieldCheckIcon,
  SirenIcon,
  UserRoundIcon,
  UsersRoundIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react"

import { AISurface } from "@/components/sentinel/ai"
import { Wordmark } from "@/components/sentinel/logo"
import { TicketId } from "@/components/sentinel/status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableFooter, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import {
  ACCOUNTS,
  SAMPLES,
  analyze,
  handoff,
  invoiceTotals,
  resolve,
  ticketId,
  type AccountId,
  type Analysis,
  type Invoice,
  type Outcome,
  type Topic,
} from "./logic"

const TOPICS: { id: Topic; label: string; Icon: LucideIcon }[] = [
  { id: "billing", label: "Invoices & documents", Icon: FileTextIcon },
  { id: "broken", label: "Something's broken", Icon: WrenchIcon },
  { id: "question", label: "Ask a question", Icon: MessageCircleQuestionIcon },
  { id: "improvement", label: "Suggest an improvement", Icon: LightbulbIcon },
]

type Ticket = {
  id: string
  text: string
  topic: Topic | null
  answer: string | null
  outcome: Outcome
  solved: boolean
}
type Step = { name: "compose" } | { name: "ask"; analysis: Analysis } | { name: "done"; ticket: Ticket }

const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" })

export function SupportRequest() {
  const [accountId, setAccountId] = useState<AccountId>("weber")
  const [topic, setTopic] = useState<Topic | null>(null)
  const [text, setText] = useState("")
  const [sampleId, setSampleId] = useState<string | null>(null)
  const [step, setStep] = useState<Step>({ name: "compose" })
  const heading = useRef<HTMLHeadingElement>(null)
  const account = ACCOUNTS[accountId]

  // Move focus to the new step's heading so keyboard and screen reader users follow along.
  const stepName = step.name
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    heading.current?.focus()
  }, [stepName])

  function submit(analysis: Analysis, answer: string | null, outcome?: Outcome) {
    setStep({
      name: "done",
      ticket: {
        id: ticketId(text, accountId, sampleId),
        text: text.trim(),
        topic: analysis.topic,
        answer: answer && analysis.question ? `${analysis.question.kind === "invoice" ? "Invoice" : "Affected"}: ${answer.trim()}` : null,
        outcome: outcome ?? resolve(text, analysis, answer, accountId),
        solved: false,
      },
    })
  }

  function send() {
    if (!text.trim()) return
    const analysis = analyze(text, topic, accountId)
    if (analysis.question) setStep({ name: "ask", analysis })
    else submit(analysis, null)
  }

  function loadSample(id: string) {
    const s = SAMPLES.find((x) => x.id === id)
    if (!s) return
    setAccountId(s.account)
    setTopic(s.topic)
    setText(s.text)
    setSampleId(s.id)
    setStep({ name: "compose" })
  }

  function startOver() {
    setTopic(null)
    setText("")
    setSampleId(null)
    setStep({ name: "compose" })
  }

  return (
    <div className="min-h-svh bg-canvas">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Wordmark />
          <span className="text-sm text-muted-foreground">Support</span>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="hidden size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold sm:inline-flex"
            >
              {account.initials}
            </span>
            <span className="hidden min-w-0 truncate text-[0.8125rem] sm:inline">{account.org}</span>
            {account.criticalCare ? (
              <Badge variant="info" className="hidden sm:inline-flex">
                Critical care
              </Badge>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <FlaskConicalIcon data-icon="inline-start" aria-hidden="true" />
                  Demo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Fill a sample</DropdownMenuLabel>
                {SAMPLES.map((s) => (
                  <DropdownMenuItem key={s.id} onSelect={() => loadSample(s.id)}>
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:py-12">
        {step.name === "compose" ? (
          <Composer
            headingRef={heading}
            topic={topic}
            setTopic={(t) => {
              setTopic(t)
              setSampleId(null)
            }}
            text={text}
            setText={setText}
            asks={Boolean(text.trim() && analyze(text, topic, accountId).question)}
            onSend={send}
          />
        ) : null}

        {step.name === "ask" ? (
          <Ask
            headingRef={heading}
            text={text}
            analysis={step.analysis}
            onAnswer={(a) => submit(step.analysis, a)}
            onHuman={() => submit(step.analysis, null, handoff(step.analysis.topic, "You asked for a person."))}
            onEdit={() => setStep({ name: "compose" })}
          />
        ) : null}

        {step.name === "done" ? (
          <Receipt
            headingRef={heading}
            ticket={step.ticket}
            onSolved={() => setStep({ name: "done", ticket: { ...step.ticket, solved: true } })}
            onHuman={() =>
              setStep({
                name: "done",
                ticket: { ...step.ticket, outcome: handoff(step.ticket.topic, "You asked for a person.") },
              })
            }
            onNew={startOver}
          />
        ) : null}

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">Demo</Badge>
          Local rules and sample data. Nothing is sent, paged or charged.
        </p>
      </main>
    </div>
  )
}

function Composer({
  headingRef,
  topic,
  setTopic,
  text,
  setText,
  asks,
  onSend,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>
  topic: Topic | null
  setTopic: (t: Topic | null) => void
  text: string
  setText: (t: string) => void
  asks: boolean
  onSend: () => void
}) {
  const id = useId()
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSend()
      }}
    >
      <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
        How can we help?
      </h1>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={2}
        value={topic ?? ""}
        onValueChange={(v) => setTopic((v || null) as Topic | null)}
        aria-label="Topic, optional"
        className="flex-wrap"
      >
        {TOPICS.map(({ id: t, label, Icon }) => (
          <ToggleGroupItem
            key={t}
            value={t}
            className="data-[state=on]:border-primary data-[state=on]:bg-info-tint data-[state=on]:text-info-fg"
          >
            <Icon data-icon="inline-start" aria-hidden="true" />
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="rounded-lg border bg-card focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <Label htmlFor={id} className="sr-only">
          Your request
        </Label>
        <Textarea
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder="Describe what you need"
          rows={5}
          className="min-h-32 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <div className="flex items-center justify-end gap-2 px-3 pb-3">
          {asks ? (
            <Button type="submit">
              Continue
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" disabled={!text.trim()}>
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Send request
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

function RequestQuote({ text, answer, onEdit }: { text: string; answer?: string | null; onEdit?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[0.8125rem] text-muted-foreground">{text}</p>
        {answer ? <p className="mt-1 text-[0.8125rem]">{answer}</p> : null}
      </div>
      {onEdit ? (
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <PencilIcon data-icon="inline-start" aria-hidden="true" />
          Edit
        </Button>
      ) : null}
    </div>
  )
}

function Ask({
  headingRef,
  text,
  analysis,
  onAnswer,
  onHuman,
  onEdit,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>
  text: string
  analysis: Analysis
  onAnswer: (a: string) => void
  onHuman: () => void
  onEdit: () => void
}) {
  const q = analysis.question!
  const [picked, setPicked] = useState<string | null>(null)
  const [typed, setTyped] = useState("")
  const answer = picked ?? (typed.trim() || null)
  const id = useId()
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`${id}-q`}>
      <RequestQuote text={text} />
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <div>
          <h1 ref={headingRef} id={`${id}-q`} tabIndex={-1} className="text-base font-semibold outline-none">
            {q.prompt}
          </h1>
          <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{q.why}</p>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (answer) onAnswer(answer)
          }}
        >
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            value={picked ?? ""}
            onValueChange={(v) => {
              setPicked(v || null)
              if (v) setTyped("")
            }}
            aria-labelledby={`${id}-q`}
            className="flex-wrap"
          >
            {q.options.map((o) => (
              <ToggleGroupItem
                key={o}
                value={o}
                className={`data-[state=on]:border-primary data-[state=on]:bg-info-tint data-[state=on]:text-info-fg ${q.kind === "invoice" ? "font-mono" : ""}`}
              >
                {o}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {q.kind === "invoice" ? (
            <div>
              <Label htmlFor={`${id}-other`} className="sr-only">
                Other invoice number
              </Label>
              <Input
                id={`${id}-other`}
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value)
                  setPicked(null)
                }}
                placeholder="Other invoice number"
                className="max-w-56 font-mono"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <Button type="submit" disabled={!answer}>
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Send request
            </Button>
            <Button type="button" variant="ghost" onClick={onHuman}>
              <UserRoundIcon data-icon="inline-start" aria-hidden="true" />
              Send to a person
            </Button>
            <Button type="button" variant="ghost" onClick={onEdit} className="sm:ml-auto">
              <PencilIcon data-icon="inline-start" aria-hidden="true" />
              Edit request
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}

function Receipt({
  headingRef,
  ticket,
  onSolved,
  onHuman,
  onNew,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>
  ticket: Ticket
  onSolved: () => void
  onHuman: () => void
  onNew: () => void
}) {
  const [copied, setCopied] = useState(false)
  const o = ticket.outcome
  const selfServe = o.kind === "action" || o.kind === "answer"
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <CircleCheckIcon className="size-5 shrink-0 text-success" aria-hidden="true" />
        <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          Request received
        </h1>
        <span className="ml-auto inline-flex items-center gap-1 rounded-md border bg-card py-0.5 pr-0.5 pl-2">
          <TicketId id={ticket.id} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={copied ? "Copied" : `Copy ticket ID ${ticket.id}`}
                onClick={() => {
                  void navigator.clipboard?.writeText(ticket.id).catch(() => {})
                  setCopied(true)
                }}
              >
                {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? "Copied" : "Copy ticket ID"}</TooltipContent>
          </Tooltip>
        </span>
      </div>

      <RequestQuote text={ticket.text} answer={ticket.answer} />

      <div role="status" className="flex flex-col gap-4">
        {o.kind === "urgent" ? <Urgent reasons={o.reasons} /> : null}
        {o.kind === "action" ? <Breakdown invoice={o.invoice} previous={o.previous} /> : null}
        {o.kind === "answer" ? <Answer sentences={o.sentences} /> : null}
        {o.kind === "handoff" ? <Handoff team={o.team} reason={o.reason} /> : null}
        {o.kind === "review" ? <Review /> : null}
      </div>

      {selfServe ? (
        ticket.solved ? (
          <p className="flex items-center gap-2 text-sm text-success-fg">
            <CheckIcon className="size-4" aria-hidden="true" />
            Marked solved
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button onClick={onSolved}>
              <CheckIcon data-icon="inline-start" aria-hidden="true" />
              This solves it
            </Button>
            <Button variant="outline" onClick={onHuman}>
              <UserRoundIcon data-icon="inline-start" aria-hidden="true" />
              Talk to a person
            </Button>
          </div>
        )
      ) : null}

      <div>
        <Button variant="ghost" size="sm" onClick={onNew}>
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          New request
        </Button>
      </div>
    </section>
  )
}

function Urgent({ reasons }: { reasons: string[] }) {
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
      <p className="mt-2 ml-6 text-[0.8125rem]">An engineer will contact you.</p>
    </div>
  )
}

function Breakdown({ invoice, previous }: { invoice: Invoice; previous: Invoice | null }) {
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
        <p className="mt-3 rounded-md bg-info-tint px-3 py-2 text-[0.8125rem] text-info-fg">
          New since {previous.period.split(" ")[0]}: {added.map((l) => `${l.item} (${eur.format(l.qty * l.unit)})`).join(", ")}
        </p>
      ) : null}
    </div>
  )
}

function Answer({ sentences }: { sentences: { text: string; source: { id: string; subject: string } }[] }) {
  const sources = [...new Map(sentences.map((s) => [s.source.id, s.source])).values()]
  return (
    <AISurface
      title="Suggested fix"
      action={<Badge variant="outline">From {sources.length === 1 ? "1 past ticket" : `${sources.length} past tickets`}</Badge>}
    >
      <p className="text-[0.9375rem] leading-relaxed">
        {sentences.map((s, i) => (
          <span key={i}>
            {s.text}{" "}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-sm border px-1 align-baseline font-mono text-xs text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label={`Source ${s.source.id}: ${s.source.subject}`}
                >
                  {s.source.id}
                </button>
              </TooltipTrigger>
              <TooltipContent>{s.source.subject}</TooltipContent>
            </Tooltip>{" "}
          </span>
        ))}
      </p>
    </AISurface>
  )
}

function Handoff({ team, reason }: { team: string; reason: string }) {
  return (
    <div className="rounded-lg bg-info-tint p-4 text-info-fg">
      <div className="flex items-center gap-2">
        <UsersRoundIcon className="size-4 shrink-0" aria-hidden="true" />
        <p className="text-sm font-semibold">With our {team} team</p>
      </div>
      <p className="mt-1 ml-6 text-[0.8125rem]">{reason} We&apos;ll reply by email.</p>
    </div>
  )
}

const REVIEW_STEPS = [
  { label: "Received", note: null, done: true },
  { label: "Grouped with similar requests", note: "3 similar", done: true },
  { label: "Product review", note: "Shortlisted for planning", done: false },
]

function Review() {
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
