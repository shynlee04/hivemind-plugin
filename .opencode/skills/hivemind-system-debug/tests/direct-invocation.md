# Direct Invocation

## Scenario
- Verification fails after a partial detox edit.
- The symptom spans multiple touched files, and the cause is not yet bounded.

## Expected Behavior
- `hivemind-system-debug` requires reproduction first.
- It emits containment notes and a debug stage report.
- It either returns a bounded root cause or routes back to `hivemind-codemap` when the structural slice is still unclear.
