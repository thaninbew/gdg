import type { Metadata } from "next"

import { SupportRequest } from "./support-request"

export const metadata: Metadata = {
  title: "Support · SentinelDesk",
}

export default function SubmitPage() {
  return <SupportRequest />
}
