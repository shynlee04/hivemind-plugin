# Role Boundaries

## Purpose

Defines the responsibility contract between orchestrator and child agents, enforcement rules for scope violations, and catalogs valid and invalid delegation patterns. Ensures each delegation maintains clear authority boundaries.

## Front-Facing Agent (Orchestrator) Responsibilities

| Responsibility | Why |
|----------------|-----|
| Choose the slice and set constraints | Orchestrator has the full picture; children have only their slice |
| Decide whether the child may mutate files | Write authority is a risk — orchestrator controls it |
| Define the success test and return contract | Without a contract, the child decides what "done" means |
| Emits the delegation packet before dispatch | Packet is the contract — no packet, no delegation |
| Synthesize returns | Orchestrator integrates; it does not re-read output files |
| Handle failures and escalation | Children report blockers; orchestrator decides recovery |

## Delegated Agent (Child) Responsibilities

| Responsibility | Why |
|----------------|-----|
| Stay inside scope | Scope is the contract — exceeding it creates integration risk |
| Report blocked routes instead of improvising | Improvisation outside scope creates hidden changes the orchestrator cannot track |
| Return evidence before conclusions | Evidence is verifiable; conclusions alone are not |
| Stop when the packet says stop | Continuing past the stop condition wastes resources and may create conflicts |
| Do NOT recursively self-delegate | Recursive delegation without orchestrator approval breaks the dispatch chain |

## Enforcement

If a child violates its responsibilities:

| Violation | Consequence |
|-----------|-------------|
| Exceeds scope (touches files outside `authority_surfaces`) | Mark return as `scope_violation`; do NOT merge; re-delegate or escalate |
| Mutates files when packet said read-only | Mark return as `scope_violation`; revert changes if committed; re-delegate |
| Returns fabricated completeness | Quarantine the return; verify `files_checked` against `scope`; re-delegate |
| Silently abandons scope | Treat as timeout; log to registry; re-delegate |
| Recursively self-delegates | Abort the recursive chain; re-delegate from orchestrator with explicit no-delegation constraint |

## Invalid Delegation Patterns

| Pattern | Why It's Invalid |
|---------|-----------------|
| "Go fix everything" — no scope | Child cannot determine boundaries; will either do too much or too little |
| Recursive handoff with no new boundary | Each delegation must have a tighter scope than its parent; otherwise it's scope inflation |
| Mixed research + execution + verification in one child | These have different success tests; combining them means the child cannot determine when it's done |
| Delegation to non-existent or phantom skills | The child has no instructions; delegation is void |

## Valid Delegation Patterns

| Pattern | Why It's Valid |
|---------|---------------|
| Single concern, bounded scope, explicit constraints | Child has clear success test and hard boundaries |
| Read-only scan with explore agent | No mutation risk; fast; low context cost |
| Verification-only after implementation is complete | Separate success test from implementation; evidence-based |
| Planning-only — child returns stages, not edits | Bounded output type; orchestrator decides what to execute |

## Related

- `delegation-decision.md` for decision criteria
- `failure-recovery.md` for boundary violation recovery
- `hivemind-gatekeeping-delegation` for iterative boundary enforcement
