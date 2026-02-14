---
name: "hivemind-scan"
description: "Scan the project codebase and build a HiveMind backbone. Run this on first use or when switching projects."
---

# HiveMind Project Scan

You are performing a HiveMind brownfield reconnaissance and stabilization scan.
Run this before any major refactor or when entering an unfamiliar project.

## Step 1: Analyze
Call:

```ts
scan_hierarchy({ action: "analyze", json: true })
```

Extract and report:
- Project name and stack hints
- Framework mode (`gsd`, `spec-kit`, `both`, `none`) + BMAD detection
- Top-level structure and notable artifacts
- Any stale/context-poisoning signals

## Step 2: Recommend
Call:

```ts
scan_hierarchy({ action: "recommend" })
```

Focus on:
- Framework conflict handling (especially `.planning` + `.spec-kit`)
- Poisoned-context cleanup order
- Explicit lifecycle sequence (`declare_intent` -> `map_context` -> execution)

## Step 3: Orchestrate Baseline (Safe, Non-Destructive)
If HiveMind is initialized, call:

```ts
scan_hierarchy({ action: "orchestrate", json: true })
```

This persists baseline intelligence:
- Anchors for stack/framework/risk context
- `project-intel` memory entry for cross-session continuity

## Step 4: Lock Execution Focus
Call:

```ts
declare_intent({ mode: "exploration", focus: "Brownfield stabilization" })
map_context({ level: "tactic", content: "Context purification and framework resolution" })
```

## Output Contract
Report in this order:
1. Risks and framework mode
2. Recommendation sequence
3. Orchestrated baseline status (anchors/memory)
4. Next executable step
