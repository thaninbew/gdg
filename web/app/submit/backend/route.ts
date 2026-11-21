// Same-origin proxy from /submit to the team's FastAPI server (api/server.py).
// Only a loopback backend is allowed, so the browser never names an arbitrary URL.
// POST {probe: true} -> GET /health; POST {subject, body} -> POST /triage.

const BASE = process.env.SENTINEL_API_URL ?? "http://127.0.0.1:8000"
const MAX_BODY = 16_000

function loopback(url: string) {
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(hostname)
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!loopback(BASE)) return Response.json({ error: "SENTINEL_API_URL must be a loopback http URL" }, { status: 500 })
  const raw = await request.text()
  if (raw.length > MAX_BODY) return Response.json({ error: "Request too large" }, { status: 413 })
  let input: { probe?: boolean; subject?: unknown; body?: unknown }
  try {
    input = JSON.parse(raw)
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    if (input.probe) {
      const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2_000), cache: "no-store" })
      return Response.json({ ok: res.ok })
    }
    const subject = typeof input.subject === "string" ? input.subject : ""
    const body = typeof input.body === "string" ? input.body : ""
    const res = await fetch(`${BASE}/triage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject, body }),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    })
    const data = await res.json().catch(() => null)
    return Response.json(data ?? { error: "Backend returned no JSON" }, { status: res.ok ? 200 : res.status })
  } catch {
    return Response.json(input.probe ? { ok: false } : { error: "Backend unavailable" }, { status: input.probe ? 200 : 502 })
  }
}
