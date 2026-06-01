---
phase: 43
slug: tmux-co-pilot-model-orchestrator-intervention
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-01
verified: 2026-06-01
register_authored_at_plan_time: true
---

# Phase 43 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

This phase integrates the Hivemind runtime with the `@hivemind/opencode-tmux` fork package via a runtime-injection boundary (no cross-package import), exposes a 4-action orchestrator-only tool, and adds pane respawn / list / grid-planning capabilities.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| OpenCode Plugin ↔ `@hivemind/opencode-tmux` | Runtime-injection: fork's `SessionManager` cast to local `ForkSessionManagerAdapter` at wiring boundary; no `import` from the fork package in Hivemind code | `ForkSessionManagerAdapter` shape (sendKeys / listPanes / createPaneGridPlanner / respawnIfKnown / getMainPaneId) |
| Orchestrator Agent ↔ tmux-copilot tool | Permission gate: tool enforces orchestrator identity at execute() runtime via `context.agent` | Agent name (string) checked against `ORCHESTRATOR_AGENT_NAMES` set |
| tmux-copilot ↔ tmux subprocess | All argv routed through `quoteShellArg` (P42 baseline) | Pane IDs, key sequences, layout trees |
| tmux-copilot ↔ pane state | `list-panes` action returns current pane state JSON | Pane IDs, titles, commands, sizes |
| `createTmuxEventObserver` ↔ fork | In this build, observer is fed a no-op `ForkSessionManager` stub (events discarded); production fork wiring deferred to Phase 45+ | `EnrichedSessionEvent` (lost in no-op stub by design) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-43-01 | Tampering | `opencode-tmux/src/tmux.ts` (`sendKeys`) | mitigate | `quoteShellArg` from P42 wraps all argv; literal flag `-l` prevents tmux from interpreting special keys; `await` confirms acceptance, not execution. P42 baseline tested; 97/97 fork tests pass. | closed |
| T-43-02 | Information Disclosure | `opencode-tmux/src/tmux.ts` (`listPanes` stdout) | accept | Pane title and command exposed to orchestrator via structured JSON; same trust level as requester (orchestrator-only). | accepted |
| T-43-03 | Denial of Service | `opencode-tmux/src/grid-planner.ts` (`PaneGridPlanner`) | mitigate | Trailing-edge 500ms debounce coalesces rapid requests; `cancel()` method (`grid-planner.ts:105`) clears pending timer; 11 unit tests pass including `cancel()`. | closed |
| T-43-04 | Spoofing | `opencode-tmux/src/session-manager.ts` (`respawnIfKnown`) | mitigate | `respawnIfKnown` reconstructs enriched event with `hivemindMeta` preserved from `KnownSession` (same-process metadata propagation, 43-01 `fix(fork)`). 4 new tests pass. | closed |
| T-43-05 | Elevation of Privilege | `src/tools/tmux-copilot.ts` | mitigate | `ORCHESTRATOR_AGENT_NAMES` set (`tmux-copilot.ts:34`); runtime check via `context.agent` against the set (`tmux-copilot.ts:129-130`); non-orchestrator returns `{error: {kind: "permission-denied", agent}}`. SDK has no `requiresPermission` field — exported `REQUIRES_PERMISSIONS = ["orchestrator"]` as module const. | closed |
| T-43-06 | Repudiation | `src/tools/tmux-copilot.ts` (result shape) | accept | All results are structured JSON; errors are explicit `{error: {kind, ...}}` discriminated unions. Non-repudiation provided by agent name in the `permission-denied` error path. | accepted |
| T-43-07 | Information Disclosure | `src/tools/tmux-copilot.ts` (`list-panes` result) | accept | Pane titles may contain agent names; caller is orchestrator (same trust level as T-43-02). | accepted |
| T-43-08 | Tampering | `src/features/tmux/fork-bridge.ts` (singleton state) | mitigate | Module-level `let adapter: ForkSessionManagerAdapter \| null = null` (`fork-bridge.ts:113`); replace-only via `setForkSessionManager`; accessed only via `getForkSessionManager` getter. No `import` from `@hivemind/opencode-tmux` (boundary rule honored). 4 unit tests pass. | closed |
| T-43-09 | Denial of Service | `src/tools/tmux-copilot.ts` (tool dispatch) | mitigate | Try/catch wraps entire `execute()`; returns graceful `{available: false}` on tmux absent; `{error: {kind: "permission-denied"}}` on non-orchestrator; tool never throws unhandled. | closed |
| T-43-SC | Tampering | package dependencies | mitigate | No new packages added in either plan (`tech-stack.added: []` in both SUMMARYs); P42 baseline already audited; `package.json` and lockfile unchanged. | closed |

**Totals:** 10 threats — 7 closed, 3 accepted, 0 open.

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-43-02 | T-43-02 | Pane titles + commands are part of the operational state the orchestrator must observe to drive tmux. Exposing them to the orchestrator is by design; same trust level as requester. | gsd-phase-researcher (plan-time) | 2026-06-01 |
| AR-43-06 | T-43-06 | Structured JSON results with `{error: {kind, ...}}` discriminators provide an auditable per-action trail. Full audit log is delegated to the session journal (out of scope for this phase). | gsd-phase-researcher (plan-time) | 2026-06-01 |
| AR-43-07 | T-43-07 | Same rationale as AR-43-02: pane titles may carry agent identity, but the caller is orchestrator-only (gated by T-43-05). | gsd-phase-researcher (plan-time) | 2026-06-01 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-01 | 10 | 7 | 0 | gsd-phase-researcher (short-circuit: `register_authored_at_plan_time: true`, all plan-time mitigations verified against implementation) |

**Verification approach:** Because the threat register was authored at plan time and embedded in `43-01-PLAN.md` / `43-02-PLAN.md` (`<threat_model>` blocks), this audit followed the secure-phase short-circuit path: skip spawning `gsd-security-auditor` and verify each mitigation directly against the implementation. Spot-checks performed:
- T-43-05: `ORCHESTRATOR_AGENT_NAMES` set, `context.agent` check, `{error: {kind: "permission-denied"}}` return path all present in `src/tools/tmux-copilot.ts`.
- T-43-08: `let adapter` module-private, no exported `Map`, replace-only `setForkSessionManager` setter in `src/features/tmux/fork-bridge.ts`.
- T-43-03: `clearTimeout` + `cancel()` method present in `opencode-tmux/src/grid-planner.ts`.

L1 evidence from SUMMARYs (typecheck clean, build clean, 3095 + 97 tests pass) corroborates all other mitigations.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-01
