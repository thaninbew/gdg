import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"

import "./dir-d.css"

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
})

export const metadata: Metadata = {
  title: "Copilot Canvas · SentinelDesk",
}

export default function DirectionDLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${jakarta.variable} dir-d min-h-svh bg-canvas text-foreground`}>{children}</div>
}
