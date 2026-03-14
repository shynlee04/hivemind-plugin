# Quick Start: Codex Sidecar with HIVEMIND

Status: active quickstart for the `sidecar_mirror` model as of 2026-03-06.

## Goal

Start a Codex CLI or Codex App session that respects the current HIVEMIND split:
- OpenCode remains runtime authority
- Codex acts as a thin planning, research, and continuity sidecar

## Prerequisites

- Codex CLI installed
- repository cloned locally
- local `.env` created from `.env.example`
- `OPENAI_API_KEY` set
- `TAVILY_API_KEY` set if Tavily research is needed

## Current In-Repo Authority Files

Read these first:
1. `.codex/AGENTS.md`
2. `.codex/config.toml`
3. `docs/framework/codex-opencode-reality-map-2026-03-06.md`
4. `docs/framework/codex-sidecar-workflow-spec-2026-03-06.md`
5. `docs/framework/codex-continuity-contract-2026-03-06.md`
6. `docs/framework/codex-session-handoff-protocol-2026-03-06.md`
7. `docs/framework/codex-prompt-pack-2026-03-06.md`

## Validate Local Setup

```bash
codex --version
codex features list
codex mcp list
```

Expected current local baseline:
- Codex CLI is installed
- `multi_agent` is enabled in project config
- project MCP entries include `context7`, `deepwiki`, `tavily`, `repomix`, and `stitch`

## Session Start

From the repo root:

```bash
codex
```

For a non-interactive prompt:

```bash
codex exec --sandbox read-only --ask-for-approval never "Read .codex/AGENTS.md and summarize the active sidecar mirror rules for this repository."
```

## Operating Rules

- start from the latest user request
- revalidate local repo truth first
- use MCP only where local evidence is insufficient or the topic is time-sensitive
- do not treat `.hivemind/state/brain.json` as routing authority
- do not create a new Codex-only state system
- split `hivefiver` and `hiveminder` work when scopes cross

## Prompt Pack

Use:
- `docs/framework/codex-prompt-pack-2026-03-06.md`

Templates included:
- main bootstrap prompt
- sub-session delegation prompt
- restart and recovery prompt
- research synthesis prompt

## Related Docs

- `docs/framework/codex-sidecar-operations-guide-2026-03-06.md`
- `docs/framework/codex-mcp-env-contract-2026-03-06.md`
- `docs/plans/OPENAI-CLI-CONFIG-PLAN-2026-03-06.md`
