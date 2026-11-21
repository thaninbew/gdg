"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const subscribeNoop = () => () => {}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // The stored theme is only known on the client; render no selection during SSR.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false)

  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={mounted ? (theme ?? "") : ""}
      onValueChange={(v) => v && setTheme(v)}
      aria-label="Color theme"
    >
      <ToggleGroupItem value="light" aria-label="Light theme">
        <SunIcon aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark theme">
        <MoonIcon aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="System theme">
        <MonitorIcon aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
