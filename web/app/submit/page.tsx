import type { Metadata } from "next"

import { RequestForm } from "./request-form"

export const metadata: Metadata = {
  title: "Support · SentinelDesk",
}

export default function SubmitPage() {
  return <RequestForm />
}
