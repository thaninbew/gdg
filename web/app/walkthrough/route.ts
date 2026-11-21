// The walkthrough's links are relative, so it must be opened under /walkthrough/. A relative Location keeps the
// host the browser used (127.0.0.1, localhost or a proxy) and passes the query (?app=, ?api=) through.
export function GET(request: Request) {
  return new Response(null, { status: 307, headers: { Location: "/walkthrough/index.html" + new URL(request.url).search } })
}
