# Spec to Requirement Mapping

## Purpose

Use this reference after the `SKILL.md` entry and ambiguity gates. It deepens the extraction step but does not replace the main workflow.

## Mapping Rules

1. Every source MUST/SHOULD/MAY becomes a candidate requirement.
2. Each final REQ has exactly one falsifiable condition.
3. Split conjunctions when separate behaviors can pass or fail independently.
4. Replace ambiguous adjectives with thresholds, observable proxies, or blocked questions.
5. Preserve source traceability with a quote, section, or artifact path.
6. Assign verification before locking the requirement.
7. Classify existing implementation alignment as `implemented`, `missing`, `drifted`, `orphan-test`, `ambiguous-source`, or `blocked-tooling` before rewriting requirements.
8. Keep mapping metadata portable: use project-relative paths, test names, commands, or manual inspection notes instead of framework-specific state files.

## Source-Backed Extraction Flow

This flow combines the inspected spec-first, requirements-validation, and drift-sync patterns without depending on their runtimes.

1. **Quote first:** copy the exact sentence, section heading, or artifact path that justifies the candidate requirement.
2. **Normalize modality:** convert MUST/SHOULD/MAY into requirement priority without changing meaning.
3. **Split behavior:** separate coupled behaviors when they can fail independently.
4. **SMART screen:** block vague rows until they have a named actor, observable outcome, and verification method.
5. **Map evidence:** attach planned tests, existing tests, implementation path, or `gap` state.
6. **Lock or block:** only locked rows move to TDD execution; blocked rows keep the exact missing fact.

## Requirement Quality Checklist

| Check | Pass condition | Failure handling |
|---|---|---|
| Source trace | Requirement cites source text or section | Return blocked; do not invent source intent. |
| Single condition | One behavior can be tested independently | Split into multiple REQ IDs. |
| Observable result | Output, state change, event, error, metric, or UI change is visible | Ask for observable behavior. |
| Verification method | Test, command, inspection, or manual validation is named | Mark blocked if no method exists. |
| Integration note | Affected agent/command/tool/hook/runtime surface is named or marked not applicable | Add explicit not-applicable note. |
| Mapping status | Existing implementation/test state is named when relevant | Add `missing`, `drifted`, `orphan-test`, or `not-inspected`. |

## Traceability Matrix Fields

| Field | Required? | Description |
|---|---:|---|
| `req_id` | Yes | Stable REQ-* identifier. |
| `source_quote_or_path` | Yes | Exact quote, source section, or artifact path. |
| `condition` | Yes | One falsifiable condition. |
| `acceptance_cases` | Yes | Positive plus applicable negative/boundary/integration cases. |
| `verification_method` | Yes | Test command, inspection method, manual check, or blocked reason. |
| `implementation_mapping` | When existing code exists | Public interface/file/route/command observed. |
| `test_mapping` | When tests exist or are planned | Test name, command, or `gap`. |
| `coverage_state` | Yes | `mapped`, `gap`, `blocked`, or `not-applicable`. |

## Example

Source: “The system MUST handle 1000 concurrent users and keep checkout reliable.”

Better mapping:

- `REQ-PERF-01`: Under 1000 concurrent checkout attempts, p95 checkout API latency is below the agreed threshold.
- `REQ-RELIABILITY-01`: Under 1000 concurrent checkout attempts, successful payment authorizations are not duplicated.

Blocked mapping if threshold is missing:

- `REQ-PERF-01` blocked: source does not define acceptable latency or reliability threshold.

Portable trace row:

```markdown
| REQ-PERF-01 | `PRD.md#checkout-load`: "handle 1000 concurrent users" | p95 checkout latency remains below agreed threshold at 1000 concurrent attempts | positive load case; boundary max concurrency; negative duplicate-payment guard | blocked: latency threshold missing | `src/checkout/*` if present | gap | blocked |
```
