import { PageHeader } from "@/components/sentinel/page-header"
import { TicketFinder } from "@/components/sentinel/ticket-finder"

export default function Page() {
  return (
    <>
      <PageHeader title="Find a ticket" />
      <TicketFinder />
    </>
  )
}
