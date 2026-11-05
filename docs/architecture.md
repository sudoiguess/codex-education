# Study OS architecture and MVP

Decision record: 2026-11-05. Status: architecture defined before implementation.

## Product boundary

Single learner, single local process, arbitrary subjects, Codex chat as the interface.
The MVP imports UTF-8 Markdown/text (including Obsidian vault files), diagnoses
topic weaknesses, teaches from cited material, asks recall questions, records
attempts and schedules reviews. Generated explanations and study sheets live in
chat initially. Source notes are always read-only. No custom frontend, accounts,
sync, embeddings, web crawling, PDF/OCR, execution of student code, automatic
exam guarantees, or Python dependency in this milestone.

## Modules and authority

`Codex Skill -> MCP adapter -> application service -> SQLite repository`

The skill owns dialogue, diagnosis, explanations, question generation and
pedagogical choices. The TypeScript core owns validation, identity, provenance,
grading rules and deterministic progress transitions; it has no Codex imports
or model calls. A filesystem adapter reads explicitly requested paths beneath
one operator-configured material root. Obsidian is a read-only Markdown adapter
in MVP; links, embeds and plugins are inert text. SQLite stores snapshots, so
editing a source does not retroactively change an attempt's evidence.

AI-authored question/answer keys remain `ai_generated`; a deterministic text
comparison verifies only agreement with that key, never factual truth. Human
reviewed keys have separate provenance. Free-form AI judgments will be stored
as `ai_judgment`, never `verified_test`. Scores are practice evidence, not a
claim of mastery. A verified math/code runner is a later, separately sandboxed
capability, outside the first slice.

## First vertical slice (implemented scope)

Import one bounded Markdown/text snapshot and create a course; add one recall
item with a topic, source quote and answer-key provenance; present it without
the answer; submit an attempt; compare using NFC + trim + lowercase; atomically
record the attempt and schedule its next review; retrieve progress after restart.
Skills provide the teach/practice conversation. Each mutation takes a caller
request ID; retrying the identical request returns its original result and
conflicting reuse fails. IDs and UTC clock are injected at the service boundary.

SQLite uses foreign keys, WAL, busy timeout, schema versioning and transactions.
Attempts are append-only through the service. Review intervals are deliberately
simple: miss -> 1 day; consecutive hits -> 1, 3, 7, 14, 30 days (cap 30).
Any new miss resets the streak. No unsupported learning-science efficacy claim.

## Full MVP after this slice

Bounded multi-topic diagnostic sessions, saved AI rubric judgments, adaptive
item selection from weakest/due topics, resumable sessions and explicit
Markdown study-sheet export to a separate output root. These are backlog work,
not silently implemented here. The same source import supports an Obsidian
vault without modifying it. Python is optional only for a justified verifier or
artifact task, with a typed interface and explicit evidence provenance.

## Complete user journey

1. Student selects `biology.md`; explain that excerpts sent to Codex may leave
   the machine, then import via `study_import` with a fresh request ID.
2. Codex identifies a topic from the returned snapshot, asks a diagnostic recall
   question, and persists it via `study_add_item` with `ai_generated` provenance.
3. Student answers without seeing the key. `study_answer` stores the diagnostic
   attempt and comparison result. A miss is a provisional weakness.
4. Codex teaches the missed concept using the stored quote and source path,
   explicitly distinguishing source statements from its own explanation.
5. Codex creates a different recall item at suitable difficulty. Ask one question
   at a time; retain the original diagnostic evidence.
6. Grade through `study_answer`; explain that text matching can reject a valid
   paraphrase. Do not change a score merely because the model likes an answer.
7. `study_progress` returns each item's attempts, streak and due timestamp.
8. At the next session, select the earliest due item; if none is due, offer a
   new topic or deliberate early practice. Persisted due times require no timer.

Example: a learner answers “mitosis” to a meiosis prompt, receives a cited
explanation, then correctly recalls “meiosis” on a new item. Both attempts
remain recorded; neither is labeled a verified biology test.

## Trade-offs

Node 24's built-in SQLite avoids a native addon and Python bridge, but its SQLite
API is still experimental. Synchronous bounded local operations keep transactions
simple; this is not a multi-user server. Exact recall matching is auditable but
pedagogically limited. A single package with small modules is easier to evolve
than a premature monorepo. Filesystem security assumes the material root is
controlled by the local learner; a hostile concurrent filesystem writer is
outside this MVP's isolation guarantee.
