import type { Metadata } from "next"
import { Manrope } from "next/font/google"

import "./dir-a.css"

const manrope = Manrope({
  variable: "--font-dir-a-manrope",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
})

export const metadata: Metadata = { title: "A · Command Center · SentinelDesk" }

export default function DirectionALayout({ children }: { children: React.ReactNode }) {
  return <div className={`dir-a ${manrope.variable} min-h-svh bg-canvas font-sans text-foreground`}>{children}</div>
}
