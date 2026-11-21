import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./dir-c.css"

const sans = Geist({ variable: "--font-dirc-sans", subsets: ["latin"] })
const mono = Geist_Mono({ variable: "--font-dirc-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ops Observatory · SentinelDesk",
}

export default function DirectionCLayout({ children }: LayoutProps<"/references/c">) {
  return (
    <div className={`dir-c ${sans.variable} ${mono.variable} min-h-svh bg-canvas font-sans text-foreground`}>
      {children}
    </div>
  )
}
