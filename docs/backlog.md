# Prioritized implementation backlog

1. **P0 / slice 1:** bounded import, source-backed recall items, deterministic
   comparison, transactional retry-safe attempts/review state, MCP stdio, one
   pedagogical Skill. Done only with persistence, boundary and transport tests.
2. **P0 / slice 2:** diagnostic sessions across topics, resumable session state
   and rubric-based AI judgments with distinct provenance. Acceptance: partial
   session survives restart; AI scores cannot populate verified evidence fields.
3. **P1 / slice 3:** choose due/weak-topic items with deterministic ties and
   disclose the selection rationale. Acceptance: fixed histories produce fixed
   choices; no confidence/mastery claims unsupported by evidence.
4. **P1 / slice 4:** explicit Markdown study-sheet/flashcard export to an output
   root with exclusive creation and source references. Acceptance: traversal,
   symlink escape and existing-file writes fail; no vault mutation.
5. **P1 / MVP release:** documented backup/deletion, read-only Obsidian walkthrough,
   skill behavior evaluations and Windows/Linux CI. Acceptance: novice can finish
   the documented journey; privacy and limitations are visible before import.

Each step requires its own tests and docs before starting the next. PDF/OCR,
Python verification, embeddings, sync and a frontend are outside this backlog.
