# Study OS — codex education

An open-source, local-first learning core with a Codex study Skill and TypeScript
MCP tools. No custom frontend or model API key. MIT licensed.

**Current milestone:** one complete persisted recall loop. Import Markdown/text,
save a source-backed question, answer, compare with its key, record evidence and
retrieve progress/review dates. Codex provides teaching and study sheets in chat.
Multi-topic diagnostic sessions and rubric grading are planned, not implemented.

## Run

Requires Node **24.18.x** (built-in TypeScript execution and SQLite) and npm.
SQLite currently carries Node's experimental API status.

```sh
npm ci
npm run check
```

Register the server with Codex using absolute paths (replace the example paths):

```sh
codex mcp add study-os --env STUDY_MATERIAL_ROOT=/absolute/path/to/materials --env STUDY_DB_PATH=/absolute/private/path/study.sqlite -- node /absolute/path/to/codex-education/src/main.ts
```

On Windows use quoted absolute paths such as `"C:/Users/you/Documents/materials"`.
The selected material directory must exist. The database parent is created.
The server uses stdio and never opens a network listener. No global settings
are modified by this repository. Check the registration with `codex mcp list`.
If starting manually, set those environment variables and run `npm start`;
it waits for MCP messages, not interactive terminal commands.

Launch Codex from this repository to discover
`.agents/skills/study-session/SKILL.md`, then invoke `$study-session`. Example:
“Help me study `biology.md`; import this file and start with a recall question.”
For a public smoke example, point the material root at this repo's `examples`
directory. Keep real learner material outside the repository. Retain the course
ID returned by import for the next chat; course discovery is not in slice 1.

## Evidence and privacy

The server makes no network calls. Imported excerpts and responses passed to
Codex may be processed by its provider. Choose what to share before importing.
Local SQLite contains plaintext snapshots and answers; keep it private and out
of Git. Source notes are read-only, including Obsidian vault Markdown files.

Grading in this slice is NFC-normalized, case-insensitive exact text matching.
Matching an AI-generated key is **not a verified subject test**. Paraphrases may
fail; AI judgment and factual correctness are not inferred from the comparison.

## Design and development

* [Architecture, MVP and complete journey](docs/architecture.md)
* [Official specification research, checked 2026-11-05](docs/spec-research.md)
* [Database schema and tool contracts](docs/contracts.md)
* [Security, privacy, backup/deletion and test strategy](docs/security-testing.md)
* [Prioritized backlog](docs/backlog.md)
* [Contributor/agent rules](AGENTS.md)

`src/core.ts` contains pure grading/scheduling rules; `service.ts` coordinates
validated state transitions; `database.ts` and `materials.ts` are adapters;
`server.ts` exposes schemas and safe results over MCP. No Codex dependency enters
the learning core. Run `npm run check` for every functional milestone.
