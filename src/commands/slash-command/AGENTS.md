# src/commands/slash-command/ — Composite Command Bundles

## Responsibilities
- Define command bundles with workflow chains, tool grants, structured output, and continuation policy.
- Support auto-routing from `start-work` without losing risk gates.

## Rules
- Commands must remain composite bundles, not simple aliases.
- Discovery and preview logic belong here; execution policy comes from handlers/runtime.
