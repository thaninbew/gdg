# SentinelDesk demo walkthrough

Standalone preview, not an app route. Open `index.html` in a browser (or serve this folder) and click **Get a demo**.

- `index.html`: landing and title, with replayable capability examples below the hero.
- `demo.html`: guided walkthrough with three scenarios, picked from the chips in the header or by Back and Next:
  - **Cited answer** (`#cited`): the real `/submit`, prefilled with the `settings-access` sample. Without the app, a labelled sample answer.
  - **Agent triage** (`#triage`): the engineer page, with an inline section showing what the customer sees (Received, Request checked, Ready for engineer review), the classification and the handoff brief. That section is a labelled sample.
  - **Software Factory** (`#factory`): the same engineer page, with an inline sample run for SD-4182: stage track, evidence and finding, with Replay, Pause and Next step.
  The engineer page is the real `/tickets` when `?engineer` answers; otherwise a labelled sample. Real pages stay mounted across steps.

All data is sample data, and nothing is sent unless you opt in with a local URL. Both options below accept only an explicit `http://` loopback origin: `localhost`, `127.0.0.1` or `[::1]`, with an optional port and no credentials, path, query or hash. Any other value is ignored, no request is made, and the page shows a warning and stays on sample data. This keeps a shared link from sending ticket text to another host.

- `?app=http://localhost:3000` (the default): if the web app is running (`cd web && pnpm dev`), the Cited answer step embeds the existing `/submit` page. Otherwise it shows the labelled sample answer.
- `?engineer=http://localhost:3131`: if the engineer app answers there, the engineer step embeds its real `/tickets` inbox, and rows open `/tickets/[id]` inside it. That inbox shows its own sample queue, not the request sent from `/submit`. If the value is given but the app doesn't answer, the bar says "Engineer app not reachable", and the engineer page uses the labelled sample. The same loopback rule applies.
- `?api=http://localhost:8000`: the sample intake posts `{subject, body}` to `POST /triage` on a running API (`uv run uvicorn api.server:app --port 8000`). The page then shows escalation, reasons and cited precedents. Pages whose stages run on mocks show a Mock badge.

Query parameters on `index.html` are carried into the walkthrough links. Everything uses a light theme.

The live `/submit` and `/console` are separate runs. Each triages its own ticket, and the walkthrough never presents them as the same request. Carrying one request from `/submit` into `/console` depends on thaninbew/gdg#36 (Open in console). Once that lands, the customer page can open the same ticket in the console without a second triage.
