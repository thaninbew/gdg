import { Suspense } from "react"
import { notFound } from "next/navigation"

import Loading from "../../loading"
import { TicketDetail } from "./detail"

export default function TicketPage({ params }: PageProps<"/tickets/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <TicketFromParams params={params} />
    </Suspense>
  )
}

async function TicketFromParams({ params }: Pick<PageProps<"/tickets/[id]">, "params">) {
  const { id } = await params
  // Demo tickets and a customer's live ticket (presenter mode) both resolve on the client.
  if (!/^TKT-\d{5}$/.test(id)) notFound()
  return <TicketDetail id={id} />
}
