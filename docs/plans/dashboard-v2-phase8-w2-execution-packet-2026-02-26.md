# Dashboard-v2 Phase 8 W2 Execution Packet

> Date: 2026-02-26
> Wave: `W2` (Interaction Completeness)
> Coordinator: main session only
> Source context: local artifacts + `.hivemind/` only

---

## 1) High-Level Context Pack (Preloaded)

Loaded strategic sources for this wave:
- `docs/plans/dashboard-v2-phase8-orchestration-loop-2026-02-26.md`
- `docs/plans/dashboard-v2-comprehensive-inventory-2026-02-26.md`
- `docs/plans/dashboard-v2-overhaul-plan-2026-02-26.md`
- `.hivemind/state/brain.json`
- `.hivemind/state/hierarchy.json`
- `.hivemind/state/anchors.json`
- `.hivemind/graph/trajectory.json`

Current trajectory/tactic/action continuity:
- Trajectory: deep full-surface inventory and control-plane buildout
- Tactic: Phase 8 orchestration loop with gate discipline
- Action: W1.delta passed; transition to next wave packet

Immutable anchor in force:
- `dashboard_v2.delegation_constraint`
- Rule: no sub-of-sub delegation; all level-2 outputs return directly to coordinator

---

## 2) W2 Objective

Complete interaction paths across dashboard-v2 so operator workflows are reliable and testable.

Wave scope (from Phase 8 catalog):
- Input modal paths
- Language toggle
- Help overlay interaction map
- Keyboard and mouse interaction matrix

Out of scope:
- SSE spine (W1)
- Observability panel contracts (W3)
- Recovery semantics and rollback matrix (W4)

---

## 3) Entry / Exit Criteria

Entry criteria:
- W1.delta gate marked pass with evidence
- Anchor constraint verified
- W2 scope lock accepted without mixed objectives

Exit criteria:
- Interaction matrix completed for keyboard and mouse paths
- Modal flows are deterministic (`open -> input -> submit/cancel -> close`)
- Language toggle path defined and verified (`EN <-> VI`)
- Help overlay path defined and verified (`open/close`, conflict-free with modal focus)

---

## 4) Interaction Matrix Contract

Required matrix lanes:
- Keyboard lane
  - `c`, `m`, `x`, `t`, `a`, `l`, `?`, `q`, tab navigation
- Modal lane
  - open conditions, focus rules, submit/cancel semantics
- Language lane
  - persisted language source of truth + runtime switch behavior
- Mouse lane
  - supported clickable targets + fallback when mouse disabled

Each row must include:
- Trigger
- Preconditions
- State transition
- Expected UI feedback
- Failure handling

---

## 5) Delegation Contract (Level-2 Only)

Task envelope required in every level-2 dispatch:
- Task: exact W2 sub-lane objective
- Scope: explicit files, explicit no-touch list
- Return format: changed files, strategy, command evidence, residual risks
- Success metric: compile/test gates pass
- Acceptance criteria: W2 row(s) complete in matrix
- Constraints:
  - No sub-of-sub delegation
  - No external research
  - Local repo and local node_modules only

Mandatory footer:
- `ABSOLUTE BAN: Do NOT delegate to any subagent. Return results directly to main orchestrator session.`

---

## 6) Gate Matrix (W2)

Pre-gate:
- Scope lock verified (`W2 only`)
- Context pack attached to delegation prompt
- Anchor constraint restated in prompt

In-gate:
- One interaction lane at a time
- Coordinator verifies each return before next lane
- No undocumented scope expansion

Post-gate:
- `cd /Users/apple/hivemind-plugin/src/dashboard-v2 && bunx tsc --noEmit`
- `cd /Users/apple/hivemind-plugin && npx tsc --noEmit`
- `cd /Users/apple/hivemind-plugin && npm test`
- Exit criteria adjudicated pass/partial/fail

---

## 7) W2 Sub-Lanes (Execution Order)

W2.1 Modal determinism
- Focus ownership and close behavior
- Confirm no keyboard bleed-through while modal open

W2.2 Language toggle completeness
- Ensure toggle path wired and persisted semantics validated

W2.3 Help overlay interaction map
- Define/verify open-close behavior and conflict handling with modal + navigation

W2.4 Mouse path declaration
- Explicitly map current mouse-supported paths or mark deferred with Phase 9 obligation

Status:
- W2.1 ✅ COMPLETE
- W2.2 ✅ COMPLETE
- W2.3 ✅ COMPLETE
- W2.4 ⚠️ PARTIAL (documented mouse-unsupported lane with controlled defer)

---

## 8) Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Modal state conflicts with global keys | High | Medium | lane-local verification before moving on |
| Language toggle side effects in runtime-specific env | Medium | Medium | isolate i18n state transition checks |
| Help overlay collides with modal/input focus | Medium | Medium | explicit precedence rules in matrix |
| Mouse expectations exceed current component contracts | Medium | High | mark unsupported interactions explicitly |

---

## 9) Phase 9 Linkage (If Deferred)

If any W2 lane is deferred:
- Emit reliability obligation (focus and input safety)
- Emit refactor obligation (interaction-state ownership)
- Emit verification obligation (E2E interaction script)

No silent carry-forward permitted.

W2.4 defer obligations emitted:
- P9.1 Reliability owner: dashboard-v2 maintainers; verify explicit mouse-event gating and fallback-safe no-op behavior on unsupported terminals.
- P9.2 Refactor owner: dashboard-v2 maintainers; verify interaction ownership model if mouse support is introduced (pointer event routing by panel).
- P9.3 Verification owner: QA/release lane; verify end-to-end mouse + keyboard mixed-input regression checklist before production readiness gate.

---

## 10) W2.4 Mouse Audit Disposition (Closeout)

Code evidence (local repo, no external sources):
- `src/dashboard-v2/src/index.tsx:239` calls `createCliRenderer()` with no mouse options object.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:34` handles tab-next via keyboard chunks only.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:38` handles tab-prev via keyboard chunks only.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:42` maps refresh to `r`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:47` maps session-create to `c`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:55` maps message to `m`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:68` maps command to `x`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:81` maps todos to `t`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:106` maps agents view action to `a`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:115` maps numeric tab jump `1..7`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:125` maps help overlay toggle to `?`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:129` maps exit to `q`/Ctrl-C.
- `src/dashboard-v2/src/snapshot.ts:423` declares boundary: "Keyboard-first navigation only; no hidden mouse-only behavior".

W2.4 gate decision:
- `partial` (no explicit mouse-interaction contract in runtime path; keyboard fallback is explicit and documented)

W2 exit adjudication:
- `partial-closeout` for interaction completeness in current architecture.
- Keyboard/modal/language/help lanes are complete.
- Mouse lane is formally deferred to Phase 9 obligations with explicit owners and verification requirements.
