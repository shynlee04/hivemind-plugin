# Stack Chains — Dependency Ordering Between stack-* Skills

> How `stack-l3-opencode` relates to other stack skills in the dependency graph.

## Skill Dependency Graph

```
                    ┌──────────────────────┐
                    │  stack-l3-opencode   │  ← ROOT: API contracts, types, patterns
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
| `stack-l3-opencode` | — (root) | API references, expert internals, dev/testing/gatekeeping patterns |
| `stack-l3-zod` | `stack-l3-opencode` (Zod→JSON Schema gaps) | Zod schema patterns, v3→v4 migration |
| `stack-l3-vitest` | `stack-l3-opencode` (mock ToolContext) | Testing patterns, SDK mocking |
| `stack-l3-nextjs` | `stack-l3-opencode` (SSE events, SDK client) | Next.js sidecar patterns |
| `stack-l3-json-render` | `stack-l3-nextjs` | Generative UI component mapping |
| `stack-l3-bun-pty` | — (standalone) | PTY integration patterns |
| `gate-l3-lifecycle-integration` | `stack-l3-opencode` (9-surface table, hook types) | Lifecycle gate checking |
| `gate-l3-spec-compliance` | `stack-l3-opencode` (tool/hook specs) | Spec compliance gate |
| `gate-l3-evidence-truth` | `stack-l3-opencode` (ToolState as evidence) | Evidence verification gate |

## Chain Rules

### Rule 1: Always Load Root First

`stack-l3-opencode` must be loaded before any stack skill that references OpenCode API types. Resolve circular deps by consulting the root first.

### Rule 2: Gate Skills Are Terminal

Gate skills (`gate-l3-*`) are always loaded LAST in a pipeline. They validate output, not guide implementation. Never load a gate skill before the implementation skills it validates.

### Rule 3: Cross-Stack Integration via stack-l3-opencode

When two stack skills interact (e.g., `stack-l3-zod` schema used in `stack-l3-vitest` mock), the integration point is documented in `stack-l3-opencode`'s ecosystem routing table (SKILL.md lines 104-112). This prevents each stack skill from duplicating cross-reference logic.

### Rule 4: Version Compatibility Check

```
Before loading any stack-* skill:
1. Check stack-l3-opencode version (frontmatter)
2. Check the target skill's stated OpenCode version dependency
3. If versions differ >1 minor → flag potential incompatibility
4. If target skill version > stack-l3-opencode version → update stack-l3-opencode first
```

## Loading Order Examples

### Example 1: Tool Development (minimal)

```
1. stack-l3-opencode     → patterns/dev.md, api/plugin.md
2. stack-l3-zod           → schema patterns (only if using complex Zod types)
```

### Example 2: Full Plugin Development (comprehensive)

```
1. stack-l3-opencode     → all patterns + expert docs
2. stack-l3-zod           → Zod reliability matrix cross-reference
3. stack-l3-vitest        → mock patterns for ToolContext
4. gate-l3-lifecycle-integration → CQRS boundary verification
5. gate-l3-evidence-truth → L1 runtime evidence
```

### Example 3: TUI Plugin (specialized)

```
1. stack-l3-opencode     → api/tui-v2.md, api/types.md (TUI section)
2. stack-l3-nextjs        → if building a sidecar dashboard
3. stack-l3-json-render   → if using generative UI
```

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| Loading gate skills before implementation | Agent runs gate checks before writing code | Gates validate output; implement first, gate last |
| Loading stack-l3-zod without stack-l3-opencode | Agent uses generic Zod docs, misses tool() gotchas | stack-l3-opencode documents Zod→JSON Schema silent failures |
| Loading all 6 stack skills for a simple task | Context window overloaded with unused references | Use loading examples above; only load what's needed |
| Skipping stack-l3-opencode because "I know the API" | Agent uses outdated signatures from training data | The source is v1.14.44 — training data is months behind |
