# SentinelDesk demo walkthrough

Standalone preview, not an app route. Open `index.html` in a browser (or serve this folder) and click **Get a demo**.

- `index.html`: landing and title, with replayable capability examples below the hero.
- `demo.html`: guided five-minute flow. Customer intake, My requests and request detail, engineer inbox and detail, then optional dashboard and Software Factory. Step deep links use `demo.html#intake`, `#mine`, `#inbox`, `#detail`, `#dash`, `#run` and `#finding`.
- `factory.html`: Software Factory Run and Finding views, embedded by `demo.html`.

All data is sample data, and nothing is sent unless you opt in with a local URL. Both options below accept only an explicit `http://` loopback origin: `localhost`, `127.0.0.1` or `[::1]`, with an optional port and no credentials, path, query or hash. Any other value is ignored, no request is made, and the page shows a warning and stays on sample data. This keeps a shared link from sending ticket text to another host.

- `?app=http://localhost:3000` (the default): if the web app is running (`cd web && pnpm dev`), the customer step embeds the existing `/submit` page. Otherwise the sample customer steps are shown.
- `?api=http://localhost:8000`: the sample intake posts `{subject, body}` to `POST /triage` on a running API (`uv run uvicorn api.server:app --port 8000`). The page then shows escalation, reasons and cited precedents. Pages whose stages run on mocks show a Mock badge.

Query parameters on `index.html` are carried into the walkthrough links. Everything uses a light theme.
