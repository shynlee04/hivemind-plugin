# Task Envelope

The minimum viable envelope for a delegated agent.

```yaml
# === TASK ENVELOPE ===
# 5 required sections. Optional metadata block.

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
    - "<falsifiable condition>"

verification:
  command: "<exact command the agent must run>"
  expected_exit: 0
  report_path: "<where to write the verification result>"

# --- OPTIONAL METADATA ---
metadata:
  source_agent: "<who is dispatching>"
  target_agent: "<who is receiving>"
  intent_class: "<spec|test|debug|refactor|ship|research|cross-cut|product|intent|coord>"
  history_policy: "include_relevant"
  expected_return: "DONE"
  max_iterations: 3
  deadline_ms: 300000
```

## Filling Checklist
- [ ] task is one sentence, no jargon
- [ ] scope.include lists concrete file paths
- [ ] scope.exclude is non-empty for high-stakes dispatches
- [ ] context ≤50 lines; longer goes in references + cited
- [ ] expected_output.deliverables lists files that must exist
- [ ] expected_output.acceptance_criteria is FALSIFIABLE
- [ ] verification.command is runnable
- [ ] verification.expected_exit matches success condition
- [ ] metadata.max_iterations ≤ 5
