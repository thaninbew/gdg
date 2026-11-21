import type { Metadata } from "next"

import { DIR_B } from "./font"
import "./dir-b.css"

export const metadata: Metadata = {
  title: "Triage Inbox · SentinelDesk",
  description: "Direction B: keyboard-first triage inbox with accept-or-override AI suggestions.",
}

export default function DirectionBLayout({ children }: LayoutProps<"/references/b">) {
  return <div className={`${DIR_B} min-h-svh bg-canvas text-foreground antialiased`}>{children}</div>
}
