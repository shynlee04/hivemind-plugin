# Direct Invocation

## Scenario
- The router has already isolated three slices: codemap, debug, and verification.
- Only the codemap slice is independent enough for parallel work.

## Expected Behavior
- `hivemind-delegation-protocol` keeps debug and verification sequential.
- It emits a delegation packet before any child dispatch.
- It blocks vague recursive handoff.
- It requires a structured return contract.
