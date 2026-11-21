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


class Precedent(BaseModel):
    ticket_id: str
    similarity: float
    subject: str = ""
    body_snippet: str = ""
    answer_snippet: str
    language: str = ""


class GateDecision(BaseModel):
    escalate: bool
    reasons: list[str] = Field(default_factory=list)


class Draft(BaseModel):
    reply: str
    cited_ticket_ids: list[str] = Field(default_factory=list)
    grounded: bool = True
    issues: list[str] = Field(default_factory=list)
