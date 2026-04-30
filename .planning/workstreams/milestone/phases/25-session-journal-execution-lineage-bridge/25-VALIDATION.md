---
phase: 25
slug: session-journal-execution-lineage-bridge
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-25
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/lib/session-journal.test.ts tests/lib/execution-lineage.test.ts tests/tools/session-journal-export.test.ts` |
| **Event-tracker correction command** | `npx vitest run tests/lib/event-tracker/session-artifact-parser.test.ts tests/lib/event-tracker/session-journey-events.test.ts tests/plugins/plugin-lifecycle.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~60 seconds for quick command |

## Sampling Rate

- **After every task commit:** Run the task-specific `npx vitest run ...` command in the corresponding PLAN.md.
- **After every plan wave:** Run `npm run typecheck` and the quick run command.
- **Before `/gsd-verify-work`:** `npm run typecheck` and `npm test` must be green.
- **Max feedback latency:** 60 seconds for focused tests.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 1 | ROADMAP-25, JOURNAL-01, D-05, D-06, D-07, D-16 | T-25-01, T-25-02 | Journal entries classify canonical/audit/projection, are append-only/replay-friendly, and reject malformed required fields. | unit | `npx vitest run tests/lib/session-journal.test.ts` | ✅ | ✅ green |
| 25-01-02 | 01 | 1 | HIVEMIND-ROOT-01, D-04, D-16 | T-25-03 | `.hivemind/` categories declare owner/schema/index/retention/rebuild and projection/audit markers without adding `.opencode/` state. | unit/static | `npx vitest run tests/lib/session-journal.test.ts` | ✅ | ✅ green |
| 25-02-01 | 02 | 2 | JOURNAL-03, D-08, D-09, D-10 | T-25-04 | Lineage derives from existing inputs as a rebuildable projection and does not write terminal status. | unit | `npx vitest run tests/lib/execution-lineage.test.ts` | ✅ | ✅ green |
| 25-02-02 | 02 | 2 | JOURNAL-02, D-10, D-12 | T-25-05 | Projection records preserve evidence source and parent/child links for query/export surfaces. | unit | `npx vitest run tests/lib/execution-lineage.test.ts` | ✅ | ✅ green |
| 25-03-01 | 03 | 3 | JOURNAL-02, D-11, D-12 | T-25-06 | Tool returns JSON contract and Markdown summary without exposing raw firehose data. | tool unit | `npx vitest run tests/tools/session-journal-export.test.ts` | ✅ | ✅ green |
| 25-03-02 | 03 | 3 | HIVEMIND-ROOT-01, D-02, D-03, D-13 | T-25-07 | Plugin wiring registers read/export tool only; no canonical writer cutover or `.opencode/` state write. | typecheck/tool unit | `npm run typecheck && npx vitest run tests/tools/session-journal-export.test.ts` | ✅ | ✅ green |
| 25-04-01 | 04 | 4 | ROADMAP-25, JOURNAL-02, HIVEMIND-ROOT-01 | T-25-08 | Event-tracker accepts canonical OpenCode event shape and writes paired `.hivemind/event-tracker/ses_xxxx.{json,md}` artifacts automatically. | integration/unit | `npx vitest run tests/lib/event-tracker/session-journey-events.test.ts tests/plugins/plugin-lifecycle.test.ts` | ✅ | ✅ green |
| 25-04-02 | 04 | 4 | ROADMAP-25, JOURNAL-02 | T-25-09 | Manual session exports parse actors, main/sub-session delegation, bounded last output, and merge into root artifact without limitless files. | fixture e2e | `npx vitest run tests/lib/event-tracker/session-artifact-parser.test.ts tests/lib/event-tracker/session-journey-events.test.ts` | ✅ | ✅ green |
| 25-04-03 | 04 | 4 | ROADMAP-25 | T-25-10 | Writer surfaces malformed JSON and preserves monotonic timestamps for out-of-order events. | unit | `npx vitest run tests/lib/event-tracker/session-journey-events.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Requirements

Existing vitest infrastructure covers all phase requirements. No framework install is required.

## Manual-Only Verifications

All phase behaviors have automated verification.

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all MISSING references.
- [x] No watch-mode flags.
- [x] Feedback latency target < 60s for focused tests.

**Approval:** complete — `npm run typecheck`, focused Phase 25 event-tracker/plugin vitest suite (3 files, 20 tests), `npm run build`, and `npm test` (857 passed, 1 todo, 1 skipped) passed on 2026-04-26.
