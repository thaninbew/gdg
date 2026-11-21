import { Suspense } from "react"

import Loading from "../loading"
import { Inbox } from "./inbox"

// Filters come from the URL, which is only known at request time, so they stream in behind the skeleton.
export default function TicketsPage({ searchParams }: PageProps<"/tickets">) {
  return (
    <Suspense fallback={<Loading />}>
      <InboxFromParams searchParams={searchParams} />
    </Suspense>
  )
}

async function InboxFromParams({ searchParams }: Pick<PageProps<"/tickets">, "searchParams">) {
  const sp = await searchParams
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null
  return <Inbox queue={one(sp.queue)} category={one(sp.category)} status={one(sp.status)} />
}
