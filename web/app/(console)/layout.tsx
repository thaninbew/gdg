import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sentinel/app-sidebar"
import { CaseStoreProvider } from "@/lib/case-store"

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <CaseStoreProvider>
      <SidebarProvider
        style={{ "--sidebar-width": "calc(var(--spacing) * 60)", "--header-height": "calc(var(--spacing) * 14)" } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-canvas">{children}</SidebarInset>
      </SidebarProvider>
    </CaseStoreProvider>
  )
}
