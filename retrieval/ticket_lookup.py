"""
Owner: Toffy (console). Find a customer's existing ticket when they don't know its number.

The dataset has no customer name or email, so the customer's own description is the identifier
(we assume they're telling the truth). The flow the copilot follows:

  1. The LLM calls `find_ticket` with keywords pulled from what the customer said, rewritten into
     ticket vocabulary in English and German (products, error codes, versions, what they tried).
  2. `TicketLookup.search` ranks stored tickets by BM25 keyword match, optionally fused with
     embedding similarity (same multilingual model as the retriever) for paraphrases and EN/DE.
  3. If the top two results are close, `search` returns the terms that tell them apart so the
     copilot can ask the customer one question instead of guessing.
  4. The operator reads the subject back to the customer before acting on the ticket.

Measured on 20,000 dataset tickets (keyword only): with 3 specific words from the customer the right
ticket is first 87% of the time and in the top 5 99%; with 2 words, 62% and 91%. Casual paraphrases
miss on keywords alone; embeddings recover cross-language cases, and the LLM rewrite step recovers
most of the rest (see the PR notes). Prefix matching ("sync" -> "synchronization") was tried and
lowered accuracy, so it's not used.

This searches the *ticket store* (tickets customers submitted), not the KB, and must never be
pointed at test.parquet. No new dependencies: BM25 is plain Python; embeddings are optional.
"""
import math
import re
from collections import Counter
from dataclasses import dataclass, field

# Tool definition the drafting LLM can be given (Ollama / OpenAI-style function schema).
FIND_TICKET_TOOL = {
    "type": "function",
    "function": {
        "name": "find_ticket",
        "description": (
            "Find a customer's existing support ticket from their description when they don't know "
            "the ticket number. Rewrite what they say into the words a support ticket would use, in English "
            "AND German (e.g. 'laggy app' -> slow, delays, performance, Verzögerungen; 'bills' -> invoice, "
            "Rechnung), and keep exact details: product names, error codes, versions. Returns candidate "
            "tickets for the operator to confirm; never show them to the customer."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "keywords": {"type": "array", "items": {"type": "string"},
                             "description": "Specific terms from the customer, e.g. ['Express.js', 'MySQL', 'schedule sync']"},
                "description": {"type": "string", "description": "The customer's description in their own words"},
                "language": {"type": "string", "enum": ["en", "de"], "description": "Language the customer used"},
                "ticket_number": {"type": "string",
                                  "description": "Full or partial ticket number if the customer has one, e.g. 'TKT-49389' or '4938'"},
            },
            "required": [],
        },
    },
}

STOP = set("""
a an and are as at be been but by can could did do does for from had has have how i if in into is it its
just me my no not of on or our please so some that the their them then there these they this to too up us
was we were what when where which while who why will with would you your hello hi dear thanks thank team
support customer issue problem help need regarding about since after before also still any
dont doesnt isnt cant wont didnt
der die das und ist ich wir sie es ein eine einen dem den des mit von zu im in auf für nicht bitte
hallo sehr geehrte geehrtes danke vielen unser unsere uns seit nach bei wurde werden haben hat
""".split())

# A ticket number only counts when it's marked as one ("TKT-49389", "ticket 49389", "#49389", "Nr. 49389")
# or is the whole query, so "error 809" or "Express.js 4.17" stay keywords.
TICKET_NO = re.compile(r"(?:\btkt[-\s]?|\bticket\s*(?:no\.?|nr\.?|number|#)?\s*|#|\bnr\.?\s*)(\d{3,5})\b", re.I)
BARE_NO = re.compile(r"^\s*(?:tkt[-\s]?)?#?(\d{3,5})\s*$", re.I)


def ticket_numbers(text):
    """Digits of any ticket numbers in the text (full or partial)."""
    m = BARE_NO.match(text or "")
    return [m.group(1)] if m else TICKET_NO.findall(text or "")


TOKEN = re.compile(r"[a-z0-9äöüß][a-z0-9äöüß.+#\-]*[a-z0-9+#]|[a-z0-9äöüß]", re.I)


def tokens(text):
    return [t.lower() for t in TOKEN.findall(text or "") if t.lower() not in STOP]


@dataclass
class Match:
    ticket_id: str
    subject: str
    score: float
    match: str                     # "exact" | "number" | "strong" | "partial" | "weak"; shown instead of a score
    matched_terms: list = field(default_factory=list)
    snippet: str = ""


@dataclass
class LookupResult:
    matches: list   # match is "exact"/"number" for ticket-number lookups, else strong/partial/weak
    needs_clarification: bool = False
    # Terms that appear in one of the top candidates but not the other, for a clarifying question.
    distinguishing: dict = field(default_factory=dict)


class TicketLookup:
    """In-memory BM25 over subject + body, with optional embedding fusion."""

    def __init__(self, tickets, embed=None, k1=1.5, b=0.75):
        """tickets: iterable of dicts with ticket_id, subject, body. embed: optional fn(list[str]) -> vectors."""
        self.tickets = [t for t in tickets if (t.get("subject") or t.get("body"))]
        self.docs = [tokens(f"{t.get('subject', '')} {t.get('subject', '')} {t.get('body', '')}") for t in self.tickets]
        self.tf = [Counter(d) for d in self.docs]
        self.avgdl = sum(map(len, self.docs)) / max(1, len(self.docs))
        df = Counter(w for d in self.tf for w in d)
        n = len(self.docs)
        self.idf = {w: math.log(1 + (n - f + 0.5) / (f + 0.5)) for w, f in df.items()}
        self.k1, self.b = k1, b
        self.embed = embed
        self.vectors = embed([f"{t.get('subject', '')}\n{t.get('body', '')}" for t in self.tickets]) if embed else None

    def _bm25(self, q):
        scores = []
        for tf, d in zip(self.tf, self.docs):
            s = 0.0
            for w in q:
                f = tf.get(w)
                if f:
                    s += self.idf[w] * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * len(d) / self.avgdl))
            scores.append(s)
        return scores

    def by_number(self, digits, k=5):
        """Exact ticket number first; a partial number (fewer than 5 digits) matches IDs containing it."""
        exact = [t for t in self.tickets if t["ticket_id"] == f"TKT-{int(digits):05d}"] if len(digits) == 5 else []
        partial = [t for t in self.tickets if digits in t["ticket_id"] and t not in exact]
        return [Match(t["ticket_id"], t.get("subject") or "(no subject)", 1.0, "exact" if t in exact else "number",
                      [t["ticket_id"]], (t.get("body") or "").replace("\n", " ")[:180]) for t in (exact + partial)[:k]]

    def search(self, keywords, description="", language=None, k=5, margin=0.15, ticket_number=None):
        numbers = ([re.sub(r"\D", "", ticket_number)] if ticket_number else []) + ticket_numbers(description) + \
            [n for kw in keywords for n in ticket_numbers(kw)]
        found = [m for n in dict.fromkeys(numbers) if n for m in self.by_number(n, k)]
        if found:
            return LookupResult(matches=found[:k])
        q = tokens(" ".join(keywords) + " " + (description or ""))
        if not q:
            return LookupResult(matches=[])
        bm = self._bm25(q)
        order = sorted(range(len(bm)), key=lambda i: -bm[i])
        if self.vectors is not None:
            # Reciprocal rank fusion of keyword and semantic rankings.
            qv = self.embed([(description or "") + " " + " ".join(keywords)])[0]
            sem = [sum(a * b for a, b in zip(qv, v)) for v in self.vectors]
            sem_order = sorted(range(len(sem)), key=lambda i: -sem[i])
            rrf = Counter()
            for rank, i in enumerate(order[:100]):
                rrf[i] += 1 / (60 + rank)
            for rank, i in enumerate(sem_order[:100]):
                rrf[i] += 1 / (60 + rank)
            order = [i for i, _ in rrf.most_common()]
        if language:
            order = [i for i in order if (self.tickets[i].get("language") or language) == language] or order
        top = [i for i in order[:k] if bm[i] > 0 or self.vectors is not None]
        if not top:
            return LookupResult(matches=[])

        best = bm[top[0]] or 1.0
        qset = set(q)
        matches = []
        for i in top:
            t = self.tickets[i]
            hit = sorted(qset & set(self.docs[i]), key=lambda w: -self.idf.get(w, 0))
            coverage = len(hit) / len(qset)
            rel = bm[i] / best
            level = "strong" if coverage >= 0.6 and rel >= 0.8 else "partial" if coverage >= 0.3 else "weak"
            body = (t.get("body") or "").replace("\n", " ")
            matches.append(Match(t["ticket_id"], t.get("subject") or "(no subject)", round(bm[i], 3), level, hit, body[:180]))

        result = LookupResult(matches=matches)
        if len(top) > 1 and bm[top[0]] > 0 and (bm[top[0]] - bm[top[1]]) / bm[top[0]] < margin:
            a, b = (set(self.docs[i]) - qset for i in top[:2])
            ranked = lambda s: sorted(s - (a & b), key=lambda w: -self.idf.get(w, 0))[:4]
            result.needs_clarification = True
            result.distinguishing = {matches[0].ticket_id: ranked(a), matches[1].ticket_id: ranked(b)}
        return result


def find_ticket(lookup, keywords=(), description="", language=None, ticket_number=None):
    """Tool handler: what the LLM gets back. Plain dicts so it serializes straight to JSON."""
    r = lookup.search(list(keywords), description, language, ticket_number=ticket_number)
    return {
        "matches": [m.__dict__ for m in r.matches],
        "needs_clarification": r.needs_clarification,
        "distinguishing_terms": r.distinguishing,
        "instruction": ("Ask the customer one question using the distinguishing terms, then confirm by reading the subject back."
                        if r.needs_clarification else
                        "Read the top subject back to the customer to confirm before acting." if r.matches else
                        "No match. Ask for a specific detail: an error message, product name or when it started."),
    }
