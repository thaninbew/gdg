import type { Metadata } from "next"
import { Suspense } from "react"

import { Console } from "./console"

export const metadata: Metadata = {
  title: "Console · SentinelDesk",
}

export default function ConsolePage() {
  return <Suspense><Console /></Suspense>
}
