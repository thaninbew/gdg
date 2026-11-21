import { TopNav } from "@/components/sentinel/top-nav"
import { CaseStoreProvider } from "@/lib/case-store"
import { CopilotProvider } from "@/lib/copilot-store"
import { I18nProvider } from "@/lib/i18n"

// Console shell: navigation across the top, page content below.
export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
    <CaseStoreProvider>
    <CopilotProvider>
      <div className="flex min-h-svh flex-col bg-canvas [--header-height:3.5rem] [--topbar:3.25rem]">
        <TopNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </CopilotProvider>
    </CaseStoreProvider>
    </I18nProvider>
  )
}
