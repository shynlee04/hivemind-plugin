---
phase: 14
slug: delegate-task-truth-reset-archive-phases-09-13-remove-trash
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-18
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest v4.1.4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/lib/delegation-manager.test.ts` |
| **Full suite command** | `npm test` |
| **Type-check command** | `npm run typecheck` |
| **Estimated runtime** | ~5 seconds (351+ tests) |

---

## Sampling Rate

- **After every task commit:** Run delegation-specific tests: `npx vitest run tests/lib/delegation-manager.test.ts tests/tools/delegate-task.test.ts tests/tools/delegation-status.test.ts`
- **After every wave merge:** Run `npm test && npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite green + typecheck pass
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | REQ-14-05 — WaiterModel types replace sync/async types | Delegation types have no sync/async mode, safetyCeilingMs optional, stability fields present | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "types"` | ❌ Wave 0 | — |
| 14-01-02 | 01 | 1 | REQ-14-05 — dispatch() returns immediately with delegation ID | dispatch() creates child session, returns ID, does not block | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "dispatch"` | ❌ Wave 0 | — |
| 14-01-03 | 01 | 1 | REQ-14-06 — Hybrid persistence writes on every state transition | delegations.json updated on dispatch, completion, error, abort | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "persist"` | ❌ Wave 0 | — |
| 14-01-04 | 01 | 1 | REQ-14-06 — recoverPending() restores running delegations | Plugin load re-registers running delegations, re-attaches completion detection | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "recover"` | ❌ Wave 0 | — |
| 14-01-05 | 01 | 1 | REQ-14-05 — Concurrent delegations tracked independently | Multiple dispatch() calls produce unique IDs, independent state machines | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "concurrent"` | ❌ Wave 0 | — |
| 14-01-06 | 01 | 1 | REQ-14-05 — Dual-signal completion (session.idle + stability) | CompletionDetector.watch() fires after stability threshold met | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "dual-signal"` | ❌ Wave 0 | — |
| 14-01-07 | 01 | 1 | REQ-14-05 — Safety ceiling aborts zombie sessions | Session aborted when safetyCeilingMs exceeded, state set to error | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "safety"` | ❌ Wave 0 | — |
| 14-02-01 | 02 | 2 | REQ-14-05 — delegate-task tool dispatches and returns ID | Tool returns delegation ID immediately, no sync/async param | unit | `npx vitest run tests/tools/delegate-task.test.ts` | ❌ Wave 0 | — |
| 14-02-02 | 02 | 2 | REQ-14-05 — delegation-status tool polls and retrieves | Tool returns current status, result when completed, error on invalid ID | unit | `npx vitest run tests/tools/delegation-status.test.ts` | ❌ Wave 0 | — |
| 14-02-03 | 02 | 2 | REQ-14-08 — AGENTS.md "broken" line removed | grep confirms no "delegate-task is broken" in AGENTS.md | manual | `grep -r "broken" AGENTS.md` | — | — |
| 14-02-04 | 02 | 2 | REQ-14-05 — plugin.ts registers both tools | Both delegate-task and delegation-status appear in plugin tool list | unit | `npx vitest run tests/` + `grep` | ❌ Wave 0 | — |
| 14-03-01 | 03 | 3 | REQ-14-07 — Tests are runtime-truthful | Tests exercise real state transitions, real error shapes, NOT mocked SDK calls | manual | Code review of test files | — | — |
| 14-03-02 | 03 | 3 | REQ-14-07 — Full test suite passes | `npm test` green with 351+ tests | unit | `npm test` | — | — |

---

## Decision Validation Map

| Decision | Validation Task | How Verified |
|----------|----------------|--------------|
| D-02 (WaiterModel always-background) | 14-01-02 | dispatch() returns immediately, no sync/async split |
| D-03 (concurrent, tracked independently) | 14-01-05 | Multiple dispatch() calls → unique IDs, independent state |
| D-04 (dual-signal + hybrid persistence) | 14-01-03, 14-01-06 | Persistence on transition + CompletionDetector integration |
| D-08 (runtime-truthful tests) | 14-03-01 | Code review: no SDK mock, real state transitions |
| D-10 (remove "broken" from AGENTS.md) | 14-02-03 | grep confirmation |
| D-11 (SDK parentID) | 14-01-02 | dispatch() passes parentID to session.create() |
| D-12 (dual-signal locked) | 14-01-06 | Stability threshold met before completion confirmed |
| D-13 (no fixed timeouts) | 14-01-07 | safetyCeilingMs is ceiling, not deadline |
| D-14 (dedicated status tool) | 14-02-02 | New tool exists, independent from delegate-task |

---

## Wave 0 Gaps

- [ ] `tests/lib/delegation-manager.test.ts` — covers REQ-14-05, REQ-14-06 (dispatch, dual-signal, persistence, recovery, concurrency)
- [ ] `tests/tools/delegate-task.test.ts` — covers REQ-14-05 tool layer (dispatch, schema validation)
- [ ] `tests/tools/delegation-status.test.ts` — covers REQ-14-05 status tool (poll, retrieve, error)
- [ ] Framework is installed (vitest v4.1.4) — no install needed

---

## Smoke Test (Manual)

The user should run this smoke test after Phase 14 execution to validate SDK assumptions:

1. Create child session via `client.session.create({ body: { parentID } })`
2. Prompt it via `client.session.prompt()`
3. Wait for `session.idle` event
4. Read messages via `client.session.messages()`

This validates assumptions A1–A6 from the research file.
