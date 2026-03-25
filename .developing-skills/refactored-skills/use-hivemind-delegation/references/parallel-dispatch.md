# Parallel Agent Dispatch

## When to Use
- 3+ independent failures/broken subsystems
- Each problem can be understood without context from others
- No shared state between investigations

## When NOT to Use
- Failures are related (fix one might fix others)
- Need full system context
- Agents would interfere (editing same files)

## Agent Prompt Structure
1. Focused — one clear problem domain
2. Self-contained — all context needed
3. Specific about output — what should agent return?

## Prompt Template
[Specific scope]
[Error messages / test names]
[Constraints: what NOT to change]
[Expected output: summary of root cause + changes]

## Review After Return
1. Review each summary
2. Check for conflicts (same files edited?)
3. Run full test suite
4. Spot check for systematic errors
