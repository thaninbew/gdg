import { Skeleton } from "@/components/ui/skeleton"

// Route-level loading state for the console: skeletons shaped like a header and a list of rows.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="flex h-(--header-height) items-center gap-3 border-b px-4 lg:px-6">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <Skeleton className="h-7 w-80" />
        <div className="flex flex-col gap-px overflow-hidden rounded-lg border">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-10 rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}
