import type { Metadata } from "next"

import { Console } from "./console"

export const metadata: Metadata = {
  title: "Console · SentinelDesk",
}

export default function ConsolePage() {
  return <Console />
}
