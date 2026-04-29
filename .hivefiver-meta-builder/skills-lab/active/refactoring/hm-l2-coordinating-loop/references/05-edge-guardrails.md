# Coordination Edge Guardrails

Use this reference when a coordination loop crosses child-agent or tool boundaries. It prevents final-only verification from hiding boundary failures.

## Edge Types

| Edge | Required guardrail | Evidence |
|------|--------------------|----------|
| Coordinator → child | Envelope has task, scope, context, expected output, verification, handoff metadata | envelope path + validator output |
| Child → tool | Tool use stays inside scope and permission profile | tool summary or touched-file list |
| Child → coordinator | Return status, artifacts, and verification evidence match envelope | child report + command output |
| Coordinator → integration | No unresolved child blockers or conflicts | findings.md conflict section |
| Integration → verify | Full acceptance checks run after merged output | validation command output |

## Trace Row Template

```yaml
- edge: "child-2->coordinator"
  guardrails:
    scope: pass
    output_shape: pass
    verification: fail
    unauthorized_delegation: pass
  evidence: "tests failed: <path/to/output>"
  decision: "redispatch child-2 with failing command"
```

## Stop Rules

- Do not integrate a child result with failed scope or output-shape guardrails.
- Do not run final VERIFY while any edge has `BLOCKED` or `NEEDS_CONTEXT`.
- Do not hand off to a second child to patch a first child's output unless the first edge is accepted or explicitly closed as blocked.
