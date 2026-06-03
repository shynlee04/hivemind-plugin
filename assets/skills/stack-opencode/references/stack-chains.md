# Stack Chains — Dependency Ordering Between stack-* Skills

> How `stack-opencode` relates to other stack skills in the dependency graph.

## Skill Dependency Graph

```
                    ┌──────────────────────┐
                    │  stack-opencode   │  ← ROOT: API contracts, types, patterns
                    │  (v1.14.44)          │
                    └──────┬───────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
   ┌───────────┐   ┌───────────┐   ┌──────────────┐
   │stack-l3-  │   │stack-l3-  │   │stack-l3-     │
   │zod        │   │vitest     │   │nextjs        │
   └───────────┘   └───────────┘   └──────────────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
               ┌───────────┼───────────┐
               ▼           ▼           ▼
        gate-l3-    gate-l3-     gate-l3-
        lifecycle   spec         evidence
```

## Dependency Matrix

| Skill | Depends On | Provides |
|-------|-----------|----------|
| `stack-opencode` | — (root) | API references, expert internals, dev/testing/gatekeeping patterns |
| `stack-zod` | `stack-opencode` (Zod→JSON Schema gaps) | Zod schema patterns, v3→v4 migration |
| `stack-vitest` | `stack-opencode` (mock ToolContext) | Testing patterns, SDK mocking |
| `stack-nextjs` | `stack-opencode` (SSE events, SDK client) | Next.js sidecar patterns |
| `stack-json-render` | `stack-nextjs` | Generative UI component mapping |
| `stack-bun-pty` | — (standalone) | PTY integration patterns |
| `gate-lifecycle-integration` | `stack-opencode` (9-surface table, hook types) | Lifecycle gate checking |
| `gate-spec-compliance` | `stack-opencode` (tool/hook specs) | Spec compliance gate |
| `gate-evidence-truth` | `stack-opencode` (ToolState as evidence) | Evidence verification gate |

## Chain Rules

### Rule 1: Always Load Root First

`stack-opencode` must be loaded before any stack skill that references OpenCode API types. Resolve circular deps by consulting the root first.

### Rule 2: Gate Skills Are Terminal

Gate skills (`gate-*`) are always loaded LAST in a pipeline. They validate output, not guide implementation. Never load a gate skill before the implementation skills it validates.

### Rule 3: Cross-Stack Integration via stack-opencode

When two stack skills interact (e.g., `stack-zod` schema used in `stack-vitest` mock), the integration point is documented in `stack-opencode`'s ecosystem routing table (SKILL.md lines 104-112). This prevents each stack skill from duplicating cross-reference logic.

### Rule 4: Version Compatibility Check

```
Before loading any stack-* skill:
1. Check stack-opencode version (frontmatter)
2. Check the target skill's stated OpenCode version dependency
3. If versions differ >1 minor → flag potential incompatibility
4. If target skill version > stack-opencode version → update stack-opencode first
```

## Loading Order Examples

### Example 1: Tool Development (minimal)

```
1. stack-opencode     → patterns/dev.md, api/plugin.md
2. stack-zod           → schema patterns (only if using complex Zod types)
```

### Example 2: Full Plugin Development (comprehensive)

```
1. stack-opencode     → all patterns + expert docs
2. stack-zod           → Zod reliability matrix cross-reference
3. stack-vitest        → mock patterns for ToolContext
4. gate-lifecycle-integration → CQRS boundary verification
5. gate-evidence-truth → L1 runtime evidence
```

### Example 3: TUI Plugin (specialized)

```
1. stack-opencode     → api/tui-v2.md, api/types.md (TUI section)
2. stack-nextjs        → if building a sidecar dashboard
3. stack-json-render   → if using generative UI
```

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| Loading gate skills before implementation | Agent runs gate checks before writing code | Gates validate output; implement first, gate last |
| Loading stack-zod without stack-opencode | Agent uses generic Zod docs, misses tool() gotchas | stack-opencode documents Zod→JSON Schema silent failures |
| Loading all 6 stack skills for a simple task | Context window overloaded with unused references | Use loading examples above; only load what's needed |
| Skipping stack-opencode because "I know the API" | Agent uses outdated signatures from training data | The source is v1.14.44 — training data is months behind |
