"use client"

import * as React from "react"
import { MessageCircleQuestionIcon, SendIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AISurface } from "@/components/sentinel/ai"
import type { Clarification } from "@/lib/types"

const FIELD_LABEL = { type: "Type", queue: "Queue", priority: "Priority", context: "Context" } as const

// Shown instead of a draft while a triage field is Ambiguous. The answer re-runs the gate.
export function ClarifyingQuestion({
  question,
  step,
  total,
  onAnswer,
}: {
  question: Clarification
  step: number
  total: number
  onAnswer: (optionIndex: number | null, freeText?: string) => void
}) {
  const [text, setText] = React.useState("")
  const id = React.useId()

  return (
    <AISurface
      title="Clarify before drafting"
      action={
        <span className="font-mono text-xs text-muted-foreground">
          {step}/{total}
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2">
          <MessageCircleQuestionIcon className="mt-0.5 size-4 shrink-0 text-warning-fg" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{FIELD_LABEL[question.field]} is ambiguous</p>
            <p className="mt-1 text-base font-semibold text-balance">{question.question}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {question.options.map((o, i) => (
            <Button key={o.label} variant="outline" onClick={() => onAnswer(i)}>
              {o.label}
            </Button>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return
            onAnswer(null, text.trim())
            setText("")
          }}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label htmlFor={id} className="text-xs text-muted-foreground">
              Other answer
            </Label>
            <Input id={id} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <Button type="submit" variant="secondary" disabled={!text.trim()}>
            Answer
          </Button>
        </form>
        <Button
          variant="link"
          className="h-auto self-start p-0"
          onClick={() => toast("Question sent to requester", { description: question.ask_requester })}
        >
          <SendIcon data-icon="inline-start" aria-hidden="true" />
          Ask requester
        </Button>
      </div>
    </AISurface>
  )
}
