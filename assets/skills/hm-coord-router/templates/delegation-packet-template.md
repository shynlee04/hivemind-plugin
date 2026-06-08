# Delegation Packet Template

Copy this template and fill in the 5 required sections + (optional) metadata block.

```yaml
# === DELEGATION PACKET ===
# Fill all required sections. Optional metadata below.

# --- 5 REQUIRED SECTIONS ---

task: "<one-sentence description, max 200 chars>"

scope:
  include:
    - "<file path the agent SHOULD touch>"
  exclude:
    - "<file path the agent MUST NOT touch>"

context: |
  <only what is needed; max 50 lines; reference files for the rest>

expected_output:
  deliverables:
    - "<concrete file/artifact>"
  format: "<Markdown | TypeScript | JSON | etc.>"
  acceptance_criteria:
    - "<falsifiable condition 1>"
    - "<falsifiable condition 2>"

verification:
  command: "<exact command the agent must run>"
  expected_exit: 0
  report_path: "<where to write the verification result>"

# --- OPTIONAL METADATA ---

metadata:
  source_agent: "<who is dispatching>"
  target_agent: "<who is receiving>"
  intent_class: "<spec | test | debug | refactor | ship | research | cross-cut | product | intent | coord>"
  allowed_destinations: []  # agents this packet may chain to (empty = no chaining)
  history_policy: "include_relevant"  # include_all | include_relevant | fresh_only
  expected_return: "DONE"  # DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
  resume_pointer: "<file:line or path>"
  max_iterations: 3  # default 3, max 5
  deadline_ms: 300000  # 5 min default
```

## Filling checklist

- [ ] `task` is one sentence, no jargon
- [ ] `scope.include` lists concrete file paths (not globs unless explicitly needed)
- [ ] `scope.exclude` is non-empty for high-stakes dispatches (prevents side effects)
- [ ] `context` is ≤50 lines; longer context goes in references and is cited
- [ ] `expected_output.deliverables` lists files that must exist after dispatch
- [ ] `expected_output.acceptance_criteria` is FALSIFIABLE (can be checked, not "looks good")
- [ ] `verification.command` is runnable on the current machine
- [ ] `verification.expected_exit` matches the success condition
- [ ] `metadata.target_agent` matches an existing agent file
- [ ] `metadata.intent_class` is one of 10 from `hm-coord-router`
- [ ] `metadata.max_iterations` ≤ 5

Save the filled packet as `delegation-packet-<intent>-<NN>.yaml` in
`.planning/delegations/` (created by the receiving agent).
