# Direct Invocation

## Scenario

A router has isolated three slices: codemap, debug, and verification. Only the codemap slice is independent enough for parallel work.

## Expected Behavior

1. `hivemind-delegation-protocol` keeps debug and verification sequential (shared authority surface or dependency)
2. Emits a delegation packet before any child dispatch
3. Blocks vague recursive handoff
4. Requires a structured return contract

## Validation

| Check | Pass Condition |
|-------|---------------|
| Packet emitted | Delegation packet JSON exists with all required fields populated |
| Sequential for dependent slices | debug and verification have `execution_mode: "sequential"` |
| Return contract present | Packet `return_contract` array contains: status, findings, blocked_routes, recommended_next_action |
| No recursive delegation | Children do not dispatch sub-children unless `self_delegation: true` is in the packet |
