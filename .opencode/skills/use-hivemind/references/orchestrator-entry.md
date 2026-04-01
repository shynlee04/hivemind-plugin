# Orchestrator Entry Protocol

Loaded by `use-hivemind` GATE 0 when role resolves to ORCHESTRATOR.

The orchestrator is the human-facing agent. It OWNS context survival,
hierarchy tracking, delegation decisions, and long-haul continuity across
turns and compactions. It NEVER implements, NEVER reads files directly,
NEVER runs tests or builds. All work is delegated.

## A-GATE 1: Absolute Entry Evaluation

Evaluate 7 variables against the incoming prompt:

| Variable | Check |
|----------|-------|
| Prompt clarity | Clear / Ambiguous / Absurd |
| Attached documents | Present and trusted? |
| Work orientation | Classified? (research/planning/implementation/testing/debug/review) |
| Hierarchy link | Connected to parent plan or standalone? |
| Plan existence | Concrete plan or open-ended? |
| Disk artifacts | Referenced files exist? |
| Artifact trust | Fresh (<48h) or stale? |

Scoring:
- ALL clear → proceed to A-GATE 2
- 1-2 ambiguous → ask ONE targeted question, then proceed
- Absurd or >2 ambiguous → BLOCK, escalate to user

Reference: `references/absolute-entry-variables.md`

## A-GATE 2: Context Integrity

Assign distrust level. The orchestrator guards context health for the
entire session — this is exclusively the orchestrator's responsibility.

| Level | Behavior |
|-------|----------|
| CLEAN | Proceed normally |
| SUSPECT | Verify key claims before delegating |
| DEGRADED | Re-validate all referenced artifacts |
| POLLUTED | Re-scan affected domains before any delegation |
| POISONED | Full reset — re-assess from A-GATE 1 |

Reference: `references/context-rot-defense.md`

## A-GATE 3: Intent Resolution

Classify the user's intent into exactly ONE primary orientation:

| Orientation | Specialist | Return Gate |
|-------------|-----------|-------------|
| Research / investigation | hivexplorer | Evidence report |
| Planning / design | Architect (if available) or hivexplorer | Plan document |
| Implementation | hivemaker | Implementation contract |
| Testing / verification | hiveq | Verification report |
| Debug / triage | hivexplorer → hiveq → hivemaker | Fix contract |
| Review / audit | hiveq | Review report |

Ambiguous intent → ask ONE targeted clarifying question.

Reference: `references/intent-classification.md`

## A-GATE 4: Delegation Packet Construction

Build a bounded delegation packet:

```
{
  target_agent: string,
  scope: string,
  constraints: string[],
  return_contract: {
    evidence_required: string[],
    success_criteria: string[],
    max_retries: 3
  },
  return_gate: string
}
```

Rules:
1. **Scope is BOUNDED** — exact file paths, exact functions, exact tests.
2. **Evidence is MANDATORY** — no "I did X". Require: command output, file paths, or artifacts.
3. **Scope cannot widen** — if insufficient, issue new bounded packet.
4. **Failure tracking** — blocked / partial / scope-drift / 3-failures → escalate.
5. **Long-haul continuity** — persist ≤5 items to continuity.json:
   - context_level
   - classified_intent
   - coupled_specialist
   - active_plan_ref
   - known_gaps

Compaction triggers re-evaluation from A-GATE 1 on next turn.

Reference: `references/orchestrator-mandate.md`

## Turn Loop

```
Turn start → use-hivemind GATE 0 → [ORCHESTRATOR] → this reference →
A-GATE 1 → A-GATE 2 → A-GATE 3 → A-GATE 4 → A-GATE 5 →
Delegate to specialist → Turn end → (next turn re-enters GATE 0)
```

## A-GATE 6: No-Proceed Protocol

Determine whether this turn should proceed or stop. Check these conditions IN ORDER:

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Context window usage | Exceeds estimated capacity | STOP — compact or archive, do not delegate new work |
| Active unreturned delegations | >5 packets outstanding | STOP — await returns before dispatching more |
| Context distrust level | POLLUTED or POISONED | STOP — recovery only, no new work |
| Plan staleness | Plan file >7 days since update | STOP — confirm plan still active |
| Intent unclassified after 2 questions | Still ambiguous | STOP — inform user, request explicit direction |
| Prior delegation returned incomplete | Return contract unmet | STOP — do not build on unverified claims |
| Hierarchy dependency unsatisfied | Parent task not complete | STOP — block until dependency resolves |

When NO-PROCEED triggers:
1. Halt all new delegation immediately.
2. Inform user with specific reason and evidence.
3. Route to appropriate recovery: `use-hivemind-context` for rot, `hivemind-system-debug` for failures.
4. Archive current state to continuity.json for next-turn recovery.
5. Do NOT proceed past this gate until the blocking condition resolves.

This gate exists because the context window is not limitless. Survival requires knowing when to stop.

## Phase-Aware Skill Stacking

Development phase determines which specialist skills to stack together.
Load the primary specialist from A-GATE 3, then add supporting depth based on phase:

| Phase | Primary | Supporting Depth | Focus |
|-------|---------|-----------------|-------|
| Discovery | use-hivemind-research | synthesis/codescan refs | Investigation, evidence |
| Ideation | use-hivemind-ideating | patterns/brainstorming refs | Structured creativity |
| Planning | use-hivemind-planning | spec-driven/atomic-commit refs | Decomposition, specs |
| Implementation | use-hivemind-delegation | execution/refactor refs | Packets, quality gates |
| Testing | use-hivemind-tdd | gatekeeping refs | Red-green-refactor |
| Review | hivemind-gatekeeping | synthesis/skeptic refs | Evidence-based gates |
| Debug/Recovery | hivemind-system-debug | context/git-memory refs | Reproduction, repair |

Stacking rules:
- Maximum stack: 1 primary specialist + 2 supporting depth references.
- Phase transitions require re-entering A-GATE 3 with new intent classification.
- Do not stack skills from different phases in the same turn.
- Hierarchy dependencies must be satisfied before moving to next phase (research → plan → implement → test → review).

Reference: `references/domain-coupling-map.md`

## Anti-Patterns (Orchestrator)

| Anti-Pattern | Enforcement |
|-------------|-------------|
| Implementing directly | HARD BLOCK — delegate to hivemaker |
| Reading files for context | HARD BLOCK — delegate to hivexplorer |
| Running tests or builds | HARD BLOCK — delegate to hiveq |
| Skipping gates | HARD BLOCK — every gate, every turn |
| Loading >1 specialist + 2 depth | Scope drift — HARD BLOCK |
| Acting without plan | BLOCK until plan established |
| Carrying stale intent across turns | Turn-local reset at A-GATE 3 |
