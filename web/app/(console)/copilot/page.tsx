import { Suspense } from "react"

import Loading from "../loading"
import { CopilotPage } from "./copilot"

// ?c=<conversation> opens a saved conversation; ?ticket=<id> starts one about that ticket.
export default function Page({ searchParams }: PageProps<"/copilot">) {
  return (
    <Suspense fallback={<Loading />}>
      <FromParams searchParams={searchParams} />
    </Suspense>
  )
}

async function FromParams({ searchParams }: Pick<PageProps<"/copilot">, "searchParams">) {
  const sp = await searchParams
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null
  return <CopilotPage conversation={one(sp.c)} ticket={one(sp.ticket)} />
}
