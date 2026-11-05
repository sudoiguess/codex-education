# Official specification research

Checked 2026-11-05; links are primary sources. Recheck before SDK upgrades.

* [Codex Skills](https://learn.chatgpt.com/docs/build-skills): a skill is a folder
  with `SKILL.md`, YAML `name` and `description`, and optional resources.
  Metadata is discovered before full instructions are loaded. Repository skills
  belong in `.agents/skills`; use `.agents/skills/study-session/SKILL.md` here.
* [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli): supports
  stdio and Streamable HTTP, configured through CLI or `config.toml`. Choose
  local stdio with explicit root/database configuration; no listener or OAuth.
* [Latest MCP specification](https://modelcontextprotocol.io/specification/2026-07-28):
  current published revision is 2026-07-28. This revision uses per-request
  metadata/capabilities; do not assume the older initialize-only lifecycle.
* [Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools):
  publish input schemas and structured results; output schemas are supported.
  Tool failures use `isError`; discovery must be deterministic. Tool annotations
  describe behavior and are not access controls.
* [Transports](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports):
  stdio uses newline-delimited JSON-RPC. Reserve stdout for protocol messages;
  send operational diagnostics to stderr. Delegate framing/version behavior to SDK.
* [Official TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk):
  main is stable v2 with split `@modelcontextprotocol/server` and `/client`
  packages and Standard Schema support. Use Zod for shared runtime validation.
  Earlier v1 `@modelcontextprotocol/sdk` examples are not the current baseline.

These are integration constraints, not guarantees of pedagogical effectiveness.
No model API credentials are required: generation happens in the host's chat.
