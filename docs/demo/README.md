# SentinelDesk demo walkthrough

Standalone preview, not an app route. Open `index.html` in a browser (or serve this folder) and click **Start demo**.

- `index.html`: landing and title.
- `demo.html`: guided five-minute flow. Customer intake, My requests and request detail, engineer inbox and detail, then optional dashboard and Software Factory. Step deep links use `demo.html#intake`, `#mine`, `#inbox`, `#detail`, `#dash`, `#run` and `#finding`.
- `factory.html`: Software Factory Run and Finding views, embedded by `demo.html`.

All data is sample data, and nothing is sent. To send intake to a running API (`uv run uvicorn api.server:app --port 8000`), add `?api=http://localhost:8000` to `demo.html`. That posts `{subject, body}` to `POST /triage` and shows escalation, reasons and cited precedents. Pages whose stages run on mocks show a Mock badge.
