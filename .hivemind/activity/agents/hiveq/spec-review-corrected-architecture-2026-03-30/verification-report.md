# Verification Report

**Goal:** Validate the json-render side-car spec against the corrected architecture understanding.
**Status:** gaps_found
**Score:** 1/9 requirements clearly pass as written

## Requirement Verdicts

| Requirement | Verdict | Evidence | Issues |
| --- | --- | --- | --- |
| REQ-F-01 Canonical spec foundation using `defineSchema`/`defineCatalog` | CONDITIONAL | json-render documents both `defineCatalog` and `defineSchema` with Zod-backed schemas (`https://json-render.dev/docs/api/core`). Repo audit also says the `defineSchema` path is sound but prior pseudocode must be corrected (`sdk-validation-and-architecture-audit.md:232-251`). Current repo code uses `defineCatalog` only in `src/tools/hivefiver-setting/render.ts:2-20`. | Requirement direction is valid, but the spec must name the exact canonical schema shape, correct the real `defineSchema` API, and explicitly keep this contract independent from OpenCode transport. |
| REQ-F-02 `hm-settings` maps `HmSettingDashboardProof` to canonical spec | CONDITIONAL | `HmSettingDashboardProof` exists (`src/tools/hivefiver-setting/types.ts:88-93`) and is produced by the settings handler (`src/features/runtime-entry/settings.ts:52-63`, `93-107`, `147-160`). | The spec does not define the field-level mapping, whether `HmSettingDashboardProof` is transitional or canonical, or what the output spec must contain. Missing Given/When/Then acceptance criteria. |
| REQ-F-07 Ink rendering renders spec to terminal text | CONDITIONAL | Existing Ink renderer path is real: `defineCatalog` + Ink renderer + `renderToString` (`src/tools/hivefiver-setting/render.ts:15-20`, `121-160`). | Requirement is understandable but lacks formal ACs and trace links. It should state the render entrypoint, expected terminal output assertions, and failure behavior. |
| REQ-F-08 React side-car renders specs with tabs and 40/60 layout | FAIL | The plan only states a proposed React target for “richer panels, tabs” and separately a 40/60 layout need (`.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md:168-172`, `300-315`). | Not atomic: rendering, tab behavior, and layout are three assertions. It also inherits overcautious wording (“optional and consumer-safe”) that conflicts with the corrected architecture. Split into separate REQs and remove coupling-risk language. |
| REQ-F-09 End-to-end `hm-settings → spec → Ink + React` | FAIL | The phase plan mentions proving Ink and React on the same contract (`.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md:288-304`) but provides no formal spec/test chain. | Not atomic: one REQ spans generation, transport, Ink rendering, and React rendering. It must be split into transport proof plus one E2E path per renderer, with the side-car explicitly outside OpenCode rendering. |
| REQ-I-01 Side-car connects via `createOpencodeClient` | CONDITIONAL | OpenCode SDK documents `createOpencodeClient` as the client-only connection surface (`https://opencode.ai/docs/sdk`). Repo control-plane code already uses it for attached runtime transport (`src/control-plane/sdk-runtime.ts:71-90`). | Must explicitly say this is **transport only** (HTTP/SSE client), not rendering, schema validation, or UI composition. Current plan still overcouples side-car proof to OpenCode hosting/routes (`.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md:26`, `38`, `43`, `290`). |
| REQ-I-03 Schema-kernel owns contracts | PASS | The plan says schema-kernel owns machine-authoritative dashboard contracts (`.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md:18`, `85-92`, `137-139`). Repo authority exists in `src/schema-kernel/index.ts:1-22`. | Still needs explicit trace to concrete contract files/tests, but the architectural statement itself is correct and aligned. |
| REQ-N-01 Clean Architecture holds | FAIL | Current plan only states a compliance checkbox (`.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md:323-329`). | Not testable as written. Must be decomposed into atomic rules: tool emits data only, adapter depends inward, side-car owns rendering, OpenCode remains transport-only, no renderer logic in tool/plugin business logic. |
| REQ-R-02 Real SDK proof, no stubs | CONDITIONAL | Repo governance already distinguishes live SDK proof from local diagnostics (`AGENTS.md`, “Live Verification Authority”; `src/tools/AGENTS.md` notes local tool tests are not live proof). OpenCode SDK docs show the official client surface; current repo tests are mostly local mocks (e.g. `tests/tools/hivefiver-setting/hm-setting-dashboard-tool.test.ts:11-27`). | Requirement must separate: (1) live `createOpencodeClient` transport proof, (2) renderer contract tests for Ink, and (3) side-car React tests. “No stubs” is right, but the proof lane is underspecified and currently conflated. |

## Cross-Criteria Findings

### Clarity / Testability

- Formal spec markers are absent from the planning artifact. `rg -n "Acceptance Criteria|Given|When|Then|Traceability|REQ-" .hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md` returned no matches.
- Only `REQ-I-03` is clearly acceptable as written. The others need sharper observable outcomes or decomposition.

### Atomicity

- Non-atomic requirements: `REQ-F-08`, `REQ-F-09`, `REQ-N-01`.
- `REQ-R-02` is also too broad unless split into transport proof vs renderer proof.

### Traceability Matrix

- Incomplete / effectively missing. Search for `REQ-*`, `Acceptance Criteria`, `Given/When/Then`, and `Traceability` in the relevant plan returned no matches.
- Therefore every listed requirement lacks an explicit `REQ -> AC -> test` chain in the spec artifact.

### Uncovered Requirements

- All listed requirements are uncovered in the formal traceability sense because no AC/test matrix exists in the spec artifact.

### Orphan Tests

- Relevant tests exist but are orphaned relative to these REQs because no trace matrix links them:
  - `tests/tools/hivefiver-setting/hm-setting-dashboard-tool.test.ts:29-83`
  - `tests/tools/hivefiver-setting/hm-setting-render.test.ts:41-145`
  - `tests/runtime-entry-hm-settings-dashboard.test.ts:44-137`

### Corrected Architecture Compliance

- The current plan still violates the corrected architecture language in multiple places:
  - “additive and consumer-safe” (`.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md:20`, `30`, `36`, `172`, `291`, `320`)
  - OpenCode/plugin-route coupling and side-car proof mixed together (`:26`, `38`, `43-45`, `290`, `306-310`)
- The corrected model should instead say: tool emits JSON spec; agent chain carries it; side-car renders independently; OpenCode is only transport.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md` | 20 | “consumer-safe” caveat for side-car rendering | Medium | Overstates coupling risk after user correction |
| `.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md` | 30 | “layered, additive side-car rendering architecture” | Medium | “additive” is no longer needed for internal json-render components |
| `.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md` | 38 | Plugin integration layer positioned in rendering story | High | Blurs decoupled side-car rendering model |
| `.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md` | 172 | “optional and consumer-safe” | Medium | Conflicts with clarified internal-use rendering model |
| `.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md` | 290 | OpenCode proof gate mixed with side-car/rendering proof | High | Conflates transport proof with rendering proof |

## Verification Commands

| Command | Result | Status |
| --- | --- | --- |
| `git status --short --branch` | Branch `v2.9.5-detox-dev` ahead 1; modified files present; untracked `.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md` and `OVERVIEW.md` | PASS |
| `git diff --stat` | 14 files changed, 149 insertions, 181 deletions | PASS |
| `rg -n "Acceptance Criteria|Given|When|Then|Traceability|REQ-" .hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md` | No matches | FAIL |
| `npx tsc --noEmit` | `src/hooks/event-handler.ts(71,3): error TS6133: 'source' is declared but its value is never read.` | FAIL |
| `npm test` | Timed out after 120000 ms; many failing tests and `ERR_MODULE_NOT_FOUND` for `src/features/event-tracker/writers/base-writer.js` from `tests/features/event-tracker/writers/base-writer.test.ts` | FAIL |
| `npm run lint` | `npm error Missing script: "lint"` | FAIL |
| `npm run build` | Failed with `src/hooks/event-handler.ts(71,3): error TS6133: 'source' is declared but its value is never read.` | FAIL |

## Raw Command Output

### `git status --short --branch`

```text
## v2.9.5-detox-dev...origin/v2.9.5-detox-dev [ahead 1]
 M .opencode/agents/architect.md
 M .opencode/agents/code-skeptic.md
 M .opencode/agents/hitea.md
 M .opencode/agents/hiveplanner.md
 M .opencode/agents/hiveq.md
 M .opencode/command/hm-settings.md
 M AGENTS.md
 M src/features/event-tracker/paths.ts
 M src/features/session-journal/session-resolver.ts
 M src/hooks/compaction-handler.ts
 M src/hooks/event-handler.test.ts
 M src/hooks/event-handler.ts
 M src/hooks/tool-execution-handler.ts
 M tsconfig.tsbuildinfo
?? .hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md
?? OVERVIEW.md
```

### `git diff --stat`

```text
 .opencode/agents/architect.md                    |   2 +
 .opencode/agents/code-skeptic.md                 |   2 +
 .opencode/agents/hitea.md                        |   2 +
 .opencode/agents/hiveplanner.md                  |   2 +
 .opencode/agents/hiveq.md                        |   2 +
 .opencode/command/hm-settings.md                 |  25 ++--
 AGENTS.md                                        |  27 +++-
 src/features/event-tracker/paths.ts              |  20 ++-
 src/features/session-journal/session-resolver.ts |  11 +-
 src/hooks/compaction-handler.ts                  |  13 +-
 src/hooks/event-handler.test.ts                  |  35 ++---
 src/hooks/event-handler.ts                       | 179 +++++++----------------
 src/hooks/tool-execution-handler.ts              |   8 +-
 tsconfig.tsbuildinfo                             |   2 +-
 14 files changed, 149 insertions(+), 181 deletions(-)
```

### `rg -n "Acceptance Criteria|Given|When|Then|Traceability|REQ-" .hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md`

```text
(no matches)
```

### `npx tsc --noEmit`

```text
src/hooks/event-handler.ts(71,3): error TS6133: 'source' is declared but its value is never read.
```

### `npm run lint`

```text
npm error Missing script: "lint"
npm error
npm error Did you mean this?
npm error   npm link # Symlink a package folder
npm error
npm error To see a list of scripts, run:
npm error   npm run
npm error A complete log of this run can be found in: /Users/apple/.npm/_logs/2026-03-29T16_56_40_987Z-debug-0.log
```

### `npm run build`

```text
> hivemind-context-governance@2.9.5 build
> npm run clean && tsc && chmod +x dist/cli.js

> hivemind-context-governance@2.9.5 clean
> rm -rf dist

src/hooks/event-handler.ts(71,3): error TS6133: 'source' is declared but its value is never read.
```

### `npm test` (truncated by timeout; full output saved to `/Users/apple/.local/share/opencode/tool-output/tool_d3a888afa001BKxURv8oraYdCW`)

```text
> hivemind-context-governance@2.9.5 test
> npm run lint:boundary && tsx --test "tests/**/*.test.ts" "src/**/*.test.ts"

...
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/writers/base-writer.js' imported from /Users/apple/hivemind-plugin/.worktrees/product-detox/tests/features/event-tracker/writers/base-writer.test.ts
...
✖ runtime status surfaces continuity-bearing contract state across session changes without contract tools
✖ runtime status recovers the linked contract through delegation continuity for a follow-on session
✖ plugin: opencode-plugin.ts registers system.transform hook
✖ plugin: experimental.text.complete composes journal handler after legacy
...
<bash_metadata>
bash tool terminated command after exceeding timeout 120000 ms
</bash_metadata>
```

## Gaps Summary

1. The spec still encodes the old caution model (`additive`, `consumer-safe`, plugin-route coupling) and therefore does **not** yet respect the corrected architecture.
2. The spec is not implementation-ready because it lacks formal acceptance criteria, Given/When/Then statements, and a traceability matrix.
3. Several requirements are non-atomic and must be split before planning (`REQ-F-08`, `REQ-F-09`, `REQ-N-01`, likely `REQ-R-02`).
4. The OpenCode role must be narrowed to transport proof only; rendering proof must be independent.
5. The project verification baseline is currently red (`tsc`, `build`, `test`, and `npm run lint`), so planning against a clean proof baseline is not possible yet.

## Overall Verdict

**Cannot proceed to planning yet.** Revise the spec first to remove outdated coupling-risk language, decompose non-atomic requirements, and add an explicit `REQ -> AC -> test` matrix aligned to the corrected architecture.
