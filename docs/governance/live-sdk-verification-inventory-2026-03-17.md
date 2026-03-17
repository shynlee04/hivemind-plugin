# Live SDK Verification Inventory - 2026-03-17

## Purpose

Inventory the governance surfaces and infected areas that must be reconciled now
that HiveMind is shifting toward full OpenCode server/client SDK and plugin API
instances, with live contract verification replacing mock-first confidence.

## Decision Context

- Selected posture: live OpenCode server/client/plugin contract verification is
  the authority for runtime behavior claims.
- Primary authority:
  - `AGENTS.md`
  - `MASTER.active.md`
  - `task_plan.active.md`
  - `progress.active.md`
  - `ADVANCED-SDK.md`
  - official OpenCode server, SDK, and plugin docs
- Advisory or stale surfaces must not override the authority set above.

## Infected Areas

### Severity: High

| Surface | Why Infected | Recommended Action |
|---|---|---|
| `src/cli/harness.ts` | Harness checks `/global/health` and local bundle execution only; does not prove live OpenCode behavior | Reframe as diagnostic until real SDK probes exist |
| `tests/harness-command.test.ts` | Uses a tiny HTTP stub instead of a real OpenCode server and loaded plugin | Replace or supplement with live SDK contract probes |
| `tests/helpers/mock-sdk.ts` | Mocked `PluginInput` encourages false confidence for runtime claims | Keep for narrow unit tests only |
| `tests/runtime-tools.test.ts` | Proves synthesized tool payloads, not live server/client/plugin behavior | Keep as unit coverage; do not use as runtime proof |
| `src/tools/runtime/tools.ts` | `hivemind_runtime_command` executes local bundle logic, not official SDK session/command APIs | Clarify scope and route future live verification elsewhere |
| `src/control-plane/control-plane-handler.ts` | Control-plane execution remains local-handler based despite SDK-first target | Mark as transition seam and future extraction target |
| `docs/refactored-plan.md` | Still carries OpenTUI/Bun dashboard direction as if current | Demote as stale/advisory |
| `conductor/product-guidelines.md` | Declares OpenTUI as the ongoing interaction surface, conflicting with current SDK/server shift | Demote as proposal-only until reconciled |
| `conductor/tech-stack.md` | Declares Node core runtime plus OpenTUI UI mandate, which no longer matches selected direction | Demote as proposal-only until reconciled |

### Severity: Medium

| Surface | Why Infected | Recommended Action |
|---|---|---|
| `src/hooks/AGENTS.md` | Still marks `tool.execute.before` and `permission.ask` as unused | Correct governance drift |
| `src/plugin/AGENTS.md` | Live plugin adoption map exists but still treats major client APIs as “later” without a live verification rule | Add live verification requirement |
| `src/AGENTS.md` | Correctly states SDK-vs-plugin boundary but lacks a hard proof rule for runtime claims | Add official-interface verification rule |
| `MASTER.active.md` | Describes SDK-centric posture but does not yet record the harness-proof gap explicitly | Add truthful baseline note |
| `task_plan.active.md` | Verification posture still leans on local green tests | Add live contract probe workstream |
| `progress.active.md` | Reports green evidence without clearly separating local proof from live proof | Record the verification gap explicitly |

### Severity: Advisory

| Surface | Why Advisory | Recommended Action |
|---|---|---|
| `conductor/**` | Product-intent and track material, not runtime authority | Treat as proposal surfaces until reconciled |
| `docs/plans/archive/**` | Historical context only | Do not use as authority |
| `docs/refactored-plan.md` | Legacy strategy note | Keep for history, not runtime truth |

## Governance Surface Inventory

### Live Authority

| Surface | Role |
|---|---|
| `AGENTS.md` | Root framework authority |
| `src/AGENTS.md` | Source-root SDK and boundary authority |
| `src/control-plane/AGENTS.md` | CLI and intake authority |
| `src/plugin/AGENTS.md` | Plugin assembly authority |
| `src/hooks/AGENTS.md` | Hook boundary authority |
| `src/tools/AGENTS.md` | Write-side tool authority |
| `MASTER.active.md` | Current architectural charter |
| `task_plan.active.md` | Current bounded work sequence |
| `progress.active.md` | Current evidence register |
| `ADVANCED-SDK.md` | OpenCode SDK and plugin capability reference |

### Compatibility Entries

| Surface | Status |
|---|---|
| `CLAUDE.md` | Symlink to `AGENTS.md` |
| `GEMINI.md` | Symlink to `AGENTS.md` |

### ADR Surfaces

| Surface | Status |
|---|---|
| `docs/adr/001-no-hook-adapter.md` | Accepted |
| `docs/adr/002-type-decomposition.md` | Accepted |
| `docs/adr/003-live-sdk-verification-authority-2026-03-17.md` | Added in this cycle |

## Reconciliation Guidance

1. Runtime behavior claims must be proven against real OpenCode interfaces:
   `createOpencodeServer()`, `createOpencodeClient()`, `opencode serve`,
   `/event`, `/doc`, plugin hook loading, or equivalent official APIs.
2. Local bundle execution, mocked `PluginInput`, and synthetic runtime payloads
   remain valuable, but only as local unit-level evidence.
3. `hm-harness` should be described truthfully as a readiness and diagnostic
   command until live contract probes exist.
4. `conductor/**` and legacy plans remain useful inputs, but they must not
   override active authority or official OpenCode documentation.
