---
name: ralph-tasking
description: Convert distilled specs and plans into Ralph PRD JSON and beads
  dependency graphs. Use when output must be Ralph-compatible PRD JSON, when
  building beads dependency graphs, or when entry-resolution routes to Ralph
  tooling. Lineage-agnostic — any project generating Ralph-compatible output
  uses this skill.
---

# Ralph Tasking

**Core principle:** Specs → executable PRD JSON. Plans → dependency beads. Always validate.

## When to Use

- Converting a distilled spec into Ralph-executable format
- Building PRD JSON from TODO/task state
- Generating beads dependency mapping
- Entry-resolution routes here when Ralph tooling is the target

## Workflow

```
Distilled Spec / TODO State
    │
    ├── 1. Build PRD User Stories ─────────────────────────┐
    │      Map spec requirements to user stories            │
    │      Assign deterministic IDs                         │
    │      Preserve traceability to source                  │
    │                                                       │
    ├── 2. Merge TODO/Task Nodes ──────────────────────────┐
    │      Cross-reference existing tasks with stories      │
    │      Build story → task traceability map              │
    │                                                       │
    ├── 3. Export PRD JSON ────────────────────────────────┐
    │      Flat-root structure (see rules)                  │
    │      Validate against schema before export            │
    │                                                       │
    ├── 4. Build Beads Graph ──────────────────────────────┐
    │      Map dependency chains between stories            │
    │      No self-dependencies, no circular references     │
    │                                                       │
    └── 5. Validate ───────────────────────────────────────┘
           Run anti-pattern checks
           Verify dependency integrity
           Confirm related entity links
```

## Validation Rules

| Rule | Check |
|------|-------|
| Root must include `name` + `userStories` | ✅ Required |
| Reject wrapper roots (`prd`) | 🔴 Anti-pattern |
| Reject legacy root key (`tasks`) | 🔴 Anti-pattern |
| Deterministic user story IDs and order | ✅ Required |
| No duplicate story IDs | 🔴 Anti-pattern |
| No self-dependencies | 🔴 Anti-pattern |
| Preserve related entity links | ✅ Required |

### Required Entity Links (when available)

- `workflow_id` — links to originating workflow
- `requirement_node_id` — links to spec requirement
- `mcp_provider_id` — links to MCP provider source
- `export_id` — links to export cycle

## Loop Integrations

When Ralph TUI tools are available:
- `ralph-tui-prd` — PRD management
- `ralph-tui-create-json` — JSON generation
- `ralph-tui-create-beads` — Beads graph generation
- `ralph-loop` — iterative validation (optional)

## Bundled Resources

| Resource | Content |
|----------|---------|
| [prd-json-rules.md](references/prd-json-rules.md) | Schema rules, forbidden patterns, determinism rules |
| [prd-json-flat.md](templates/prd-json-flat.md) | JSON template with all required and optional fields |

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Wrapper root JSON | Breaks Ralph parser — use flat root |
| Non-deterministic IDs | Story ordering becomes unpredictable |
| Missing traceability | Can't trace stories back to requirements |
| Skipping validation | Invalid JSON reaches Ralph — runtime errors |
| Circular dependencies | Beads graph becomes unresolvable |
