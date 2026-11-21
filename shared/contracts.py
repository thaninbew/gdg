"""
Shared data contracts. Everyone codes against these.
Change this file only after telling the whole team.
"""
from pydantic import BaseModel, Field


class TriageResult(BaseModel):
    type: str
    type_conf: float
    queue: str
    queue_conf: float
    priority: str
    priority_conf: float
    language: str  # "en" or "de"
    key_terms: list[str] = Field(default_factory=list)  # words that pushed the priority prediction


class Precedent(BaseModel):
    ticket_id: str
    similarity: float
    subject: str = ""
    body_snippet: str = ""
    answer_snippet: str
    language: str = ""
    # labels of the PAST ticket (from kb_train only), used for the "second opinion"
    type: str = ""
    queue: str = ""
    priority: str = ""


class GateDecision(BaseModel):
    escalate: bool
    reasons: list[str] = Field(default_factory=list)


class SentenceCheck(BaseModel):
    text: str
    supported: bool
    source_ticket_id: str | None = None  # which past ticket backs this sentence
    score: float = 0.0                   # how closely it matches (0 to 1)


class Draft(BaseModel):
    reply: str
    cited_ticket_ids: list[str] = Field(default_factory=list)
    grounded: bool = True
    issues: list[str] = Field(default_factory=list)
    sentences: list[SentenceCheck] = Field(default_factory=list)
