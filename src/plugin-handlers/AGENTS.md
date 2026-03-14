# src/plugin-handlers/ — Resolution and Inheritance

## Responsibilities
- Resolve command bundles, tool grants, category routing, session inheritance, and doc surfaces.
- Compile the workflow-aware runtime context before plugin assembly.

## Rules
- This is the command/tool/agent/provider/MCP inheritance boundary.
- Keep lineage-aware overrides here, not in hooks.
- Commands are composite orchestration bundles, not thin wrappers.
