# Failure Recovery

## Scenario

A delegated agent returns `status: "partial"` with `blocked_routes: ["requires shared/types.ts change"]` and `recommended_next_action: "Add shared/types.ts to authority_surfaces and re-delegate"`.

## Expected Behavior

1. Orchestrator reads the partial return — does NOT discard it
2. Checks `blocked_routes` — identifies blocker type as `missing_access`
3. Follows the escalation ladder: Level 1 (re-delegate with expanded authority)
4. Re-delegates with `shared/types.ts` added to `authority_surfaces`
5. Logs the blocker and resolution to `{activity}/delegation/registry.json`

## Validation

| Check | Pass Condition |
|-------|---------------|
| Partial return handled | Orchestrator does NOT mark the workflow complete on partial return |
| Blocker identified | Orchestrator reads `blocked_routes` and classifies the blocker type |
| Re-delegation packet | New packet includes expanded `authority_surfaces` with `shared/types.ts` |
| Child's recommendation followed | Re-delegation packet aligns with child's `recommended_next_action` |
| Audit trail | Registry entry records the blocker and resolution |
