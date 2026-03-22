# Activity Classifier

## Classes

| Class | Description | Detection Rule | Granularity |
|-------|-------------|----------------|-------------|
| `artifact` | Design docs, PRDs, ADRs, plans | Path matches `docs/**`, `*.adr.md`, `**/plans/**`, `**/specs/**` | `whole-file` |
| `code` | Implementation source, tests, types | Path matches `src/**`, `tests/**`, `*.ts`, `*.tsx`, `*.js` | `chunk` |
| `meta` | Governance, agents, skills, config | Filename matches `AGENTS.md`, `opencode.json`, `*.skill.md`, `package.json` | `whole-file` |
| `runtime` | Generated runtime state, activity logs | Path matches `.hivemind/**`, `dist/**`, `*.log` | `line` |
| `projection` | Mirrored/shim files, generated docs | Path matches `.opencode/**`, `docs/generated/**`, `*.generated.*` | `whole-file` |

## Operations

| Operation | Code | Description |
|-----------|------|-------------|
| `create` | `C` | New file added |
| `modify` | `M` | Existing file changed |
| `delete` | `D` | File removed |
| `rename` | `R` | File renamed or moved |
| `copy` | `X` | File duplicated |

## Granularity Levels

| Level | Use When | Split Behavior |
|-------|----------|----------------|
| `line` | Runtime state with per-line independence | Each changed line is an atomic unit |
| `chunk` | Code with function/block independence | Split at function or class boundaries |
| `section` | Docs with section independence | Split at heading boundaries |
| `whole-file` | Config, meta, artifacts with no internal split | Entire file is one unit |

## Path-Based Classification Rules

Rules are evaluated in order. First match wins.

1. `.hivemind/**` → `runtime`
2. `dist/**` → `runtime`
3. `.opencode/**` → `projection`
4. `docs/generated/**` → `projection`
5. `AGENTS.md` → `meta`
6. `opencode.json` → `meta`
7. `package.json` → `meta`
8. `*.skill.md` → `meta`
9. `*.adr.md` → `artifact`
10. `docs/plans/**` → `artifact`
11. `docs/specs/**` → `artifact`
12. `src/**` → `code`
13. `tests/**` → `code`
14. `*.ts`, `*.tsx`, `*.js` → `code`
15. Default → `artifact`

## Hierarchy Inheritance

When a directory is classified, child paths inherit the parent class unless they match a more specific rule. Example: `src/tools/` classifies as `code`. A child `src/tools/test-config.json` could override to `meta` if it matches a meta rule.

## Classification JSON Output

```json
{
  "file": "src/tools/runtime/status.ts",
  "class": "code",
  "operation": "M",
  "granularity": "chunk",
  "rule_matched": "src/**",
  "override": null
}
```

## Override Mechanism

Explicit overrides are supported via a `.hivemind-classify.json` file in the project root:

```json
{
  "overrides": {
    "src/generated/types.ts": "runtime",
    "docs/api-reference.md": "projection"
  }
}
```

Overrides are applied before path-based rules. They take highest priority.
