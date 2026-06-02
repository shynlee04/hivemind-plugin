# Department Bundles — Role-Based Skill Loading Bundles

> Pre-configured skill loading bundles for different team roles working with OpenCode.

## Overview

Different development roles need different subsets of the OpenCode SDK + Plugin knowledge. Rather than loading all 13+ references, use these role-based bundles to load only what's relevant.

## Bundle Definitions

### Bundle A: Plugin Developer (Tool Author)

**Who:** Developers creating custom OpenCode tools, hooks, or plugins.

**Load these files:**
```
SKILL.md                          → Gotchas + decision trees (always first)
references/patterns/dev.md        → Plugin structure, tool registration, hook patterns
references/api/plugin.md          → Plugin function contract, hook signatures
references/api/types.md           → ToolContext, ToolResult, Part types
references/patterns/gatekeeping.md → Quality gates for plugin code
```

**Also load from stack-chains:**
- `stack-l3-zod` → Zod reliability matrix (if using complex schemas)
- `stack-l3-vitest` → Testing patterns (for plugin tests)

**Skip:** Expert internals (tool-internals, hook-composition, client-server), SDK client, ACP, TUI v2.

### Bundle B: Infrastructure Developer (Delegation/Harness)

**Who:** Developers building delegation systems, session management, or harness features.

**Load these files:**
```
SKILL.md                          → Gotchas + decision trees (always first)
references/expert/client-server.md → SSE event bus, session lifecycle, prompt_async
references/expert/hook-composition.md → Hook chains, compaction flow, event types
references/api/sdk.md             → Client factories, server spawners, process management
references/api/plugin.md          → Hook signatures (chat.params, permission.ask, etc.)
```

**Also load from stack-chains:**
- `hm-l3-hivemind-engine-contracts` → Plugin load order, concurrency model

**Skip:** TUI, patterns (dev/testing), ACP.

### Bundle C: TUI Plugin Developer

**Who:** Developers creating terminal UI plugins, custom keybindings, or TUI extensions.

**Load these files:**
```
SKILL.md                          → Gotchas + decision trees (always first)
references/api/tui-v2.md          → Keymap API, migration from api.command
references/api/types.md           → TUI type section (TuiPluginApi, slots, theme)
references/expert/hook-composition.md → Event types relevant to TUI (tui.* events)
```

**Also load from stack-chains:**
- `stack-l3-nextjs` → If building a sidecar dashboard
- `stack-l3-json-render` → If using generative UI components

**Skip:** Tool internals, SDK client, patterns.

### Bundle D: Quality Gate Auditor

**Who:** Agents or developers running quality gate checks on plugin code.

**Load these files:**
```
SKILL.md                          → Gotchas + decision trees (always first)
references/patterns/gatekeeping.md → 8 quality gates with checklists
references/api/plugin.md          → Correct hook names, import paths
references/expert/tool-internals.md → ToolResult validation, Effect.Effect handling
```

**Also load from stack-chains:**
- `gate-l3-lifecycle-integration` → 9-surface authority table
- `gate-l3-spec-compliance` → Spec traceability
- `gate-l3-evidence-truth` → L1-L5 evidence hierarchy

**Skip:** SDK client, TUI, patterns (dev/testing).

### Bundle E: IDE Integration Developer (ACP)

**Who:** Developers building Zed, VS Code, or other editor integrations.

**Load these files:**
```
SKILL.md                          → Gotchas + decision trees (always first)
references/api/acp.md             → JSON-RPC protocol, session management
references/api/sdk.md             → V2 client, server spawners
references/expert/client-server.md → SSE event bus, session lifecycle
```

**Also load from stack-chains:**
- External: `@agentclientprotocol/sdk` npm package documentation

**Skip:** Tool internals, hook composition, TUI, patterns.

## Loading Protocol

### For Agents: How to Use These Bundles

1. **Detect the task domain:** Plugin dev? Infrastructure? TUI? Gate audit? IDE integration?
2. **Load `SKILL.md` first** — gotchas and decision trees apply to ALL roles
3. **Load ONLY the bundle for your role** — do not load all references
4. **Load cross-stack skills from stack-chains** as the bundle recommends

### For hf-coordinator: How to Route

When dispatching a skill-builder or agent-builder subagent:

```yaml
# Task packet for plugin tool creation
bundle: "A"  # Plugin Developer
load_skills:
  - stack-l3-opencode   # Root (always)
  - stack-l3-zod         # Bundle A recommends
  - stack-l3-vitest      # Bundle A recommends
```

## Bundle Size Comparison

| Bundle | References to Load | Total ~Lines | Context Cost |
|--------|-------------------|-------------|-------------|
| A: Plugin Dev | 4 | ~1,400 | LOW |
| B: Infrastructure | 4 | ~1,300 | LOW |
| C: TUI Plugin | 3 | ~1,000 | LOW |
| D: Gate Auditor | 4 | ~1,200 | LOW |
| E: IDE Integration | 3 | ~1,100 | LOW |
| ALL (anti-pattern) | 13+ | ~4,500 | HIGH — avoid |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| Loading all 13+ references "just in case" | Context window > 70% with unused refs | Use role-based bundle; load on demand |
| TUI developer loading tool-internals.md | Agent reads about tool() identity function for TUI work | TUI plugins don't create tools; use Bundle C |
| Gate auditor loading patterns/dev.md | Agent reads dev examples instead of gate checklists | Gate bundle already includes gatekeeping.md |
| Skipping SKILL.md in any bundle | Agent jumps to reference without gotchas | SKILL.md is ALWAYS first — gotchas prevent common failures |
