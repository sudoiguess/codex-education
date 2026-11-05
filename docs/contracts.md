# State and MCP contracts

The authoritative runtime schemas are `src/contracts.ts`; unknown keys are
rejected. All IDs are UUIDs; timestamps are UTC ISO strings. Text fields are
nonempty, trimmed and bounded to 8000 characters. No SQL or execution tool exists.

## Database v1

See `src/schema.sql` for executable DDL, constraints and indexes.

| Table | Identity and relationships | Purpose |
| --- | --- | --- |
| courses | id PK | title, creation time |
| materials | id PK, course_id FK | immutable relative path, SHA-256, snapshot |
| items | id PK, material_id FK | topic, prompt, key, exact source quote, key origin |
| attempts | id PK, item_id FK | response, comparison result, evidence type, grader version, time |
| reviews | item_id PK/FK | current streak and next due time, derived transactionally |
| requests | request id PK | operation, canonical validated payload, original result |

Each import creates a course and material atomically (one material per course
in slice 1). Later multi-material/session support needs a migration, not unused
tables today. Attempts cannot be edited through tools. The key cannot be changed
after attempts: create a new item instead. AI and human key origin is declared
provenance, not authenticated human attestation; the host must not invent review.

## Tools implemented in slice 1

| Tool | Input | Structured success result |
| --- | --- | --- |
| study_import | requestId, path, title | courseId, materialId, path, sha256, content |
| study_add_item | requestId, materialId, topic, prompt, answer, quote, keyOrigin | itemId |
| study_get_item | itemId | itemId, topic, prompt, quote, path, keyOrigin (no key) |
| study_answer | requestId, itemId, response | attemptId, correct, evidence, keyOrigin, graderVersion, streak, dueAt |
| study_progress | courseId | courseId, items[{itemId,topic,prompt,attempts,streak,dueAt}] |

Quote must occur verbatim in the stored snapshot. Origins are `ai_generated` or
`human_reviewed`; evidence is always `answer_key_match`; grader is `text-v1`.
Unattempted items have null dueAt and streak/attempts zero. Progress order is due
time (unattempted first), then item ID; skill selects due items using current time.

All mutations are retry-safe using globally unique request IDs. Canonical parsed
input and operation must match for replay. Replays do not reread source files or
advance the clock. Recording attempt, review and replay response is one immediate
transaction; rollback leaves no partial state. New request IDs mean new attempts,
even for identical answers. Early practice is allowed and affects the schedule.

Successful MCP results contain validated `structuredContent` and matching JSON
text. Domain errors return `isError: true` and a safe code in text, including
NOT_FOUND, REQUEST_CONFLICT, PATH_DENIED, SOURCE_QUOTE_MISSING. Invalid arguments
are rejected by SDK and service schemas. Unexpected I/O/SQLite failures return
INTERNAL_ERROR without paths or note content. SDK handles protocol-level errors.
Read tools have readOnlyHint; mutations are non-destructive and closed-world.
Import explicitly returns the whole bounded snapshot to the host: get consent
before the first import. No automatic read of an entire vault.

Future MVP contracts (not registered yet): start/resume diagnostic session,
record rubric judgment with `ai_judgment` evidence, choose next practice item,
and export a generated study sheet with exclusive file creation. Define their
schemas and migrations in the corresponding milestone before implementation.
