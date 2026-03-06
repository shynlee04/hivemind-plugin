# Codex Sidecar Operations Guide - 2026-03-06

## Purpose

Give the next Codex App or CLI session a short operator path for using the sidecar mirror setup safely.

## Primary Authority Files

Read these first:
1. `.codex/AGENTS.md`
2. `.codex/config.toml`
3. `docs/framework/codex-opencode-reality-map-2026-03-06.md`
4. `docs/framework/codex-sidecar-workflow-spec-2026-03-06.md`
5. `docs/framework/codex-continuity-contract-2026-03-06.md`
6. `docs/framework/codex-session-handoff-protocol-2026-03-06.md`

## Setup

1. Create a local `.env` from `.env.example`
2. Set at minimum:
   - `OPENAI_API_KEY`
   - `TAVILY_API_KEY` if Tavily is needed
3. Start Codex from the repository root
4. Treat `.codex/config.toml` as the in-repo Codex config authority

## Safe Default Operating Loop

1. Read the latest human request
2. Read `.codex/AGENTS.md`
3. Revalidate local repo truth
4. Research only where local evidence is insufficient
5. Revalidate findings
6. Create or refine the plan
7. Execute in bounded scope
8. Verify before claiming completion
9. Persist checkpoint or handoff if the session is ending

## Lineage Routing

Use `hivefiver` when the work concerns:
- `.codex/**`
- `.opencode/**`
- `docs/framework/**`
- framework operating contracts

Use `hiveminder` when the work concerns:
- `src/**`
- `tests/**`
- `docs/implementation/**`
- product or implementation delivery

If both are involved:
- split the work
- keep artifacts separate
- merge only in a main-session synthesis step

## Do Not Do

- do not use `.hivemind/state/brain.json` as routing authority
- do not rely on stale docs that still assume `codex --agent ...`
- do not create a new state store for Codex
- do not copy OpenCode frontmatter contracts directly into Codex

## Verification Minimum

For repository changes:
- `git diff --check`
- `npx tsc --noEmit`

Add targeted tests when the change touches runtime code or behavior.
