import { useId } from "react"
import { cn } from "@/lib/utils"

// SentinelDesk logo: an architect desk lamp whose light carries the AI gradient.
// Static files for slides and docs live in public/brand (logo-light.svg, logo-dark.svg, mark.svg).
export function Logo({
  variant = "tile",
  className,
  label = "SentinelDesk",
  size,
}: {
  /** Pixel size for the tile variant; defaults to 28px via className. */
  size?: number
  /** "tile": square app icon that inverts with the theme. "mark": lamp only, in currentColor. */
  variant?: "tile" | "mark"
  className?: string
  label?: string
}) {
  const id = useId()
  const beam = `${id}-beam`
  const fadeG = `${id}-fade-g`
  const fade = `${id}-fade`
  const ink = variant === "tile" ? "var(--background)" : "currentColor"

  return (
    <svg
      viewBox={variant === "tile" ? "0 0 64 64" : "8 12 50 42"}
      role="img"
      aria-label={label}
      width={size}
      height={size}
      className={cn(variant === "tile" ? (size ? "" : "size-7") : "h-6 w-auto", "shrink-0", className)}
    >
      <defs>
        <linearGradient id={beam} gradientUnits="userSpaceOnUse" x1="42" y1="26" x2="44" y2="50">
          <stop offset="0" stopColor="var(--ai-coral)" />
          <stop offset="0.35" stopColor="var(--ai-rose)" />
          <stop offset="0.7" stopColor="var(--ai-violet)" />
          <stop offset="1" stopColor="var(--ai-blue)" />
        </linearGradient>
        <linearGradient id={fadeG} gradientUnits="userSpaceOnUse" x1="0" y1="24" x2="0" y2="50">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.6" />
        </linearGradient>
        <mask id={fade}>
          <rect width="64" height="64" fill={`url(#${fadeG})`} />
        </mask>
      </defs>
      {variant === "tile" ? <rect width="64" height="64" rx="14" fill="var(--foreground)" /> : null}
      <path d="M39 32.5 L47 23.5 L56 50 H30 Z" fill={`url(#${beam})`} mask={`url(#${fade})`} />
      <path
        d="M20 47 L17 33 L33.5 22.5"
        fill="none"
        stroke={ink}
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="33" r="2.7" fill={ink} />
      <path
        d="M36.6 19.1 L47 23.5 L39 32.5 L33.4 22.9 Z"
        fill={ink}
        stroke={ink}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <rect x="13" y="46" width="14" height="4" rx="2" fill={ink} />
      <path d="M10 51.5 H54" stroke={ink} strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Logo />
      <span className="text-[0.9375rem] font-bold tracking-tight">SentinelDesk</span>
    </span>
  )
}
