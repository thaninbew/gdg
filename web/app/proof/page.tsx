import type { Metadata } from "next"

import { Proof } from "./proof"

export const metadata: Metadata = {
  title: "Proof · SentinelDesk",
}

export default function ProofPage() {
  return <Proof />
}
