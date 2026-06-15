# Delegation Packet Schema

The full schema for a delegation packet passed to `delegate-task`. Every
field is required unless marked optional.

## Top-level fields

```yaml
task: string  # one-sentence description (max 200 chars)
scope:
  include: string[]  # file paths the agent SHOULD touch
  exclude: string[]  # file paths the agent MUST NOT touch
context: string  # only what is needed; max 50 lines; reference files for the rest
expected_output:
  deliverables: string[]  # concrete files/artifacts to produce
  format: string  # e.g., "Markdown", "TypeScript", "JSON"
  acceptance_criteria: string[]  # falsifiable conditions
verification:
  command: string  # exact command the agent must run
  expected_exit: number  # usually 0
  report_path: string  # where to write the verification result
```

## Metadata block

```yaml
metadata:
  source_agent: string  # who is dispatching
  target_agent: string  # who is receiving
  intent_class: enum  # one of 10 from hm-coord-router
  allowed_destinations: string[]  # agents this packet may chain to (empty = no chaining)
  history_policy: enum  # "include_all" | "include_relevant" | "fresh_only"
  expected_return: enum  # "DONE" | "DONE_WITH_CONCERNS" | "NEEDS_CONTEXT" | "BLOCKED"
  resume_pointer: string  # file:line or path to continue from on interruption
  max_iterations: number  # default 3, max 5
  deadline_ms: number  # optional hard timeout
```

## Minimum viable envelope (5 sections only)

If the dispatch is low-stakes, the metadata block can be omitted. The
5-section envelope is always required:

1. `task`
2. `scope`
3. `context`
4. `expected_output`
5. `verification`

## Examples

### Example 1: spec author (full packet)

```yaml
task: "Write EARS-style spec for the new auth-flow feature"
scope:
  include:
    - ".planning/phases/24-auth-flow/24-SPEC.md"
  exclude:
    - "src/auth/**"  # no implementation yet
context: |
  User prompt: "Lock the spec for the new auth flow."
  Prior phase: 22-user-model (completed)
  Constraint: must be tech-agnostic, no specific framework assumed.
expected_output:
  deliverables:
    - ".planning/phases/24-auth-flow/24-SPEC.md"
  format: "Markdown"
  acceptance_criteria:
    - "≥3 EARS statements in WHEN-WHILE-SHALL format"
    - "Each REQ has traceable source (user prompt, prior ADR, or research)"
    - "Acceptance matrix covers all 5 realms (spec/test/doc/arch/clean-code)"
verification:
  command: "node scripts/validate-spec-falsifiability.js 24-SPEC.md"
  expected_exit: 0
  report_path: ".planning/phases/24-auth-flow/24-VERIFY.md"
metadata:
  source_agent: "hm-orchestrator"
  target_agent: "hm-specifier"
  intent_class: "spec"
  allowed_destinations: []
  history_policy: "include_relevant"
  expected_return: "DONE"
  resume_pointer: ".planning/phases/24-auth-flow/24-SPEC.md"
  max_iterations: 3
```

### Example 2: debug (minimum envelope)

```yaml
task: "Diagnose the sidecar timeout"
scope:
  include:
    - "sidecar/**"
  exclude:
    - "src/auth/**"
context: |
  User prompt: "Why is the sidecar timing out?"
  Recent: 5s timeout when dashboard loads
  Last good build: 2026-06-07
expected_output:
  deliverables:
    - "sidecar/DIAGNOSIS.md"
  format: "Markdown"
  acceptance_criteria:
    - "Root cause identified with file:line"
    - "Repro test in tests/smoke/"
    - "Fix proposed (not applied yet)"
verification:
  command: "npm test -- sidecar/"
  expected_exit: 1  # the failing test SHOULD fail before fix
  report_path: "sidecar/DIAGNOSIS-VERIFY.md"
```

## Schema validation

Before dispatching, run a local validation:

```bash
yq -e '.task and .scope and .context and .expected_output and .verification' packet.yaml
```

If exit code != 0, the packet is missing required sections — fix and re-validate.
