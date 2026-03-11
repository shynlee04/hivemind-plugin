# Phase 1 P1-D.1c Archive Candidate Verification

- Date: 2026-03-12
- Status: evidence
- Last Verified: 2026-03-12
- Parent: `/Users/apple/hivemind-plugin/PLAN.md`
- Category: audit

## Purpose

Verify whether `docs/deep-scan-audit/02-SAFE-TO-ARCHIVE-2026-03-12.md` can drive actual archive/remove work.

Rule for this packet:

- deep-scan audit files are candidate generators
- live code, tests, CLI entrypoints, hooks, workflows, and runtime consumers are authority

## Result

The candidate packet is directionally useful, but it is not safe to execute directly.

Verified outcome:

- several `src/lib` candidates labeled "dead" are still runtime- or test-live
- several `.hivemind` compatibility/state surfaces listed for archive are already absent
- `src/tools/hivemind-doc-weaver.ts` is compatibility-only, but not yet removable because it still has a live test consumer

## Verified Classifications

| Surface | Deep-Scan Claim | Live Evidence | Classification | Reason |
|---|---|---|---|---|
| `src/lib/file-lock.ts` | dead | `src/lib/graph/shared.ts`, `src/lib/graph/writer.ts` | `retain` | active graph locking dependency |
| `src/lib/orphan-quarantine.ts` | dead | `src/lib/graph/fk-validator.ts`, `src/lib/graph/shared.ts`, orphan-quarantine tests | `retain` | active graph/orphan handling dependency |
| `src/lib/project-snapshot.ts` | dead | `src/lib/session-governance.ts` | `retain` | still feeds session governance output |
| `src/lib/session-memory-classifier.ts` | dead | `src/tools/hivemind-session-memory.ts`, `tests/v29-context-governance.test.ts` | `retain` | active tool/test consumer |
| `src/lib/skill-registry.ts` | dead | `tests/skill-resolver.test.ts`, schema coupling | `retain` | still part of skill resolution/testing surface |
| `src/lib/tool-activation.ts` | dead | `src/lib/session-governance.ts`, `tests/auto-hooks-pure.test.ts`, `tests/wave2-schema-contract.test.ts` | `retain` | active runtime/test consumer |
| `src/tools/hivemind-doc-weaver.ts` | compatibility wrapper | `tests/planning-materializer-doc-intel.test.ts` | `compatibility-only` | wrapper survives for compatibility/test bridge only |
| `.hivemind/state/runtime-profile.json` | archive | missing in live tree | `archive/remove` | already absent |
| `.hivemind/state/context-recovery.json` | archive | missing in live tree | `archive/remove` | already absent |
| `.hivemind/state/health-metrics.json` | archive | missing in live tree | `archive/remove` | already absent |
| `.hivemind/anchors/` | archive | missing in live tree | `archive/remove` | already absent |
| `.hivemind/mems/` | archive | missing in live tree | `archive/remove` | already absent |
| `.hivemind/INDEX.md` | archive | missing in live tree | `archive/remove` | already absent |
| `.hivemind/sessions/index.md` | archive | missing in live tree | `archive/remove` | already absent |

## Implications

1. `P1-D.1c` must not spend time archiving the six false-positive `src/lib` surfaces above.
2. The next archive/isolation tranche should target real producer debt instead:
   - contract mismatch in `agents/hivefiver.md`
   - CQRS violations in `src/tools/hivemind-context.ts`
   - CQRS violations in `src/tools/hivemind-plan.ts`
   - command/script/workflow surfaces that still shape `.hivemind` or planning outputs without clear ingress authority
3. Compatibility wrappers may stay only if they are clearly marked and consumer-traced.

## Recommended Next Slice

`P1-D.1c` subset 2 should verify and classify live producer surfaces, not dead-code hypotheses:

- `retain` if they still own real runtime/session/planning behavior
- `isolate` if they are noisy donors or duplicate producers
- `compatibility-only` if they are bridges awaiting consumer cutover
- `archive/remove` only if consumer tracing proves zero live imports, zero test dependency, and zero runtime entrypoint references

This packet is evidence only and may not override `PLAN.md`.
