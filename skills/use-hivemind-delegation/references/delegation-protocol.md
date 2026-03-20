# Delegation Protocol

## Scope Declaration
Every delegation MUST have an explicit scope declaration containing:
- **Inclusions**: What the subagent should work on
- **Exclusions**: What is explicitly out of scope
- **Boundaries**: Time, depth, or resource limits

## Parent Context Link
Every delegation MUST preserve the parent context:
- Parent session ID must be recorded
- Context inheritance path must be traceable
- Chain break detection must be possible

## Result Contract
Every delegation MUST define a result contract:
- Expected output format (JSON, text, etc.)
- Required fields in the result
- Success criteria
- Failure modes

## Chain Audit
All delegations are recorded for traceability:
- Delegator identity
- Executor identity
- Timestamp
- Scope snapshot
