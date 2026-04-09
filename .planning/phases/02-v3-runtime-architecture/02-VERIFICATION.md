---
phase: 02-v3-runtime-architecture
verified: 2026-04-09T02:50:00Z
status: gaps_found
score: 17/18 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 11/18
  gaps_closed:
    - "Per-key concurrency limits and acquire timeouts are configurable without source edits"
    - "Background execution mode is chosen automatically from task characteristics and environment capabilities"
    - "Built-in mode chooses OpenCode sub-session for interactive work and owned-process stdio for research/headless work"
    - "Failed background work records error context before cleanup and status remains queryable"
    - "Session-start and compaction-time injections are evaluated conditionally from live runtime context"
    - "Governance-blocked injections never apply"
    - "Governance metadata reported after tool execution reflects the correct tool call under overlap"
  gaps_remaining:
    - "Per-session tool budgets come from runtime policy instead of hardcoded constants"
  regressions: []
gaps:
  - truth: "Per-session tool budgets come from runtime policy instead of hardcoded constants"
    status: failed
    reason: "The hook now reads delegation.runtimePolicyOverride, but the live delegation path never writes that field and continuity reload strips it, so session-specific overrides are not actually available in production. Tests only prove direct in-memory injection via setDelegationMeta, not end-to-end runtime flow."
    artifacts:
      - path: "src/lib/lifecycle-state.ts"
        issue: "buildDelegationMeta() returns delegation metadata without runtimePolicyOverride, so live delegated sessions never produce session override data."
      - path: "src/lib/continuity-normalizers.ts"
        issue: "normalizeDelegationMeta() drops runtimePolicyOverride on reload, so any persisted override is lost before hydration."
      - path: "src/hooks/create-tool-guard-hooks.ts"
        issue: "resolvePolicy() consumes delegation.runtimePolicyOverride, but that data path is hollow in production."
      - path: "tests/hooks/create-tool-guard-hooks.test.ts"
        issue: "Passing tests inject runtimePolicyOverride directly with setDelegationMeta(), bypassing live writer/persistence behavior."
    missing:
      - "Populate runtimePolicyOverride in live delegation metadata when trusted session override inputs exist."
      - "Preserve runtimePolicyOverride through continuity normalization and hydration."
      - "Add an end-to-end regression covering write -> persist -> reload -> tool-guard enforcement for session overrides."
---

# Phase 2: V3 Runtime Architecture Verification Report

**Phase Goal:** Executable recovery plan set replacing the stale reference-only Phase 02 plans. These plans are grounded in current V3 runtime code reality and preserve the still-locked Phase 02 decisions.
**Verified:** 2026-04-09T02:50:00Z
**Status:** gaps_found
**Re-verification:** Yes — after gap-closure plans 02-07, 02-08, and 02-09

**Verification boundary:** Re-verified only current Phase 02 source/test surfaces touched by plans 02-07, 02-08, and 02-09, plus fresh bounded/full-suite verification commands. Per user boundary, ROADMAP.md, STATE.md, REQUIREMENTS.md, PROJECT.md, zombie cleanup, and src/lib restructuring were excluded.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Per-key concurrency limits and acquire timeouts are configurable without source edits | ✓ VERIFIED | `src/plugin.ts:28-35` loads workspace runtime policy once; `src/lib/lifecycle-manager.ts:317-332` resolves queue settings before acquire via `resolveLifecycleConcurrency()`. |
| 2 | Per-session tool budgets come from runtime policy instead of hardcoded constants | ✗ FAILED | `src/hooks/create-tool-guard-hooks.ts:129-178` reads `delegation.runtimePolicyOverride`, but `src/lib/lifecycle-state.ts:68-84` never writes it and direct reload spot-check shows `runtimePolicyOverride` is stripped by `src/lib/continuity-normalizers.ts:130-156`. |
| 3 | OpenCode-native hook/session behavior remains primary and custom controls only fill missing gaps | ✓ VERIFIED | `src/plugin.ts:42-52` remains a thin composition root wiring native hook surfaces and tools; no parallel governance/runtime framework was added. |
| 4 | Background execution mode is chosen automatically from task characteristics and environment capabilities | ✓ VERIFIED | `src/tools/delegate-task.ts:228-259` now calls `classifyExecutionMode()` before lifecycle launch. |
| 5 | Built-in mode chooses OpenCode sub-session for interactive work and owned-process stdio for research/headless work | ✓ VERIFIED | `src/tools/delegate-task.ts:90-107,228-259` classifies mode; `src/lib/lifecycle-manager.ts:346-389` dispatches `builtin-process` to `runLifecycleProcessTask()` and other work to `runLifecycleSubsessionTask()`. |
| 6 | Failed background work records error context before cleanup and status remains queryable | ✓ VERIFIED | `src/lib/lifecycle-process-runner.ts:93-105,152-205` patches failure state before queue release; full suite passes `tests/lib/background-manager-harden.test.ts`. |
| 7 | Delegation lineage is persisted canonically in continuity and can optionally be exported as packet/manifest artifacts | ✓ VERIFIED | `src/lib/continuity.ts:159-169,200-246` persists canonical records and exports derived artifacts. |
| 8 | Specialist routing is advisory/configurable and falls back broadly when no strong specialist match exists | ✓ VERIFIED | `src/tools/delegate-task.ts:182-189` still resolves specialist routing independently before execution classification; full suite passes routing tests. |
| 9 | Delegation exports include the specialist decision and execution metadata needed for recovery/audit | ✓ VERIFIED | `src/lib/delegation-packet.ts:220-253` exports specialist and execution metadata from continuity. |
| 10 | Restarted sessions receive a staleness-aware recovery assessment before resume | ✓ VERIFIED | No regression found; full suite passes `tests/lib/session-recovery.test.ts` and continuity/lifecycle tests. |
| 11 | Compaction preserves checkpoint context without performing read-path disk writes | ✓ VERIFIED | `src/hooks/create-session-hooks.ts:279-357` captures checkpoint state, records via lifecycle manager, and injects compaction context without extra write-side shortcuts. |
| 12 | Budget/reset behavior on compact and restart preserves warning history for recovery | ✓ VERIFIED | No regression found; full suite passes compaction/session hook coverage. |
| 13 | Governance rules persist across sessions and are re-applied on recovery | ✓ VERIFIED | `src/lib/governance-engine.ts:181-239` still reads/writes continuity-backed governance state; full suite passes governance tests. |
| 14 | Most violations warn or escalate instead of hard-blocking | ✓ VERIFIED | `tests/hooks/create-tool-guard-hooks.test.ts:368-481` exercises warn, escalate, block, and recovery paths successfully. |
| 15 | Rule mutation at runtime does not require process restart | ✓ VERIFIED | `src/lib/governance-engine.ts:189-200` mutates persisted rule state live; full suite passes governance mutation coverage. |
| 16 | Session-start and compaction-time injections are evaluated conditionally from live runtime context | ✓ VERIFIED | `src/lib/injection-engine.ts:111-123` renders route-derived specialist payloads; `tests/lib/injection-engine.test.ts:81-122` proves builder/researcher/critic lanes and fallback behavior. |
| 17 | Governance-blocked injections never apply | ✓ VERIFIED | `src/lib/governance-engine.ts:241-275`, `src/hooks/create-core-hooks.ts:108-129`, and `src/hooks/create-session-hooks.ts:316-335` now use active block state; historical-only violation tests pass. |
| 18 | An audit log records why each injection applied or skipped | ✓ VERIFIED | `src/lib/injection-engine.ts:195-247` still records per-candidate audit decisions; bounded tests and full suite pass. |

**Score:** 17/18 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/plugin.ts` | Load runtime policy once and inject dependencies | ✓ VERIFIED | Thin composition root wires runtime policy into lifecycle and tool guards. |
| `src/lib/lifecycle-manager.ts` | Resolve live concurrency policy and branch execution by submode | ✓ VERIFIED | Orchestrates queue acquisition with resolved limits and dispatches builtin-process vs builtin-subsession. |
| `src/lib/lifecycle-runtime-policy.ts` | Focused per-key concurrency resolver | ✓ VERIFIED | Substantive helper used by lifecycle manager before queue acquire. |
| `src/hooks/create-tool-guard-hooks.ts` | Resolve effective tool budget from runtime policy | ⚠️ HOLLOW | Workspace policy path is live, but session override data source is not produced/preserved end-to-end. |
| `src/tools/delegate-task.ts` | Classify execution mode before launch | ✓ VERIFIED | Calls `classifyExecutionMode()` and forwards execution metadata. |
| `src/lib/lifecycle-process-runner.ts` | Execute builtin-process work through BackgroundManager | ✓ VERIFIED | Owns owned-process path and failure handling. |
| `src/lib/background-manager.ts` | Hardened owned-process execution | ✓ VERIFIED | Allowlist/cwd constraints and queryable failure state intact. |
| `src/lib/delegation-packet.ts` | Export execution metadata for audit/recovery | ✓ VERIFIED | Includes execution family/submode/rationale/capability evidence. |
| `src/lib/injection-engine.ts` | Route-aware specialist injection payloads with audit logging | ✓ VERIFIED | Live payload follows effective specialist lane. |
| `src/lib/governance-engine.ts` | Active governance block-state helper for injections | ✓ VERIFIED | Shared active-block logic now drives injection suppression. |
| `src/hooks/create-core-hooks.ts` | Session-start injection wiring | ✓ VERIFIED | Uses shared active-governance suppression and live route context. |
| `src/hooks/create-session-hooks.ts` | Compaction-time injection wiring | ✓ VERIFIED | Mirrors session-start suppression behavior during compaction. |
| `src/lib/lifecycle-state.ts` | Live delegation metadata builder | ⚠️ HOLLOW | Does not carry `runtimePolicyOverride`, leaving the tool-guard session-override seam unwritten. |
| `src/lib/continuity-normalizers.ts` | Preserve delegation metadata across reload | ⚠️ HOLLOW | Drops `runtimePolicyOverride` during normalization, so override state is not durable. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/plugin.ts` | `src/lib/runtime-policy.ts` | workspace runtime-policy load and dependency injection | ✓ WIRED | `loadRuntimePolicy()` imported and injected into lifecycle/tool guards. |
| `src/lib/lifecycle-manager.ts` | `src/lib/runtime-policy.ts` | resolved queue limit/timeout lookup before acquire | ✓ WIRED | Uses `resolveLifecycleConcurrency()` helper before `acquireLifecycleQueue()`. |
| `src/hooks/create-tool-guard-hooks.ts` | `src/lib/runtime-policy.ts` | per-session budget lookup from continuity/delegation metadata | ⚠️ PARTIAL | Consumer is wired, but producer/persistence path for `runtimePolicyOverride` is missing. |
| `src/tools/delegate-task.ts` | `src/lib/execution-mode.ts` | classification before launchDelegatedSession | ✓ WIRED | Classification happens in live entrypoint before launch. |
| `src/lib/lifecycle-manager.ts` | `src/lib/background-manager.ts` | owned-process execution path | ✓ WIRED | `builtin-process` branch dispatches to process runner with `BackgroundManager`. |
| `src/lib/continuity.ts` | `src/lib/delegation-packet.ts` | persisted execution-family/submode metadata for audit/recovery | ✓ WIRED | Export derives execution metadata from canonical continuity. |
| `src/lib/injection-engine.ts` | `src/hooks/create-core-hooks.ts` | session-start route-aware injection payload | ✓ WIRED | Core hooks call evaluator with live route and active governance state. |
| `src/lib/injection-engine.ts` | `src/hooks/create-session-hooks.ts` | compaction route-aware injection payload | ✓ WIRED | Session hooks call same evaluator during compaction. |
| `src/hooks/create-tool-guard-hooks.ts` | `src/lib/governance-engine.ts` | active-governance evaluation + per-invocation metadata | ✓ WIRED | Before/after hook pair now uses active evaluation and invocation-scoped metadata. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `src/hooks/create-tool-guard-hooks.ts` | `policy.budget.*` | `getRuntimePolicyForSession(workspacePolicy, delegation?.runtimePolicyOverride)` | Workspace policy is real; session override seam is hollow because live metadata never writes/persists `runtimePolicyOverride` | ⚠️ HOLLOW |
| `src/tools/delegate-task.ts` | `execution` | `classifyExecutionMode(buildTaskCharacteristics(...))` | Real execution family/submode metadata flows into lifecycle and continuity | ✓ FLOWING |
| `src/lib/injection-engine.ts` | `specialist-route-guidance` payload | `context.route.effectiveAgent` | Real route-derived specialist payloads for builder/researcher/critic | ✓ FLOWING |
| `src/hooks/create-core-hooks.ts` / `src/hooks/create-session-hooks.ts` | injection suppression state | `buildInjectionGovernanceState()` from active rules | Real active block state; historical violations alone no longer suppress injections | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Bounded Phase 02 touched tests | `CI=true npx vitest run tests/hooks/create-tool-guard-hooks.test.ts tests/tools/delegate-task.test.ts tests/lib/injection-engine.test.ts tests/hooks/create-core-hooks.test.ts tests/hooks/create-session-hooks.test.ts tests/lib/background-manager-harden.test.ts tests/lib/execution-mode.test.ts` | `7` files passed, `79` tests passed | ✓ PASS |
| Type safety | `CI=true npm run typecheck` | `tsc --noEmit` exit `0` | ✓ PASS |
| Build | `CI=true npm run build` | `tsc` exit `0` | ✓ PASS |
| Full suite regression | `CI=true npm test` | `34` files passed, `533` tests passed, `2` files skipped | ✓ PASS |
| Live delegation metadata writes session override | `node --input-type=module -e "import { buildDelegationMeta } from './dist/lib/lifecycle-state.js'; ..."` | Output object had `hasOverride false` | ✗ FAIL |
| Continuity reload preserves session override | `node --input-type=module -e "...write continuity with delegation.runtimePolicyOverride; import('./dist/lib/continuity.js'); ..."` | Reloaded delegation had `hasOverride false` | ✗ FAIL |

### Requirements Coverage

_Limited to requirement IDs declared by plans 02-07/02-08/02-09 because REQUIREMENTS.md was explicitly out of scope for this re-verification._

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `RUN-3c` | `02-07-PLAN.md` | Live concurrency/runtime-policy wiring | ✓ SATISFIED | Queue acquisition now resolves policy before acquire in lifecycle path. |
| `RUN-3h` | `02-07-PLAN.md` | Policy-driven tool budget / circuit breaker | ✗ BLOCKED | Workspace policy is live, but session override metadata is not written/preserved end-to-end. |
| `RUN-3a` | `02-08-PLAN.md` | Execution-mode classification and owned-process routing | ✓ SATISFIED | Delegate-task classification and builtin-process branch are live. |
| `RUN-3b` | `02-08-PLAN.md` | Continuity-backed execution audit metadata | ✓ SATISFIED | Execution metadata persists into continuity and exports. |
| `RUN-3e` | `02-09-PLAN.md` | Runtime governance correctness | ✓ SATISFIED | Active governance suppression and invocation correlation are live. |
| `RUN-3f` | `02-09-PLAN.md` | Injection-engine correctness | ✓ SATISFIED | Route-aware payloads and active-block suppression are covered by fresh tests. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `src/lib/lifecycle-state.ts` | 68-84 | Hollow producer: delegation metadata builder omits `runtimePolicyOverride` entirely | 🛑 Blocker | Live delegated sessions cannot supply session-specific runtime-policy overrides. |
| `src/lib/continuity-normalizers.ts` | 130-156 | Persistence drop: delegation normalizer strips `runtimePolicyOverride` on reload | 🛑 Blocker | Any persisted override would disappear before hydration/recovery. |
| `tests/hooks/create-tool-guard-hooks.test.ts` | 596-730 | Misleading coverage: tests inject `runtimePolicyOverride` directly via `setDelegationMeta()` instead of exercising live write/persist/reload path | ⚠️ Warning | Tests pass while the real production override seam remains hollow. |

### Gaps Summary

Phase 02 is much closer to verified than in the prior report. The major runtime joins from plans 02-08 and 02-09 are now genuinely live: execution classification happens in the real delegate entrypoint, builtin-process work actually runs through `BackgroundManager`, route-aware injections are no longer builder-hardcoded, active governance suppression replaced the stale historical-violation logic, and overlapping tool calls keep their own governance metadata. Fresh bounded tests, typecheck, build, and the full project suite all pass.

But one important gap still blocks an authoritative PASS: the session-specific runtime-policy override seam is not real end-to-end. The tool guard correctly consumes `delegation.runtimePolicyOverride` if it exists, yet the live delegation builder never writes that field and continuity normalization strips it during reload. That means the code supports manual/in-memory overrides in tests, not trusted persisted session overrides in production. Until that seam is written and preserved through continuity, Phase 02 is not fully verified.

---

_Verified: 2026-04-09T02:50:00Z_
_Verifier: the agent (gsd-verifier)_
