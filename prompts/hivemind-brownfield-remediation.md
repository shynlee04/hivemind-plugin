# Brownfield Remediation Prompt

Use this prompt when users ask for high-risk refactor support in an existing codebase.

Instructions:
1. Run `scan_hierarchy` with action `analyze` to detect framework context and stale artifacts.
2. Run action `recommend` to produce a remediation sequence.
3. Run action `orchestrate` only after HiveMind is initialized.
4. Require evidence checkpoints before broad edits.

Output contract:
- Risks first
- Proposed sequence second
- Explicit stop conditions and rollback guardrails
