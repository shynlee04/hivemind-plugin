- Date: 2026-03-12
- Status: reference
- Last Verified: 2026-03-12
- Parent: `/Users/apple/hivemind-plugin/PLAN.md`
- Category: refactor

# Phase 1 P1-D.1c Archive-Candidate Verification

## Goal

Verify the candidate list in `docs/deep-scan-audit/02-SAFE-TO-ARCHIVE-2026-03-12.md`
against live code, tests, runtime entrypoints, and current `.hivemind` state before any
archive, move, or deletion action is authorized.

## Inputs

1. `docs/deep-scan-audit/02-SAFE-TO-ARCHIVE-2026-03-12.md`
2. `docs/deep-scan-audit/05-RUNTIME-IMPACT-MAP-2026-03-12.md`
3. live consumers in `src/`, `tests/`, `scripts/`, `.opencode/`, and plan/runtime entrypoints

## Decision Rule

Live code and tests win over audit packets.

No archive/remove action is valid unless the candidate proves:

1. zero live imports,
2. zero test dependency,
3. zero runtime/CLI/workflow entrypoint dependency,
4. zero surviving compatibility contract that still matters to Phase 1 migration.

## Verified Classifications

### Retain

These candidates were incorrectly marked as dead.

| File | Live Consumers | Classification | Why |
|---|---|---|---|
| `src/lib/file-lock.ts` | `src/lib/graph/shared.ts`, `src/lib/graph/writer.ts` | `retain` | Still part of graph write safety. |
| `src/lib/orphan-quarantine.ts` | `src/lib/graph/fk-validator.ts`, `src/lib/graph/shared.ts`, orphan-quarantine tests | `retain` | Still part of graph integrity and covered by tests. |
| `src/lib/project-snapshot.ts` | `src/lib/session-governance.ts`, `src/lib/index.ts` | `retain` | Still participates in session-governance output. |
| `src/lib/session-memory-classifier.ts` | `src/tools/hivemind-session-memory.ts`, `tests/v29-context-governance.test.ts`, `src/lib/index.ts` | `retain` | Still used in session-memory flow and test contract. |
| `src/lib/skill-registry.ts` | `tests/skill-resolver.test.ts`, `src/lib/index.ts`, schema coupling via `src/schemas/skill-registry.ts` | `retain` | Still an active resolver surface, not superseded away. |
| `src/lib/tool-activation.ts` | `src/lib/session-governance.ts`, `tests/auto-hooks-pure.test.ts`, `tests/wave2-schema-contract.test.ts`, `src/lib/index.ts` | `retain` | Still part of session-governance and test contract. |

### Compatibility-Only

These are not current canonical authority, but are still intentionally present.

| Surface | Live Consumers | Classification | Why |
|---|---|---|---|
| `src/tools/hivemind-doc-weaver.ts` | `tests/planning-materializer-doc-intel.test.ts`, `src/lib/tool-names.ts` alias normalization, legacy doc references | `compatibility-only` | Wrapper is intentionally retained until caller/alias normalization is complete. |

### Already Absent / Retired Path Classes

These are not active files/directories in the current workspace. They should be treated as
retired compatibility/projection path classes, not as fresh archive actions.

| Surface | Live Status | Classification | Why |
|---|---|---|---|
| `.hivemind/state/runtime-profile.json` | absent | `compatibility` | Still named in ingress policy/tests as a legacy compatibility path, but not live workspace authority. |
| `.hivemind/state/context-recovery.json` | absent | `compatibility` | Same as above. |
| `.hivemind/state/health-metrics.json` | absent | `compatibility` | Same as above. |
| `.hivemind/anchors/` | absent | `projection/compatibility` | Mentioned as readability-era surface, but not live current authority. |
| `.hivemind/mems/` | absent | `projection/compatibility` | Same as above. |
| `.hivemind/INDEX.md` | absent | `projection` | Path contract still exists in `paths.ts` and tests, but it is not live runtime authority. |
| `.hivemind/sessions/index.md` | absent | `projection` | Same as above. |

## What This Packet Changes

1. The deep-scan archive packet is now formally narrowed to candidate-generation only.
2. The first verified `retain / compatibility-only / retired-path-class` ledger now exists.
3. Future archive waves must target real producer debt instead of replaying false-positive “dead code” claims.

## Explicit Non-Actions

This packet does **not**:

1. move files into `.archive/`,
2. delete any `src/lib` surfaces,
3. remove compatibility path handling from ingress policy/tests,
4. remove `hivemind_doc_weaver`,
5. decide the next CQRS cleanup tranche by itself.

## Prepared Next Targets

The next aggressive isolation wave should verify and classify:

1. `scripts/auto-init.sh`, `scripts/detect-entry.sh`, `scripts/classify-intent.sh`
2. `src/tools/hivemind-context.ts`
3. `src/tools/hivemind-plan.ts`
4. startup/planning producer overlap in `src/cli/init.ts`, `src/lib/fs/planning-ops.ts`, and `src/hooks/event-handler.ts`
5. mirror/owner mismatches that still create noise in boundary gates

This packet is subordinate to `PLAN.md` and may not override it.
