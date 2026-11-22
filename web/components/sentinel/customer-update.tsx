import { CheckCircle2Icon, MessageCircleQuestionIcon, SirenIcon, UsersRoundIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { customerView, type CustomerPost } from "@/lib/customer-view"
import type { Language } from "@/lib/types"
import { cn } from "@/lib/utils"

const TONE = {
  received: "outline",
  working: "outline",
  "needs-you": "warning",
  answered: "success",
  "with-team": "info",
  urgent: "critical",
} as const

const COPY = {
  en: { reply: "Reply from support", question: "We need one detail", urgent: "Our on-call team has it.", team: "We've passed this to the right team.", none: "No updates yet." },
  de: { reply: "Antwort vom Support", question: "Wir brauchen eine Angabe", urgent: "Unser Bereitschaftsteam kümmert sich darum.", team: "Wir haben das an das zuständige Team übergeben.", none: "Noch keine Neuigkeiten." },
}

// The customer's view of a ticket: status plus whatever an operator sent. Used on the customer's
// page and as the "Customer sees" preview in the console, so both always match.
export function CustomerUpdate({ posts, lang, className }: { posts: CustomerPost[]; lang: Language; className?: string }) {
  const view = customerView(posts, lang)
  const t = COPY[lang]
  return (
    <div className={cn("flex flex-col gap-3", className)} lang={lang}>
      <Badge variant={TONE[view.status]} className="self-start">
        {view.label}
      </Badge>
      {posts.length ? (
        <ol className="flex flex-col gap-2">
          {posts.map((p, i) => (
            <li key={i} className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {p.kind === "reply" ? (
                  <CheckCircle2Icon className="size-3.5 text-success-fg" aria-hidden="true" />
                ) : p.kind === "question" ? (
                  <MessageCircleQuestionIcon className="size-3.5 text-warning-fg" aria-hidden="true" />
                ) : p.urgent ? (
                  <SirenIcon className="size-3.5 text-critical-fg" aria-hidden="true" />
                ) : (
                  <UsersRoundIcon className="size-3.5" aria-hidden="true" />
                )}
                <span className="font-medium text-foreground">
                  {p.kind === "reply" ? t.reply : p.kind === "question" ? t.question : p.urgent ? t.urgent : t.team}
                </span>
                <span className="ml-auto font-mono">{p.at}</span>
              </div>
              {p.kind !== "assigned" ? <p className="mt-2 text-[0.8125rem] leading-relaxed whitespace-pre-line">{p.text}</p> : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[0.8125rem] text-muted-foreground">{t.none}</p>
      )}
    </div>
  )
}
