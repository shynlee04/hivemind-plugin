# HiveMind v3 Compatibility

**Only read this file if you are working with HiveMind v3 TypeScript modules.**

For all other tasks (skill creation, OpenCode configuration, stacking), skip this file.

---

## What This Means for Agents

HiveMind v3 is a TypeScript plugin architecture. If your task involves modifying TypeScript source files in `src/`, these principles apply:

### Code vs Configuration Boundary

| Must Be Code (TypeScript) | Can Be Configuration (Markdown) |
|---------------------------|--------------------------------|
| Plugin assembly | Skill definitions (SKILL.md) |
| Tool execution | Agent definitions |
| State persistence | Command bundles |
| Hook implementations | Workflow templates |

### CQRS Pattern

- **Tools (Write Side):** Create/update/delete state, execute commands, trigger workflows.
- **Hooks (Read Side):** Inject context into messages, observe tool execution, track session events.
- **Skills:** Pure markdown — they guide but do not execute.

### Module Constraints

- Max module size: 500 LOC
- Plugin entry: <100 LOC (assembly only)
- No circular dependencies
- Zero runtime dependencies for skills

---

## Skill Placement in HiveMind

Skills are configuration, not code. Place them in:
- `.opencode/skills/<name>/SKILL.md` (OpenCode native)
- `.agents/skills/<name>/SKILL.md` (universal)
- `.claude/skills/<name>/SKILL.md` (Claude Code compatible)

Do NOT place skills in `src/`. They are not TypeScript modules.

---

## Migration Notes

For projects transitioning from harness-experiment to HiveMind v3:

1. Deploy skills first (markdown only, no TypeScript changes needed)
2. Align custom tools with `tool()` helper pattern from `@opencode-ai/plugin`
3. Configure hooks to inject skill state into context
4. Deploy TypeScript modules last
