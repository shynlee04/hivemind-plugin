# Codex Sidecar Configuration Plan - 2026-03-06

Status: superseded plan artifact retained as the concise implementation record for the current Codex-side setup.

## Final Direction

Chosen authority model: `sidecar_mirror`

Meaning:
- OpenCode remains the current runtime source of truth
- Codex remains thin and compatible
- Codex owns planning discipline, continuity discipline, MCP-backed research, and file-backed session contracts

## Implemented Configuration Outcomes

### `.codex/config.toml`

Current in-repo Codex baseline:
- `model = "gpt-5.4"`
- `model_reasoning_effort = "high"`
- `features.multi_agent = true`
- project MCP entries for `context7`, `deepwiki`, `tavily`, `repomix`, and `stitch`
- Tavily auth moved to `bearer_token_env_var = "TAVILY_API_KEY"`

### `.codex/AGENTS.md`

Current in-repo instruction baseline:
- sidecar mirror authority split
- lineage routing rules
- main-session and sub-session responsibilities
- workflow stage chain
- restart and handoff rules

### `.env.example`

Documented environment contract:
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
- `GITHUB_TOKEN`
- `NOTION_API_TOKEN`

### OpenCode parity

`opencode.json` remains the OpenCode runtime MCP authority and now uses env-backed Tavily auth instead of an embedded key.

## Current Authority Documents

- `.codex/AGENTS.md`
- `.codex/config.toml`
- `docs/framework/codex-opencode-reality-map-2026-03-06.md`
- `docs/framework/codex-sidecar-workflow-spec-2026-03-06.md`
- `docs/framework/codex-continuity-contract-2026-03-06.md`
- `docs/framework/codex-mcp-env-contract-2026-03-06.md`
- `docs/framework/codex-session-handoff-protocol-2026-03-06.md`
- `docs/framework/codex-sidecar-operations-guide-2026-03-06.md`
- `docs/framework/codex-prompt-pack-2026-03-06.md`

## Explicit Non-Goals

Do not treat these as current Codex migration goals:
- full port of OpenCode agent frontmatter
- OpenCode plugin lifecycle parity
- OpenCode custom tool dispatch parity
- new Codex-specific persistent state stores

## Validation Record

Validated in this repository with:
- JSON parse of `opencode.json`
- TOML parse of `.codex/config.toml`
- `git diff --check`
- `npx tsc --noEmit`
- local `codex` CLI inspection for command surface compatibility

## Remaining Future Work

Future work, if needed:
- add optional role-specific TOML config files for Codex multi-agent roles
- expand prompt packs for specialized review or remediation workflows
- add deeper MCP parity only when a concrete workflow requires it
