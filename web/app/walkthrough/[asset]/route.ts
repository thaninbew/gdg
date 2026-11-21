import { readFile } from "node:fs/promises"
import path from "node:path"

// Serves the original docs/demo walkthrough from this app's origin, so one `pnpm dev` runs the whole guided
// demo: /walkthrough/index.html -> Get a demo -> Support / Console / Factory Run / Factory Finding.
// Only these files, read as-is from docs/demo; anything else is a 404.
const FILES: Record<string, string> = {
  "index.html": "text/html; charset=utf-8",
  "demo.html": "text/html; charset=utf-8",
  "factory.html": "text/html; charset=utf-8",
  "sd-motion.css": "text/css; charset=utf-8",
  "sd-motion.js": "text/javascript; charset=utf-8",
}
const DIR = path.join(process.cwd(), "..", "docs", "demo")

export async function GET(_request: Request, { params }: { params: Promise<{ asset: string }> }) {
  const { asset } = await params
  const type = Object.hasOwn(FILES, asset) ? FILES[asset] : null
  if (!type) return new Response("Not found", { status: 404 })
  try {
    const body = await readFile(path.join(DIR, asset))
    return new Response(body, { headers: { "content-type": type, "cache-control": "no-store" } })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
