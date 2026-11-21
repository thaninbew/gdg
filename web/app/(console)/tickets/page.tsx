import { Inbox } from "./inbox"

export default async function TicketsPage({ searchParams }: PageProps<"/tickets">) {
  const sp = await searchParams
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null
  return <Inbox queue={one(sp.queue)} category={one(sp.category)} status={one(sp.status)} />
}
