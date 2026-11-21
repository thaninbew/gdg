import { notFound } from "next/navigation"

import { TICKETS } from "@/lib/fixtures"
import { TicketDetail } from "./detail"

export default async function TicketPage({ params }: PageProps<"/tickets/[id]">) {
  const { id } = await params
  if (!TICKETS.some((t) => t.ticket_id === id)) notFound()
  return <TicketDetail id={id} />
}
