# Pipeline Patterns — Skill Composition in Development Workflows

> How `stack-opencode` composes with other Hivemind skills in real development pipelines.

## Overview

`stack-opencode` is the root contamination skill for the OpenCode platform. It provides the authoritative API reference, expert internals, and development patterns that ALL other OpenCode-related skills depend on. This document maps how it composes with sibling skills in common development workflows.

## Workflow: Plugin Feature Development

```
stack-opencode (API ref + patterns) ──┐
                                          ├──→ Plugin implementation
stack-zod (schema patterns) ──────────┘
       ↓
stack-vitest (testing patterns)
       ↓
gate-lifecycle-integration (quality gate)
       ↓
gate-evidence-truth (verification)
```

**Pipeline steps:**
1. Agent loads `stack-opencode` → reads `references/patterns/dev.md` for plugin structure and `references/api/plugin.md` for hook signatures
2. For tool schema validation, loads `stack-zod` → verifies Zod type reliability matrix from `SKILL.md`
3. Tests are written against `references/patterns/testing.md` mock patterns, using `stack-vitest` for testing conventions
4. Code passes through `gate-lifecycle-integration` → verifies 9-surface mutation authority
5. Final verification through `gate-evidence-truth` → requires L1 runtime evidence

## Workflow: Delegation System Development

```
stack-opencode (SDK client + SSE) ──┐
                                        ├──→ Delegation implementation
hm-l3-hivemind-engine-contracts ────────┘
       ↓
hm-l3-subagent-delegation-patterns
       ↓
gate-spec-compliance
```

**Pipeline steps:**
1. `stack-opencode` → `references/expert/client-server.md` for SSE event bus and session lifecycle
2. `hm-l3-hivemind-engine-contracts` → plugin load order, concurrency model, budget policies
3. `hm-l3-subagent-delegation-patterns` → checkpoint protocols, wave-based execution
4. `gate-spec-compliance` → bidirectional traceability between specs and code

## Workflow: Hook Chain Debugging

```
stack-opencode (hook composition internals) ──┐
                                                  ├──→ Debug session
hm-l2-debug (systematic debugging) ───────────────┘
       ↓
stack-vitest (hook testing patterns)
```

**Pipeline steps:**
1. `stack-opencode` → `references/expert/hook-composition.md` for sequential last-write-wins, hook ordering
2. `hm-l2-debug` → systematic debugging methodology for tracing mutations through hook chains
3. `stack-vitest` → mock hook outputs and isolate individual hooks for testing

## Workflow: TUI Plugin Development

```
stack-opencode (TUI types + keymap API) ──┐
                                              ├──→ TUI plugin
stack-nextjs (sidecar dashboard) ──────────┘
       ↓
stack-json-render (generative UI)
```

**Pipeline steps:**
1. `stack-opencode` → `references/api/tui-v2.md` for keymap API, `references/api/types.md` for TUI types
2. `stack-nextjs` → sidecar reads SSE events, consumes SDK client
3. `stack-json-render` → generative UI component mapping for structured LLM output

## Skill Loading Order

When composing multiple skills:

```
ALWAYS LOAD FIRST:  stack-opencode (root contamination)
THEN LOAD:          Domain-specific skills (zod, vitest, nextjs)
THEN LOAD:          Gate skills (lifecycle, spec, evidence)
```

**Reason:** `stack-opencode` provides the API contract. All downstream skills validate against its type definitions and hook signatures. Loading order matters because gates need the API reference to verify compliance.

## Anti-Patterns

| Anti-Pattern | Example | Correction |
|-------------|---------|------------|
| Loading `stack-zod` without `stack-opencode` first | Agent validates Zod schemas against Zod docs but doesn't know about tool() silent failures | Always load `stack-opencode` first — it documents the Zod→JSON Schema conversion gaps |
| Skipping `stack-opencode` for simple tools | "I just need to create a tool, not read all the internals" | Even simple tools need the gotcha #1: tool() is identity function with zero validation |
| Loading expert internals for gate checks | Gate agent reads tool-internals.md to check tool schema | Use `references/patterns/gatekeeping.md` instead — it has the checklist, not the source archaeology |
