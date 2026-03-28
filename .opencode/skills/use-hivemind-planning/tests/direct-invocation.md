# Direct Invocation Scenario

## Purpose

Validate that `hivemind-spec-driven` can be selected and used directly without relying on `entry-resolution` or any sibling routing package.

## Scenario

Input request:

> "We need a new internal admin tool. It should be fast, secure, maybe mobile-friendly, probably integrated with our CRM, and legal wants audit logs. We also need it soon, but the budget is not final."

## Expected Behavior

1. The skill activates directly from the noisy requirement pattern.
2. The skill does not mention or require `entry-resolution`.
3. The first response breaks the request into requirement atoms and ambiguity lanes.
4. The clarification loop focuses first on high-impact ambiguity such as scope, delivery constraints, CRM integration, and auditability.
5. The output moves toward 2-3 spec candidates rather than jumping to implementation.

## Failure Signals

- The skill says it cannot proceed until another router classifies the request.
- The skill routes outward to a missing sibling package.
- The skill skips ambiguity mapping and jumps straight to execution.
- The skill ignores risk, compliance, or operational concerns.
