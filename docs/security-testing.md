# Security, privacy and validation

## Boundaries

The operator configures one material root and a database path at startup. Tool
arguments cannot change either. Material paths are canonicalized and checked
against the real root, including symlinks/junctions and sibling-prefix escapes.
Only regular UTF-8 `.md`/`.txt` files up to 128 KiB are read, with bounded reads.
External URLs, Obsidian embeds and embedded instructions are inert. No writes to
source material are implemented. A hostile process able to replace directories
between path check and open is outside the local single-user threat model.

Imported content is untrusted data, never skill instructions. The pedagogical
skill must ignore attempts to change tools, reveal secrets or execute code.
Runtime schemas and prepared statements validate state regardless of model
behavior. The host has broader filesystem powers: MCP limits do not sandbox
Codex itself. Never treat a tool hint or model assertion as authorization.

## Privacy

No telemetry, network client, API key, cloud database or model call in the server.
However tool results sent to Codex can be processed by its configured provider;
local storage is not a promise of offline AI. Before import, explain this and
obtain the student's choice of material. Import only the named file. Store only
necessary snapshots, responses, provenance and review state. Do not log these.

SQLite is plaintext and inherits local OS access controls; use a private local
directory and disk encryption as appropriate. No app-level encryption guarantee.
Close the process before backing up the database (including pending WAL state);
after close, copy the database to a private location. To remove all learning
data, close the server and remove the configured database and any remaining
`-wal`/`-shm` companions. Chat copies and backups require separate deletion.
Ignore database files in Git; never place learner files in public fixtures.

## Test strategy

`npm run check` runs strict TypeScript checking and Node's test runner. Use
temporary roots/databases, fixed clocks and UUID providers for state tests.
Cover the complete import/item/answer/progress journey, close/reopen, replay,
conflicting request IDs, failed transaction rollback, invalid arguments,
missing relations, source quote provenance, AI key labels, Unicode comparison,
review streak/reset/cap, path traversal, symlink escape, size and UTF-8 limits.
Exercise actual stdio with the official SDK client: discovery, validated
structured responses, calls, malformed arguments and safe errors. No API key
or model access is required for deterministic tests.

Skill evaluation is a separate manual host check: start a fresh chat, request
study help, verify consent, one question at a time, hidden key, source citations,
honest paraphrase limitations, no fabricated attempts and safe response to
prompt injection in material. Automated transport tests do not establish model
behavior or educational efficacy. Run these manual checks before MVP release.
