# Domain Coupling Map

Orchestrator uses this table at A-GATE 4 of `orchestrator-entry.md` to
determine which specialist skill and depth references to load for a
classified intent domain.

## Coupling Rules

- Load exactly ONE specialist skill.
- Load 1-2 depth references from that specialist's own `references/` directory.
- Maximum coupling: 1 specialist + 2 depth refs. Exceed = scope drift → HARD BLOCK.
- Verify chain link: specialist must reference `use-hivemind` as parent.
- Broken chain → SUSPECT, log gap, proceed with caution.

## Coupling Table

| Intent Domain | Specialist Skill | Depth Ref 1 | Depth Ref 2 |
|---------------|-----------------|-------------|-------------|
| Research | hivemind-synthesis | codemap-output-guide.md | session-recovery.md |
| Planning | hivemind-spec-driven | requirement-to-spec.md | acceptance-criteria.md |
| TDD | use-hivemind-tdd | red-green-refactor-cycle.md | test-gates.md |
| Refactoring | hivemind-refactor | assess-plan-verify.md | behavior-preservation.md |
| Debugging | hivemind-system-debug | repro-contain-rollback.md | pre-commit-gates.md |
| Architecture | hivemind-architecture | adr-template.md | clean-boundaries.md |
| Gatekeeping | hivemind-gatekeeping | checkpoint-protocol.md | carry-forward.md |
| Code review | hivemind-execution | quality-gates.md | pre-commit-gates.md |
| Refactoring | hivemind-refactor | assess-plan-verify.md | behavior-preservation.md |
| Spec engineering | hivemind-spec-driven | requirement-to-spec.md | acceptance-criteria.md |

## Unclassified Intent

If A-GATE 3 (intent classification) produces a domain not in this table:
1. Ask ONE question to refine intent.
2. If still unclassifiable → map to closest domain with scope narrowing.
3. Log gap in `known_gaps` for future coupling map update.

## Multi-Intent

If prompt contains multiple intents:
1. Classify each separately.
2. Sequential passes — one domain coupling per pass.
3. Do NOT couple multiple specialists simultaneously.
4. Order: research → planning → execution → testing → review.
