"""
HTTP API for the SentinelDesk pipeline.
Run: uv run uvicorn api.server:app --port 8000
"""
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import pipeline

WARMUP_TICKET = (
    "Cannot log in to the customer portal",
    "Since this morning I get an 'invalid credentials' error when logging in, "
    "even after resetting my password. Please help, our team is blocked.",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models, indexes and the LLM once so the first real request is fast.
    t = time.perf_counter()
    try:
        pipeline.run(*WARMUP_TICKET)
        print(f"[api] warm-up done in {time.perf_counter() - t:.1f}s")
    except Exception as e:  # don't block startup; the first request will just be slower
        print(f"[api] warm-up failed: {e!r}")
    yield


app = FastAPI(title="SentinelDesk API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Ticket(BaseModel):
    subject: str = ""
    body: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/triage")
def triage(ticket: Ticket):
    # Sync def: FastAPI runs it in a threadpool, so the blocking pipeline doesn't stall the event loop.
    try:
        return pipeline.run(ticket.subject, ticket.body)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
