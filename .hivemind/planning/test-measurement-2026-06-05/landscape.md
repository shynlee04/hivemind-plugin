[LANGUAGE: Write this file in en per Language Governance.]
# Landscape — Test Suite Measurement (2026-06-05)

**Session:** test-measurement-2026-06-05
**Front-facing:** hm-l0-orchestrator
**Status:** ACTIVE — measurement wave (no code changes)
**Stackable check:** none — fresh dispatch

---

## 1. User Intent (verbatim summary)

User wants to understand which tests are heavy/slow/resource-intensive in the
Hivemind plugin test suite (2,963 tests per `AGENTS.md`) before committing to
any structural change. User explicitly chose "Just measure first (no changes)".

## 2. Observed Surface (L0 read scope)

- Repo: `/Users/apple/hivemind-plugin-private`
- Test roots: `tests/{features,tools,sidecar,schema-kernel,task-management,coordination,lib,plugin}/`
- vitest 4.1.7 (single workspace, no projects)
- `package.json` scripts: `test`, `test:watch`, `test:coverage` — no tiering
- `vitest.config.ts`: 1 setup file (`vitest.setup.ts`), v8 coverage opt-in, no pool tuning, no sharding
- Heavy candidate zones (by file count, NOT measured yet):
  - `tests/features/session-tracker/` (~15 files)
  - `tests/sidecar/` (~20 files, separate config)
  - `tests/tools/delegation/delegate-task-e2e.test.ts` (e2e)

## 3. Domains Activated

- **Research** — investigate which files are slow and why
- **Quality** — test health & cost profile
- **Debug** — bottleneck profiling

[LANGUAGE: Write this file in en per Language Governance.]
## 4. Path Decision

- **Coordinated-path, L0-driven**: `hm-coordinator` is NOT a registered OpenCode
  agent type. L0 dispatches 3 waves sequentially to L2/L3 specialists, validates
  each return, and dispatches the next. Depth ceiling = 1 (L0 → L2/L3 only).
- Rationale: 3 distinct specialist roles (investigation / measurement / synthesis)
  that benefit from L0 verification between waves.

## 5. Wave Plan (L0-orchestrated, sequential)

### Wave 1 — Test Structure Investigation
- Target: `hm-l3-detective`
- Allowed reads: `tests/**`, `vitest.config.ts`, `sidecar/vitest.config.ts`,
  `package.json`, `sidecar/package.json`, `vitest.setup.ts`, `tests/fixtures/`
- Produce `.hivemind/planning/test-measurement-2026-06-05/TEST-STRUCTURE-MAP.md`
- Return gate: artifact exists, classifies files, ranks by structural complexity

### Wave 2 — Live Measurement Run (after Wave 1 PASS)
- Target: `hm-l2-executor` (or scout with bash capability)
- Run commands from repo root, capture output:
  1. `time npx vitest run 2>&1 | tee measurement-full.txt`
  2. `time npx vitest run tests/features/session-tracker/ 2>&1 | tee measurement-session-tracker.txt`
  3. `time npx vitest run tests/sidecar/ 2>&1 | tee measurement-sidecar.txt`
  4. `time npx vitest run tests/tools/delegation/ 2>&1 | tee measurement-delegation.txt`
  5. `time npx vitest run --coverage 2>&1 | tee measurement-coverage.txt`
  6. `time npx vitest run --reporter=verbose 2>&1 | tee measurement-verbose.txt`
- Timeout abort: 10 min per command, log partial
- Produce `.hivemind/planning/test-measurement-2026-06-05/MEASUREMENT-RAW.md`

### Wave 3 — Synthesis Report (after Wave 2 PASS)
- Target: `hm-l2-synthesizer`
- Produce `.hivemind/planning/test-measurement-2026-06-05/TEST-MEASUREMENT-REPORT.md`
- With: top-20 slowest files table, per-zone cost, coverage overhead delta,
  root cause categorization, Path A/B/C recommendation matrix

## 6. Artifact Inventory (target)

| Artifact | Domain | Evidence Level | Producer |
|----------|--------|----------------|----------|
| `.hivemind/planning/test-measurement-2026-06-05/TEST-STRUCTURE-MAP.md` | research | L4 (file scan) | l3-detective |
| `.hivemind/planning/test-measurement-2026-06-05/MEASUREMENT-RAW.md` | quality | L1 (live runtime) | l2-executor |
| `.hivemind/planning/test-measurement-2026-06-05/TEST-MEASUREMENT-REPORT.md` | quality | L1 + L4 | synthesizer |

## 7. Gate Expectations

- **gate-lifecycle-integration** — N/A for measurement (no code touched)
- **gate-spec-compliance** — report must include slow-file table + command provenance
- **gate-evidence-truth** — every duration claim must be backed by a captured vitest run output (file:line or block quote)

## 8. Non-Goals

- No code changes
- No vitest.config edits
- No package.json edits
- No new test files
- No new dependencies

## 9. Escalation

- If vitest run exceeds 10 min and shows no progress: escalate to user with partial data
- If any subagent returns without artifacts: re-dispatch with explicit artifact path requirement
- If measurement reveals unknown tool/feature (e.g., bun-pty path): note and continue, do not block
