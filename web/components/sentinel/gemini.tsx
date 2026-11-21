import { SparkleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Rendered once in the root layout. Gives SVG icons a Gemini gradient via url(#gemini-gradient).
export function GeminiGradientDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="absolute">
      <defs>
        <linearGradient id="gemini-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--gemini-red)" }} />
          <stop offset="32%" style={{ stopColor: "var(--gemini-yellow)" }} />
          <stop offset="58%" style={{ stopColor: "var(--gemini-green)" }} />
          <stop offset="85%" style={{ stopColor: "var(--gemini-blue)" }} />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Marks content Gemini generated. Never use it as decoration on human or model-free content.
export function GeminiMark({ className, label }: { className?: string; label?: string }) {
  return (
    <SparkleIcon
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "size-4 shrink-0 [&_path]:fill-[url(#gemini-gradient)] [&_path]:stroke-[url(#gemini-gradient)]",
        className
      )}
    />
  )
}

// A card for Gemini output. `generating` animates the edge only while a request is in flight.
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
      className={cn("gemini-edge flex flex-col gap-3 rounded-lg p-4", className)}
    >
      <header className="flex min-h-7 items-center gap-2">
        <GeminiMark />
        <h3 className="text-sm font-medium">{title}</h3>
        {action ? <div className="ml-auto flex items-center gap-1">{action}</div> : null}
      </header>
      {children}
    </section>
  )
}
