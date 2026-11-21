import { notFound } from "next/navigation"

import { TICKETS } from "@/lib/fixtures"
import { DEMO_CASES } from "./demo-cases"
import { TicketDetail } from "./detail"

export default async function TicketPage({ params }: PageProps<"/tickets/[id]">) {
  const { id } = await params
  if (![...TICKETS, ...DEMO_CASES].some((t) => t.ticket_id === id)) notFound()
  return <TicketDetail id={id} />
}
