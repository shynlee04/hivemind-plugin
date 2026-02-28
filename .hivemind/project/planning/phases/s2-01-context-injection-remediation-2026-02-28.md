# S2-01 Context Injection Remediation Plan (2026-02-28)

## Phase Intent

Restore Sector-2 context-injection reliability to unlock downstream S2 phases by removing current NO-GO hard blockers, enforcing deterministic gate flow, and producing auditable evidence that the lifecycle chain is stable and non-polluting.

## Evidence Inputs (Latest)

- `.hivemind/project/planning/research/sector2-validation-2026-02-28/sector2-validation-baseline-2026-02-28.md`
- `.hivemind/project/planning/research/sector2-intelligence-uplift-blueprint-2026-02-28.md`
- `.hivemind/project/planning/research/agentic-standards-benchmark-2026-02-28.md`
- `.hivemind/project/planning/ROADMAP.md`
- `docs/HIVEMIND-FRAMEWORK-AUDIT-CRITERIA.md`

## Active Hard Blockers (Must Be Cleared)

1. `validate-framework` hard FAIL conditions (`R01`, `R01b`).
2. Unknown permission key `mcp` in agent definitions (currently observed in `agents/hiveminder.md`, `agents/hiverd.md`).
3. Ecosystem health gate red (`healthy=false`) caused by `init` and `config` failures.
4. Core parity drift (`53 mismatches`) indicating source-of-truth divergence.

---

## Execution Knots (High-Level, Executable)

### Knot 1 - Baseline Lock and Scope Freeze

- **Objective**: Freeze a trusted S2-01 baseline and bind all remediation work to explicit blocker IDs and acceptance metrics.
- **Dependencies**: none (entry knot).
- **Owner Agent**: `hiveplanner`.
- **In-Scope Paths (Sector-2 only)**:
  - `.hivemind/project/planning/research/**`
  - `.hivemind/project/planning/phases/**`
  - `.hivemind/project/planning/ROADMAP.md`
  - `docs/**`
- **Gate**:
  - Baseline artifact set is complete and immutable for this cycle.
  - Blocker list + thresholds are written and referenced by all downstream knots.
- **Evidence Artifacts**:
  - `.hivemind/project/planning/research/sector2-validation-2026-02-28/sector2-validation-baseline-2026-02-28.md`
  - `.hivemind/project/planning/phases/s2-01-context-injection-remediation-2026-02-28.md` (this plan)

### Knot 2 - Contract and Permission Schema Realignment (R01/R01b)

- **Objective**: Remove contract-level validation failures by restoring compliant agent contract shape and permission keys.
- **Dependencies**: Knot 1.
- **Owner Agent**: `hiveminder` (with verifier support from `hivefiver` for contract checks).
- **In-Scope Paths (Sector-2 only)**:
  - `agents/**`
  - `.opencode/agents/**`
  - `commands/**`
  - `workflows/**`
  - `skills/**`
  - `docs/**`
- **Gate**:
  - `R01` and `R01b` no longer appear as FAIL in framework validation output.
  - Agent metadata/permissions are schema-compliant and role boundaries remain explicit.
- **Evidence Artifacts**:
  - `.hivemind/project/planning/research/s2-01-k2-framework-validate-2026-02-28.txt`
  - `.hivemind/project/planning/research/s2-01-k2-contract-diff-2026-02-28.md`

### Knot 3 - Ecosystem Init/Config Health Recovery

- **Objective**: Turn ecosystem health from red to green by resolving failing `init` and `config` checks without touching `src/**` or `tests/**`.
- **Dependencies**: Knot 1.
- **Owner Agent**: `hiveminder`.
- **In-Scope Paths (Sector-2 only)**:
  - `.hivemind/**`
  - `.opencode/**`
  - `docs/**`
  - project root config artifacts used by ecosystem checks
- **Gate**:
  - `ecosystem-check` reports `healthy=true`.
  - `init` and `config` checks both pass.
- **Evidence Artifacts**:
  - `.hivemind/project/planning/research/s2-01-k3-ecosystem-check-2026-02-28.json`
  - `.hivemind/project/planning/research/s2-01-k3-config-integrity-2026-02-28.md`

### Knot 4 - Core Parity Drift Elimination

- **Objective**: Resolve source-of-truth parity mismatches to restore deterministic framework behavior.
- **Dependencies**: Knot 2 and Knot 3.
- **Owner Agent**: `hivefiver`.
- **In-Scope Paths (Sector-2 only)**:
  - `agents/**`
  - `commands/**`
  - `workflows/**`
  - `skills/**`
  - `.opencode/**`
  - `docs/**`
- **Gate**:
  - Core parity drift reduced from `53 mismatches` to `0`.
  - No new validation regressions introduced in already-green checks.
- **Evidence Artifacts**:
  - `.hivemind/project/planning/research/s2-01-k4-parity-report-2026-02-28.json`
  - `.hivemind/project/planning/research/s2-01-k4-sync-log-2026-02-28.md`

### Knot 5 - Context-Injection Guardrail Validation (Rank-1 Focus)

- **Objective**: Validate Context Injection Remediation acceptance conditions (duplication/pollution controls, deterministic gate behavior, token budget).
- **Dependencies**: Knot 4.
- **Owner Agent**: `hiveplanner` (verification orchestration) + `hiveminder` (execution evidence).
- **In-Scope Paths (Sector-2 only)**:
  - `docs/**`
  - `.hivemind/project/planning/**`
  - governance/audit criteria artifacts in Sector-2 docs
- **Gate**:
  - Phase acceptance targets are evidenced: `<1200 tokens/turn steady state`, `0 P0 duplication`, `0 P0 pollution`.
  - Transition guards `D-02`, `D-07`, `D-10`, `D-13`, `D-14` are each explicitly validated with pass/fail records.
- **Evidence Artifacts**:
  - `.hivemind/project/planning/research/s2-01-k5-context-injection-evidence-2026-02-28.md`
  - `.hivemind/project/planning/research/s2-01-k5-transition-guards-2026-02-28.md`

### Knot 6 - S2-01 Closure Decision and Unlock Packet

- **Objective**: Produce deterministic GO/NO-GO decision for S2-01 and emit unlock packet for S2-02 only if threshold is met.
- **Dependencies**: Knot 5.
- **Owner Agent**: `hiveplanner`.
- **In-Scope Paths (Sector-2 only)**:
  - `.hivemind/project/planning/phases/**`
  - `.hivemind/project/planning/research/**`
  - `.hivemind/project/planning/ROADMAP.md`
  - `docs/**`
- **Gate**:
  - Final threshold computation completed from collected evidence.
  - Decision recorded as `GO` or `NO-GO` with blocker residuals and next action.
- **Evidence Artifacts**:
  - `.hivemind/project/planning/phases/s2-01-closeout-decision-2026-02-28.md`
  - `.hivemind/project/planning/research/s2-01-gate-scorecard-2026-02-28.md`

---

## Explicit Blocker Handling Matrix

| Blocker | Handling Knot(s) | Clear Condition |
|---|---|---|
| `R01` procedural/contract violation | Knot 2 | No `R01` FAIL in framework validation output |
| `R01b` unknown permission key `mcp` | Knot 2 | No unknown permission keys reported |
| Ecosystem `healthy=false` (`init`, `config`) | Knot 3 | `healthy=true` and both checks pass |
| Core parity drift (`53 mismatches`) | Knot 4 | parity mismatches = `0` |

If any clear condition fails, execution remains in `NO-GO` and cannot promote to S2-02.

---

## Sequential vs Parallel Execution Rationale

- **Sequential critical path**: `K1 -> (K2 and K3) -> K4 -> K5 -> K6`.
- **Why this order**:
  - K1 establishes immutable baseline and prevents moving targets.
  - K2 and K3 are independent blocker streams and can run concurrently after K1.
  - K4 must wait for K2/K3 so parity is resolved against already-valid contracts and healthy ecosystem.
  - K5 validates rank-1 context behavior only after structural and parity stability is restored.
  - K6 is decision-only and must consume complete evidence.
- **Safe parallel zone**: K2 and K3 only.
- **Unsafe parallel zones**:
  - K4 with K2/K3 (would mask parity root cause).
  - K5 with K4 (would validate on unstable baseline).
  - K6 with any earlier knot (decision without complete evidence).

---

## Anti-Pattern Guards (Mandatory at Phase Boundaries)

- **D-02 (Plan/Gate Bypass)**: every knot requires explicit entry/exit gate evidence before next knot starts.
- **D-07 (Unvalidated Structural Change)**: no structural asset change accepted without validator evidence in the same knot artifact set.
- **D-10 (Stale/Unresolved Artifacts)**: artifacts older than this remediation window cannot be used as sole closure proof.
- **D-13 (Broken Dependency Chain)**: downstream knot execution is blocked unless declared dependencies are marked pass.
- **D-14 (Session Rot)**: if drift/context governance degrades below acceptable threshold, trigger realignment and re-run active knot gate.

---

## Final GO/NO-GO Gate Definition (S2-01 Exit)

S2-01 is **GO** only if all conditions are true:

1. Framework validation hard fails are zero: `R01=0`, `R01b=0`.
2. Ecosystem health is green: `healthy=true`, `init=pass`, `config=pass`.
3. Core parity drift is eliminated: `mismatches=0`.
4. Rank-1 context acceptance met: `<1200 tokens/turn`, `0 P0 duplication`, `0 P0 pollution`.
5. Transition guard pack is green: `D-02`, `D-07`, `D-10`, `D-13`, `D-14` all pass.
6. Evidence completeness: all knot evidence artifacts exist and are dated `2026-02-28` for this wave.

If any single condition fails, verdict is **NO-GO**, Sector-1 remains blocked, and remediation loops from the earliest failed knot.
