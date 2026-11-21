import { Logo } from "@/components/sentinel/logo"

export default function DemoTitle() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas px-4 py-12">
      <div className="flex max-w-xl lg:max-w-2xl flex-col items-center gap-6 text-center">
        <Logo size={72} className="md:size-24" />
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">SentinelDesk</h1>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg lg:text-xl">
            Answers support tickets with evidence from past cases, and hands the rest to an engineer.
          </p>
        </div>
      </div>
    </main>
  )
}
