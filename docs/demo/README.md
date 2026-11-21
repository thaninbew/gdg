# SentinelDesk demo walkthrough

Standalone preview, not an app route. Open `index.html` in a browser (or serve this folder) and click **Get a demo**.

- `index.html`: landing and title, with replayable capability examples below the hero.
- `demo.html`: guided walkthrough. The product fills the screen above a small bar with Back, the step label and Next (arrow keys also work). With the web app running, the steps are the real `/submit` and `/console` pages, then the Software Factory sample. Each page stays mounted, so its state survives Back and Next. Without the app, sample screens stand in: customer intake, My requests and request detail, engineer inbox and detail. Step links: `#intake`, `#mine`, `#inbox`, `#detail`, `#urgent`, `#run` and `#finding`. Live mode maps them to `#support` and `#console`.
- `factory.html`: Software Factory Run and Finding views, embedded by `demo.html`.

All data is sample data, and nothing is sent unless you opt in with a local URL. Both options below accept only an explicit `http://` loopback origin: `localhost`, `127.0.0.1` or `[::1]`, with an optional port and no credentials, path, query or hash. Any other value is ignored, no request is made, and the page shows a warning and stays on sample data. This keeps a shared link from sending ticket text to another host.

- `?app=http://localhost:3000` (the default): if the web app is running (`cd web && pnpm dev`), the customer step embeds the existing `/submit` page. Otherwise the sample customer steps are shown.
- `?engineer=http://localhost:3131`: if the engineer app answers there, the engineer step embeds its real `/tickets` inbox, and rows open `/tickets/[id]` inside it. That inbox shows its own sample queue, not the request sent from `/submit`. If the value is given but the app doesn't answer, the bar says "Engineer app not reachable", and the step stays on `/console` (or the sample inbox when no app is running). The same loopback rule applies.
- `?api=http://localhost:8000`: the sample intake posts `{subject, body}` to `POST /triage` on a running API (`uv run uvicorn api.server:app --port 8000`). The page then shows escalation, reasons and cited precedents. Pages whose stages run on mocks show a Mock badge.

Query parameters on `index.html` are carried into the walkthrough links. Everything uses a light theme.

The live `/submit` and `/console` are separate runs. Each triages its own ticket, and the walkthrough never presents them as the same request. Carrying one request from `/submit` into `/console` depends on thaninbew/gdg#36 (Open in console). Once that lands, the customer page can open the same ticket in the console without a second triage.

## Run it from the app (one server)

With the web app running (`cd web && pnpm dev`), open `http://localhost:3000/walkthrough/` and click **Get a demo**. The app serves these same files from `docs/demo`, and the walkthrough uses the app on its own origin, so no second server or `?app=` is needed. The steps are Support, Console, Factory Run and Factory Finding (1/4 to 4/4). For real triage, also run the API on `:8000`. Opening the files directly, or serving this folder separately, still works as before, with the app defaulting to `http://localhost:3000`.
