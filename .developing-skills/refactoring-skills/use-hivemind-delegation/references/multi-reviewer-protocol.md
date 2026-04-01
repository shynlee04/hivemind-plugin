# Multi-Reviewer Protocol

How to dispatch review work across multiple agents, each owning a distinct dimension of the same artifact.

## When to Use

Dispatch a multi-reviewer pattern when:

1. The artifact under review spans multiple concerns (security, performance, readability, architecture)
2. A single reviewer would require >30 minutes or >5 deep reads to cover all dimensions
3. The orchestrator needs independent verdicts before synthesis — not a single blended opinion
4. At least 3 agents are needed, each reviewing a different dimension

If only one or two dimensions matter, use a single reviewer with a focused scope. Multi-reviewer dispatch adds coordination overhead that is only justified when the breadth of review exceeds a single agent's effective coverage.

## Dimension Allocation

Each reviewer owns exactly one dimension. No reviewer may comment outside their assigned dimension.

| Dimension | Owner Agent | Scope | Success Criteria |
|-----------|------------|-------|------------------|
| Security | Security reviewer | Input validation, auth bypass, injection, secrets in code | No exploitable vulnerabilities |
| Performance | Performance reviewer | N+1 queries, unnecessary re-renders, memory leaks, hot paths | No regressions, latency budget met |
| Readability | Readability reviewer | Naming, function length, cognitive complexity, dead code | Clean Code standards met |
| Architecture | Architecture reviewer | Layer violations, dependency direction, interface decomposition | No authority boundary crossings |

Additional dimensions may be added (accessibility, i18n, error handling) but must follow the same rules: one owner, explicit scope, measurable success criteria.

## Ownership Rules

1. **One dimension per reviewer.** A reviewer may not cross into another dimension's territory. If a security reviewer spots a performance issue, they record it as an `observation` — not a finding — and the orchestrator routes it to the performance reviewer.
2. **No overlapping scope.** Two reviewers must never examine the same file for the same concern. If overlap is unavoidable (e.g., a security-sensitive performance path), assign the file to one reviewer and flag it as a cross-dimensional concern.
3. **Explicit out-of-scope.** Each reviewer's delegation packet must include an `out_of_scope` field listing dimensions they must NOT comment on.
4. **Single verdict per dimension.** Each reviewer returns exactly one verdict: `pass`, `fail`, or `conditional-pass` with required changes.

## Synthesis Protocol

When all reviewers return, the orchestrator synthesizes:

1. **Collect verdicts.** Gather each reviewer's verdict and findings list.
2. **Merge finding sets.** Combine all findings into a unified list, tagged by dimension.
3. **Identify conflicts.** Flag any findings where reviewers disagree (see Conflict Resolution below).
4. **Rank by severity.** Sort findings: `blocker` > `critical` > `major` > `minor` > `observation`.
5. **Produce synthesis report.** One document with:
   - Overall verdict (if any dimension fails, overall is `fail`)
   - Per-dimension verdicts
   - Merged finding list with severity and dimension tags
   - Cross-dimensional observations
   - Recommended next action

The orchestrator reads ONLY the compressed synthesis from each reviewer (≤5 findings per reviewer). Full reviewer output lives at the reviewer's `output_path` and is consulted only if synthesis reveals ambiguity.

## Conflict Resolution

When reviewers disagree on severity or validity of a finding:

1. **Severity disagreement.** If Reviewer A calls a finding `critical` and Reviewer B (for a different dimension) calls the same code `minor`, the higher severity wins. The rationale: underestimation is more dangerous than overestimation.
2. **Validity disagreement.** If one reviewer flags a finding and another dimension's reviewer believes it is a false positive, the finding is marked `disputed` and escalated to the orchestrator for adjudication.
3. **Cross-dimensional finding.** If a finding legitimately spans two dimensions (e.g., a security vulnerability caused by a performance optimization), create a `cross-dimensional` finding and assign it to both reviewers for independent assessment. The orchestrator merges their assessments.
4. **Unresolvable conflict.** If the conflict cannot be resolved through the above rules, escalate to the user with both perspectives and let the user decide.

## HiveMind Conventions

This protocol integrates with the HiveMind delegation framework as follows:

- **Delegation packet structure.** Each reviewer receives a standard delegation packet with `mode: verification`, their assigned dimension as `scope`, and explicit `out_of_scope` listing the other dimensions.
- **Return contract.** Each reviewer returns the standard Shared Return Contract with `activity_type: review` and their dimension in the `phase_type` field.
- **Failure recovery.** If a reviewer returns `partial` or `blocked`, follow the standard failure recovery protocol from `failure-recovery.md`. Do not re-assign their dimension to another reviewer mid-flight — wait for the return or timeout.
- **Audit trail.** Record each reviewer dispatch in `{activity}/delegation/registry.json` with the `dimension` field for traceability.
- **Escalation ladder.** Follow the standard escalation ladder: re-delegate with tighter constraints → decompose → escalate to user → abort.

### Packet Example

```json
{
  "slice_id": "review-security-001",
  "mode": "verification",
  "scope": "Security review of src/tools/trajectory/",
  "out_of_scope": ["performance", "readability", "architecture"],
  "dimension": "security",
  "success_metrics": "No exploitable vulnerabilities, all input paths validated",
  "return_format": "JSON with findings array, each item has file, line, severity, description",
  "output_path": ".hivemind/activity/review/security-001/"
}
```

### Synthesis Report Shape

```json
{
  "overall_verdict": "fail",
  "dimensions": {
    "security": { "verdict": "fail", "findings": 3 },
    "performance": { "verdict": "pass", "findings": 0 },
    "readability": { "verdict": "conditional-pass", "findings": 2 },
    "architecture": { "verdict": "pass", "findings": 0 }
  },
  "merged_findings": [
    { "id": "S-001", "dimension": "security", "severity": "critical", "file": "src/tools/trajectory/kernel.ts", "line": 42, "description": "Unvalidated input" }
  ],
  "cross_dimensional_observations": [],
  "recommended_next_action": "Fix security findings, then re-run security review"
}
```
