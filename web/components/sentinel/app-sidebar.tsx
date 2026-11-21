"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChartColumnIcon, InboxIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/sentinel/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { useCases } from "@/lib/case-store"
import { outcome } from "@/lib/gate"

type NavItem = { href: string; label: string; Icon: typeof InboxIcon; badge?: number }

export function AppSidebar() {
  const { cases, state } = useCases()
  const open = cases.filter((c) => outcome(c, state[c.ticket_id]) !== "draft").length

  const nav: NavItem[] = [
    { href: "/tickets", label: "Inbox", Icon: InboxIcon, badge: open },
    { href: "/dashboard", label: "Dashboard", Icon: ChartColumnIcon },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/tickets">
                <Logo className="size-8" />
                <span className="font-semibold">SentinelDesk</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {/* The active item depends on the URL, so it streams in; the placeholder is the same menu unhighlighted. */}
            <Suspense fallback={<NavMenu nav={nav} pathname={null} />}>
              <ActiveNavMenu nav={nav} />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <ThemeToggle />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function ActiveNavMenu({ nav }: { nav: NavItem[] }) {
  return <NavMenu nav={nav} pathname={usePathname()} />
}

function NavMenu({ nav, pathname }: { nav: NavItem[]; pathname: string | null }) {
  return (
    <SidebarMenu>
      {nav.map(({ href, label, Icon, badge }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton asChild isActive={!!pathname?.startsWith(href)} tooltip={label}>
            <Link href={href}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          </SidebarMenuButton>
          {badge ? <SidebarMenuBadge className="font-mono">{badge}</SidebarMenuBadge> : null}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
