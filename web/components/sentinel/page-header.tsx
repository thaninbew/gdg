"use client"

import { useI18n } from "@/lib/i18n"

// Page title row under the top navigation, with actions on the right.
export function PageHeader({ title, actions }: { title: React.ReactNode; actions?: React.ReactNode }) {
  const { t } = useI18n()
  return (
    <header className="sticky top-(--topbar) z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background px-4 lg:px-6">
      <h1 className="min-w-0 truncate text-xl font-semibold">{typeof title === "string" ? t(title) : title}</h1>
      {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}
