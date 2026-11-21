import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, CopyIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ThemeToggle } from "@/components/theme-toggle"
import { AISurface, AIMark } from "@/components/sentinel/ai"
import { ConfidenceMeter } from "@/components/sentinel/confidence"
import { EscalationStatus, PriorityBadge, TicketId } from "@/components/sentinel/status"
import { autoDraftBilling, escalatedOutage } from "@/lib/mock"

export const metadata: Metadata = { title: "Design system · SentinelDesk" }

const SWATCHES = [
  { group: "AI", items: ["ai-coral", "ai-rose", "ai-violet", "ai-blue"] },
  { group: "Status", items: ["critical", "warning", "success", "info"] },
  { group: "Tints", items: ["critical-tint", "warning-tint", "success-tint", "info-tint"] },
  { group: "Neutral", items: ["canvas", "card", "muted", "border", "muted-foreground", "foreground"] },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border bg-card p-4 ${className}`}>{children}</div>
}

export default function DesignPage() {
  const t = escalatedOutage.triage
  return (
    <div className="min-h-svh bg-canvas">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <AIMark />
          <h1 className="text-base font-semibold">SentinelDesk design system</h1>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/references" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
              References <ArrowRightIcon className="size-3.5" aria-hidden="true" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
        <Section title="Color">
          <Panel className="grid gap-5">
            {SWATCHES.map(({ group, items }) => (
              <div key={group} className="grid gap-2 sm:grid-cols-[96px_1fr] sm:items-center">
                <p className="text-xs text-muted-foreground">{group}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {items.map((token) => (
                    <div key={token} className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-8 shrink-0 rounded-md border"
                        style={{ background: `var(--${token})` }}
                        aria-hidden="true"
                      />
                      <span className="truncate font-mono text-xs">{token}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-[96px_1fr] sm:items-center">
              <p className="text-xs text-muted-foreground">AI only</p>
              <div className="flex items-center gap-3">
                <span className="h-8 w-48 rounded-md" style={{ background: "var(--ai-gradient)" }} />
                <span className="font-mono text-xs">ai-gradient</span>
              </div>
            </div>
          </Panel>
        </Section>

        <Section title="Type">
          <Panel className="grid gap-3">
            <p className="text-xl font-semibold">Page title · Manrope 20 semibold</p>
            <p className="text-sm font-medium">Panel title · 14 medium</p>
            <p className="text-sm">Body · 14 regular. Since 08:10 our whole clinic cannot connect to the VPN.</p>
            <p className="text-[0.8125rem] text-muted-foreground">Metadata · 13 muted · Technical Support · 2 min ago</p>
            <p className="font-mono text-[0.8125rem]">Google Sans Code · TKT-04187 · 0.89 · 1,614 ms</p>
          </Panel>
        </Section>

        <Section title="Status">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority="high" />
                <PriorityBadge priority="medium" />
                <PriorityBadge priority="low" />
                <Badge variant="info">Incident</Badge>
                <Badge variant="outline">Mock</Badge>
                <Badge variant="secondary">de</Badge>
              </div>
              <div className="grid gap-2 text-sm">
                {[
                  ["Type", t.type, t.type_conf],
                  ["Queue", t.queue, t.queue_conf],
                  ["Priority", t.priority, t.priority_conf],
                  ["Queue (weak)", "Customer Service", 0.48],
                ].map(([label, value, conf]) => (
                  <div key={label as string} className="grid grid-cols-[96px_1fr_auto] items-center gap-3">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="truncate capitalize">{value}</span>
                    <ConfidenceMeter value={conf as number} label={label as string} />
                  </div>
                ))}
              </div>
            </Panel>
            <div className="flex flex-col gap-3">
              <EscalationStatus escalate reasons={escalatedOutage.reasons} />
              <EscalationStatus escalate={false} reasons={[]} />
            </div>
          </div>
        </Section>

        <Section title="AI output">
          <div className="grid gap-4 md:grid-cols-2">
            <AISurface
              title="Draft reply"
              action={
                <Button variant="ghost" size="icon-sm" aria-label="Copy draft">
                  <CopyIcon aria-hidden="true" />
                </Button>
              }
            >
              <p className="text-sm leading-relaxed">{autoDraftBilling.draft.reply}</p>
              <p className="text-xs text-muted-foreground">
                Cites <TicketId id="TKT-07731" /> and <TicketId id="TKT-03318" />
              </p>
            </AISurface>
            <AISurface title="Drafting" generating>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-11/12" />
                <Skeleton className="h-3.5 w-3/5" />
              </div>
            </AISurface>
          </div>
        </Section>

        <Section title="Buttons">
          <Panel className="flex flex-wrap items-center gap-2">
            <Button>Approve and send</Button>
            <Button variant="outline">Edit draft</Button>
            <Button variant="destructive">Escalate</Button>
            <Button variant="ghost">Dismiss</Button>
            <Button disabled>Disabled</Button>
          </Panel>
        </Section>
      </main>
    </div>
  )
}
