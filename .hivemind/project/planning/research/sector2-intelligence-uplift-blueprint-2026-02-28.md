# Sector-2 Intelligence Uplift Blueprint (2026-02-28)

## Scope and Intent

This blueprint defines a Sector-2-first uplift path for HiveMind framework intelligence without touching Sector-1 implementation files (`src/**`, `tests/**`).

Target outcomes:
- Autonomous governance and deterministic gatekeeping.
- Cross-session continuity that survives compaction and delegation churn.
- Lower cognitive burden on front-facing orchestration by replacing manual ritual with executable contracts.
- Alignment to `SYSTEM-DIRECTIVES.md` (SOT hierarchy, session trajectory, memory lifecycle) and `docs/HIVEMIND-FRAMEWORK-AUDIT-CRITERIA.md` (GREEN-FLAG criteria, RED-FLAG prevention, realignment protocol).

---

## 1) Why Static Quantitative Checks Are Insufficient (Repo-Specific)

Static checks (line counts, schema validation, lint, unit tests) are necessary but non-sufficient because current failure modes are behavioral and relational, not purely syntactic.

Observed insufficiencies in this repository context:
- **Dual-path context risk is dynamic**: Audit criteria identifies lifecycle and message-transform channels; static checks cannot prove per-turn deduplication, ordering, or poisoning resistance in live routing.
- **Chain integrity is temporal**: `SYSTEM-DIRECTIVES` requires dependent sequence correctness and final-node staleness calculation; static checks cannot verify runtime order across turns/sessions.
- **Gate semantics are execution-time**: A command can be structurally valid but still skip prerequisites unless hard stops evaluate current trajectory state and evidence at runtime.
- **Memory quality is lifecycle-dependent**: Auto-classification (`temporary -> consolidated -> purged`) and TODO-Pending routing need event-time enforcement; static checks only inspect artifacts after the fact.
- **Sector-1 independence test is operational**: Audit criteria requires Sector-2 to function when Sector-1 is removed/manual. Static checks cannot simulate degraded runtime pathways and fallback behavior.

Conclusion: quantitative checks must be wrapped by executable governance contracts with runtime evidence capture.

---

## 2) Qualitative Architecture Model: Executable Chaining Semantics

Define Sector-2 assets as a runtime contract chain, not a documentation set.

Contract chain:
1. **Command** = entry intent router + preflight gate declaration.
2. **Workflow** = deterministic state machine (step IO, gate checkpoints, rollback pointers).
3. **Skill** = knowledge delta + decision policy (no orchestration logic leakage).
4. **Template** = typed output contract for persistence/reporting.
5. **Reference** = static domain facts loaded on-demand only.

Execution semantics:
- **Command preflight** resolves: session state, trajectory node, required skills, evidence requirements.
- **Workflow step** cannot execute unless previous step wrote expected output contract and gate verdict.
- **Skill loading** follows progressive disclosure (L0-L3) with explicit trigger provenance.
- **Template materialization** writes normalized records into SOT planning tree.
- **Reference reads** are side-effect-free and never route control flow.

Invariant set:
- No implicit transitions.
- No hidden state writes.
- No cross-layer responsibility leakage (command!=tutorial, skill!=router, workflow!=role policy).

---

## 3) Auto-Governance Design for Sector-2-First Operation

Design principle: governance must run from Sector-2 assets and state files, not from fragile Sector-1 injection paths.

### Governance Runtime Plane (Sector-2)

- **Policy Registry**: versioned governance policy in planning docs defining mandatory lifecycle actions, prohibited paths, and escalation triggers.
- **State Reader**: consumes `.hivemind/state/brain.json`, `.hivemind/state/hierarchy.json`, session files, and planning artifacts.
- **Rule Evaluator**: computes compliance for session start, delegation handoff, compaction exit, and re-entry.
- **Enforcement Adapter**: emits hard-stop verdicts and required remediation actions.
- **Evidence Sink**: appends immutable evidence entries to planning/audit artifacts.

### Minimum autonomous checks

- Missing `declare_intent` at session entry -> fail fast.
- Missing `map_context` over drift threshold turns -> route to realignment.
- Delegation return without export contract -> block downstream continuation.
- Compaction requested without continuity package (anchors + mem links + TODO state) -> block compact.

This provides operational autonomy even when Sector-1 hooks are degraded, disabled, or partially inconsistent.

---

## 4) Auto-Gatekeeping Model with Hard Stop Semantics and Evidence Contracts

Gatekeeping uses deterministic pass/fail transitions with machine-verifiable evidence.

### Gate classes

1. **Entry Gate**: session intent + hierarchy position + required skill bundle loaded.
2. **Transition Gate**: each workflow step validates prior output contract and chain continuity.
3. **Delegation Gate**: subagent packet integrity, return schema, and export-cycle proof.
4. **Exit Gate**: compaction completeness, pending TODO routing, and anchor durability.

### Hard stop semantics

- `PASS`: continue.
- `SOFT_FAIL`: continue only after auto-remediation step succeeds.
- `HARD_FAIL`: immediate halt; emit violation record with blast-radius scope.

### Evidence contract schema (conceptual)

- `gate_id`, `trajectory_id`, `session_id`, `step_id`
- `required_inputs[]`, `observed_inputs[]`
- `verdict`, `reason_codes[]`
- `artifacts[]` (paths, hashes, timestamps)
- `next_allowed_actions[]`

No gate verdict, no progression.

---

## 5) Cross-Session Continuity Model

Continuity is modeled as a first-class graph spanning trajectory, mems, anchors, and TODO-Pending lifecycle.

### Continuity package (must exist before compact/re-entry)

- **Trajectory snapshot**: current node, parent chain, active workflow step.
- **Decision anchors**: durable rationale and constraint anchors with tags.
- **Mems index**: categorized links (`discovery/research/planning/implementing/debug/test`).
- **TODO-Pending delta**: off-track intentions captured with ownership and re-entry condition.
- **Open obligations**: unresolved gates, unresolved violations, blocked dependencies.

### Retrieval order on new session

1. Hierarchy state.
2. Last trajectory continuity package.
3. Open obligations.
4. Highest-priority pending intent.

This order minimizes context pollution and preserves chain integrity.

---

## 6) Operational Proving Loop (Swarms + Workflow Runs)

Validation must be continuous and adversarial, not one-time acceptance.

### Loop design

1. **Scenario synthesis**: generate representative high-risk scenarios (drift, missing map_context, failed delegation export, compaction under unresolved TODO).
2. **Parallel swarm runs**: route scenarios through orchestrator, planner, and verifier roles using identical contracts.
3. **Evidence collation**: compare gate verdict consistency and contract completeness.
4. **Regression detection**: diff evidence trends against baseline audit wave.
5. **Policy refinement**: adjust rule thresholds and remediation branches.

### Continuous validity signals

- Gate false-positive rate.
- Gate false-negative rate.
- Mean turns to realignment.
- Continuity recovery success after compaction.
- Duplicate context ingestion reduction.

If thresholds regress for two consecutive runs, enforce hard freeze on expanding scope.

---

## 7) Deferred Sector-1 Re-entry Conditions

Sector-1 changes remain blocked until Sector-2 reaches operational maturity.

Required truth set before any Sector-1 touch:
- Sector-2 governance can run full lifecycle (entry -> delegation -> compact -> re-entry) without Sector-1 hook dependency.
- Hard-stop gates produce stable verdicts across repeated swarm runs.
- Cross-session continuity package passes retrieval and replay checks.
- Audit criteria RED-FLAG criticals are zero for three consecutive validation windows.
- Independence test passes: Sector-2 still governs correctly under manual initiation with Sector-1 pathways removed/disabled.

Only after this threshold should Sector-1 be used as optional acceleration, not correctness dependency.

---

## 8) 90-Day Phased Evolution Map with Measurable Outcomes

### Days 0-30: Foundation Contracts

Objectives:
- Formalize command/workflow/skill/template/reference runtime contracts.
- Introduce gate classes and evidence schema in planning artifacts.

Measurable outcomes:
- 100% of active commands mapped to explicit entry gates.
- 100% of target workflows mapped to deterministic step contracts.
- Baseline evidence logs created for at least 10 representative runs.

### Days 31-60: Autonomous Governance + Continuity

Objectives:
- Activate Sector-2 policy evaluator and enforcement adapter.
- Enforce continuity package requirement on compact and re-entry.

Measurable outcomes:
- >= 90% automatic detection of lifecycle violations in scenario suite.
- >= 80% reduction in unresolved off-track intentions (TODO-Pending leakage).
- >= 95% successful recovery from compaction into correct trajectory node.

### Days 61-90: Proving, Hardening, Re-entry Readiness

Objectives:
- Run continuous swarm proving loop and threshold-based policy tuning.
- Certify deferred Sector-1 re-entry criteria.

Measurable outcomes:
- False-negative gate rate < 3% on adversarial scenarios.
- Three consecutive windows with zero critical RED-FLAG violations.
- Signed readiness report for conditional Sector-1 re-entry.

---

## Design Decisions (Sector-2 Uplift)

1. Treat Sector-2 assets as executable runtime contracts, not static docs.
2. Keep command/workflow/skill/template/reference responsibilities strictly separated.
3. Move governance authority to Sector-2 policy evaluation over state artifacts.
4. Enforce hard-stop progression: no gate verdict, no workflow advancement.
5. Require evidence contracts for every gate transition.
6. Make continuity package mandatory for compaction and session re-entry.
7. Prioritize retrieval order (hierarchy -> continuity -> obligations -> pending intent) to reduce pollution.
8. Validate via adversarial swarm loops, not single happy-path runs.
9. Freeze scope expansion when validation signals regress twice in a row.
10. Defer Sector-1 re-entry until Sector-2 proves independent operational reliability.
