import Link from "next/link"
import { ArrowRightIcon, TriangleAlertIcon } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"

// Reference mockups, not product pages. Each was a fast exploration with its own palette and
// fixtures; borrow patterns from them into real pages that follow DESIGN.md.
const REFERENCES = [
  { href: "/references/d", name: "D · Copilot Canvas", take: "Overall look, AI gradient, grounded reply with citations" },
  { href: "/references/c", name: "C · Ops Observatory", take: "Charts: volume, calibration, risk dial, KPI sparklines" },
  { href: "/references/a", name: "A · Command Center", take: "Queue, detail and AI panel layout; Manrope" },
  { href: "/references/b", name: "B · Triage Inbox", take: "Keyboard triage, accept or override suggestions" },
]

export default function ReferencesPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">References</h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>
      <p className="flex items-start gap-2 rounded-lg bg-warning-tint px-3 py-2.5 text-sm text-warning-fg">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Rough explorations, not finished pages. Their palettes, copy and data are placeholders.
      </p>
      <ul className="flex flex-col divide-y rounded-lg border bg-card">
        {REFERENCES.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="flex items-center gap-4 px-4 py-3 transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-[0.8125rem] text-muted-foreground">Take: {r.take}</p>
              </div>
              <ArrowRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
