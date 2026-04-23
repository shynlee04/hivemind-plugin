# Spec to Requirement Mapping

## Rules

1. Every MUST/SHOULD/MAY in the spec becomes a REQ-*
2. Each REQ-* has exactly one falsifiable condition
3. No ambiguous adjectives ("fast", "user-friendly")
4. Measurable conditions only ("latency <100ms")

## Example

Spec: "The system MUST handle 1000 concurrent users."
→ REQ-01: Under 1000 concurrent connections, 95th percentile latency <200ms.
→ Test: tests/load/concurrent-1000.test.ts
