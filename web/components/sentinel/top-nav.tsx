"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChartColumnIcon, InboxIcon, MessagesSquareIcon, SearchIcon, type LucideIcon } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Logo } from "@/components/sentinel/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { useCases } from "@/lib/case-store"
import { useCopilot } from "@/lib/copilot-store"
import { outcome } from "@/lib/gate"
import { useI18n } from "@/lib/i18n"
import type { Language } from "@/lib/types"
import { cn } from "@/lib/utils"

type NavItem = { href: string; label: string; Icon: LucideIcon; count?: number }

// Console navigation across the top of every console page.
export function TopNav() {
  const { cases, state } = useCases()
  const { lang, setLang, t } = useI18n()
  const chats = useCopilot().conversations.filter((c) => c.messages.length).length
  const open = cases.filter((c) => outcome(c, state[c.ticket_id]) !== "draft").length
  const nav: NavItem[] = [
    { href: "/tickets", label: t("Inbox"), Icon: InboxIcon, count: open },
    { href: "/find", label: t("Find a ticket"), Icon: SearchIcon },
    { href: "/copilot", label: "Copilot", Icon: MessagesSquareIcon, count: chats },
    { href: "/dashboard", label: t("Dashboard"), Icon: ChartColumnIcon },
  ]

  return (
    <header className="sticky top-0 z-30 flex h-(--topbar) shrink-0 items-center gap-1 border-b bg-sidebar px-4">
      <Link
        href="/tickets"
        className="mr-3 flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Logo className="size-7" />
        <span className="hidden text-[0.9375rem] font-bold tracking-tight sm:inline">SentinelDesk</span>
      </Link>
      <nav aria-label="Console" className="flex items-center gap-1">
        {/* The active item depends on the URL, so it streams in; the placeholder is the same links unhighlighted. */}
        <Suspense fallback={<NavLinks nav={nav} pathname={null} />}>
          <ActiveNavLinks nav={nav} />
        </Suspense>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        {/* Switches every console label and the copilot's answers; customer messages stay as written. */}
        <Select value={lang} onValueChange={(v) => setLang(v as Language)}>
          <SelectTrigger size="sm" aria-label={t("Language")} className="w-auto gap-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="de">Deutsch</SelectItem>
          </SelectContent>
        </Select>
        <PaletteSelect />
        <ThemeToggle />
      </div>
    </header>
  )
}

function ActiveNavLinks({ nav }: { nav: NavItem[] }) {
  return <NavLinks nav={nav} pathname={usePathname()} />
}

function NavLinks({ nav, pathname }: { nav: NavItem[]; pathname: string | null }) {
  return nav.map(({ href, label, Icon, count }) => {
    const active = !!pathname?.startsWith(href)
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-8 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-muted-foreground outline-none transition-colors duration-150 hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          active && "bg-sidebar-accent text-foreground"
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{label}</span>
        {count ? <span className="font-mono text-xs text-muted-foreground">{count}</span> : null}
      </Link>
    )
  })
}

type Palette = "dusk" | "lime"
// Dusk is the design system; Lime is the Material 3 seed palette. Remembered per browser.
const readPalette = (): Palette => {
  try {
    return localStorage.getItem("palette") === "lime" ? "lime" : "dusk"
  } catch {
    return "dusk"
  }
}
const onPalette = (cb: () => void) => {
  window.addEventListener("palette", cb)
  return () => window.removeEventListener("palette", cb)
}
function PaletteSelect() {
  const { t } = useI18n()
  const palette = React.useSyncExternalStore(onPalette, readPalette, () => "dusk" as Palette)
  React.useEffect(() => {
    document.documentElement.classList.toggle("palette-lime", palette === "lime")
  }, [palette])
  const choose = (v: Palette) => {
    try {
      localStorage.setItem("palette", v)
    } catch {}
    window.dispatchEvent(new Event("palette"))
  }
  return (
    <Select value={palette} onValueChange={(v) => choose(v as Palette)}>
      <SelectTrigger size="sm" aria-label={t("Palette")} className="hidden w-auto gap-1.5 md:flex">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="dusk">Dusk</SelectItem>
        <SelectItem value="lime">Lime</SelectItem>
      </SelectContent>
    </Select>
  )
}
