import { PenLineIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Our AI mark: a flat navy squircle with a pen. Marks model-generated content only.
export function AIMark({ className, label }: { className?: string; label?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-ai-mark",
        className
      )}
    >
      <PenLineIcon className="size-3.5 text-white" strokeWidth={2.25} />
    </span>
  )
}

// A card for model output. `generating` animates the strip only while a request is in flight.
export function AISurface({
  title,
  action,
  generating = false,
  className,
  children,
}: {
  title: React.ReactNode
  action?: React.ReactNode
  generating?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-busy={generating}
      data-generating={generating}
      className={cn("ai-surface flex flex-col gap-3 rounded-xl p-5", className)}
    >
      <header className="flex min-h-7 items-center gap-2.5">
        <AIMark />
        <h3 className="text-sm font-semibold">{title}</h3>
        {action ? <div className="ml-auto flex items-center gap-1">{action}</div> : null}
      </header>
      {children}
    </section>
  )
}
