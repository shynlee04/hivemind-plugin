# Phase 49: Tmux E2E Completion — Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the runtime gap for tmux end-to-end: register the existing `tmux-copilot` tool in `src/plugin.ts`, replace the `buildNoopForkSessionManager()` no-op with runtime bridge lookup, wire co-pilot adapter injection, add BATS to CI, run BATS suite, and close outstanding paperwork gaps from P42 and P45.

This is a **wiring and paperwork closure phase** — all source deliverables (tmux-copilot tool, fork-bridge, observers, integration factory) exist but are not connected to the runtime plugin surface. The phase connects them and validates the chain.
</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**7 requirements are locked.** See `49-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `49-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- `src/plugin.ts` modifications: import + register `tmuxCopilotTool`, update observer wiring to use runtime bridge lookup
- `src/features/tmux/` modifications: any needed adapter wiring entry points
- `.github/workflows/ci.yml` modification: add BATS job/step
- Phase 42 paperwork: VERIFICATION.md + UAT.md (retrospective — documents what was already delivered)
- Phase 45 paperwork: 45-01-SUMMARY.md (retrospective — documents plan 01 outcomes)
- P43 re-verification: stricter REQ-05 verification with updated wiring
- BATS suite execution: run existing `tests/scripts/sync-fork.bats` and capture pass/fail evidence

**Out of scope (from SPEC.md):**
- Fork code modifications (opencode-tmux/) — the vendored fork is not changed in this phase
- New tmux-copilot tool actions — only registration of existing 4 actions
- Phase 44 features (visual dependency graph, session-tracker replay) — separate phase
- Phase 46/47/48 (build pipeline, docs, CI/CD release) — separate phases
- Modifying the fork-bridge interface — adding new methods to ForkSessionManager is out of scope
- Creating new BATS test scenarios — only running the existing suite
- Adding BATS coverage for tmux-copilot tool — shell-testing Hivemind TypeScript tools is out of scope
</spec_lock>

<decisions>
## Implementation Decisions

### Tool Registration (REQ-01)
- **D-01:** `tmuxCopilotTool` is imported at the top of `src/plugin.ts` from `"./tools/tmux-copilot.js"` and added to the tools array. Minimal change (~3 LOC import + 1 LOC array entry). No changes to the tool itself.

### Observer Wiring — Runtime Bridge Lookup (REQ-02)
- **D-02:** Change the observer factory call at `src/plugin.ts:594-595` to use `getForkSessionManager()` from the fork-bridge at runtime, instead of passing `buildNoopForkSessionManager()` at compile time. The `createTmuxEventObserver` factory still accepts a `ForkSessionManager` parameter, but the caller passes the runtime lookup: `createTmuxEventObserver(getForkSessionManager() ?? buildNoopForkSessionManager())`. This keeps the noop fallback for the unwired case while enabling the runtime path.
- **D-03:** `buildNoopForkSessionManager()` is retained as the fallback adapter — not deleted. Its existence at `src/plugin.ts:215` documents the noop contract. No changes to its implementation.

### Co-pilot Adapter Injection (REQ-03)
- **D-04:** The integration factory `createTmuxIntegrationIfSupported()` at `src/plugin.ts:408` is enhanced to detect the vendored fork code at `opencode-tmux/` and, if present and compilable, construct a minimal `ForkSessionManagerAdapter` and call `setForkSessionManager()`. The bridge pattern (no compile-time import of fork code) is preserved — the adapter is structurally typed.
- **D-05:** Detection mechanism: check for the vendored fork directory at project root (`opencode-tmux/`). If found, attempt to require/resolve the fork's SessionManager via the vendored path. If not found, skip — the bridge remains null, tool returns `fork-not-wired`.

### BATS in CI (REQ-04)
- **D-06:** Add a BATS job to `.github/workflows/ci.yml` that runs on a single Linux matrix node (node-version: 22). Install bats via `npm install -g bats` and run `bats tests/scripts/sync-fork.bats`. If BATS is unavailable, the step is skipped with a warning rather than failing the pipeline (graceful degradation).

### Paperwork (REQ-05, REQ-06)
- **D-07:** P42 paperwork is retrospective — documents already-delivered work. VERIFICATION.md covers P42's 5 requirements (fork extension, metadata titles, plugin integration, auto-init, graceful degradation) with pass/fail evidence from existing code. UAT.md documents ≥3 test scenarios.
- **D-08:** P45 45-01-SUMMARY.md is retrospective — documents plan 01 outcomes (`scripts/sync-fork.sh` creation, pinned-file conflict detection). Verification status: delivered and verified.

### P43 Re-verification (REQ-07)
- **D-09:** Run `gsd-verify-work` for P43 with stricter REQ-05 (runtime-injection boundary) validation. The runtime bridge lookup (D-02) satisfies the stricter check — the observer now reads from the bridge at runtime instead of using a compile-time noop.

### the agent's Discretion
- BATS CI job exact syntax and position in the workflow YAML (the step structure is standard — discretion on where to place it in the job sequence).
- Order of atomic commits (discretion on sequence, but each REQ should be a separate commit per SPEC constraint).

### Folded Todos
- **Todo: "Fork opencode-tmux and Audit Codebase"** — folded into phase scope. Relevance: the audit/documentation of the fork is addressed by the co-pilot adapter injection (REQ-03) and P42/P45 paperwork closure (REQ-05/REQ-06). Score: 0.6.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Spec
- `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-SPEC.md` — Locked requirements (7), boundaries, acceptance criteria (11). MUST read before planning.

### Source Files (existing code)
- `src/plugin.ts` — Composition root. Lines 49-51, 98, 206-215, 403-413, 594-595 contain tmux integration wiring that will be modified.
- `src/tools/tmux-copilot.ts` — Existing tmux-copilot tool (189 LOC, 4 actions). Currently defined but NOT registered in plugin.ts tool array.
- `src/features/tmux/fork-bridge.ts` — Opaque singleton bridge with `setForkSessionManager`/`getForkSessionManager`. Never wired — adapter is always null.
- `src/features/tmux/observers.ts` — Event observer factory. Currently receives compile-time `ForkSessionManager`. Will switch to runtime bridge lookup.
- `src/features/tmux/integration.ts` — Integration factory. Called at plugin.ts:408 without `forkSessionManager` arg. Will be enhanced to auto-detect vendored fork.

### Predecessor Phases
- `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/` — P42 delivery: fork extension, metadata titles, plugin integration, auto-init. Missing VERIFICATION.md and UAT.md (to be created by this phase).
- `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/` — P43 delivery: tmux-copilot tool, fork-bridge, observers. Existing VERIFICATION.md and UAT.md. REQ-05 needs re-verification with updated wiring.
- `.planning/phases/45-vendor-sync-script-2026-06-01/` — P45 delivery: sync-fork.sh + BATS tests. 45-02-SUMMARY.md exists; 45-01-SUMMARY.md missing (to be created by this phase).

### CI and Tests
- `.github/workflows/ci.yml` — CI pipeline. No BATS currently. Will add BATS job for sync-fork.bats.
- `tests/scripts/sync-fork.bats` — Existing BATS test suite (210 LOC, 3 scenarios). To be run in CI.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`tmuxCopilotTool`** (`src/tools/tmux-copilot.ts`): 189 LOC, 4 actions (send-keys, list-panes, compute-grid, respawn), Zod discriminated union, orchestrator-tier permission gate. Already has graceful `fork-not-wired` fallback. Does NOT need any code changes — only needs registration.
- **`ForkSessionManagerAdapter`** (`src/features/tmux/fork-bridge.ts`): Structural typing interface. `getForkSessionManager()` returns null when unwired — the tool handles this gracefully.
- **`createTmuxEventObserver`** (`src/features/tmux/observers.ts`): Enriches `session.created` events with delegation metadata. Already production-ready.

### Established Patterns
- **Bridge pattern**: Hivemind never imports fork code directly. Structural types ensure zero compile-time coupling. This pattern is preserved for all tmux integration.
- **Graceful degradation**: All tmux features handle the unwired case. Tool returns `{available: false, reason: "fork-not-wired"}`. No crashes, no errors.
- **Observer pattern**: Event observers are registered in the hooks array. The tmux observer follows the same pattern as other `session.created` observers.

### Integration Points
- **`src/plugin.ts` tools array**: Line ~650+. Add `tmuxCopilotTool` to the exported tools array.
- **`src/plugin.ts` integration initialization**: Line 408. `createTmuxIntegrationIfSupported()` — currently called without forkSessionManager. Enhancement point for auto-detection.
- **`src/plugin.ts` observer registration**: Lines 594-595. Currently hardcodes `buildNoopForkSessionManager()`. Wire point for runtime bridge lookup.
- **`.github/workflows/ci.yml`**: Add BATS job/step after existing test jobs. Single Linux node (node-version 22).

### Verification Notes
- `grep -c "tmuxCopilot" src/plugin.ts` must return ≥2 after tool registration
- `npm run typecheck` must exit 0
- `npm test` must pass (2900+ tests)
- When bridge is null, the tool must still return `fork-not-wired` — verify with existing tests
- BATS suite: `bats tests/scripts/sync-fork.bats` — 3/3 scenarios pass
</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the locked SPEC.md — implementation follows the standard patterns documented above. All 7 requirements have clear acceptance criteria.

**Key principle from SPEC.md constraints:** Bridge pattern preserved (no compile-time fork imports), backward compatibility when fork is absent, atomic commits per requirement.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)
None — the single matching todo was folded into scope.
</deferred>

---

*Phase: 49-close-tmux-end-to-end-gap*
*Context gathered: 2026-06-01*
