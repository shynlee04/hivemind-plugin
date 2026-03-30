## Execution Packet

**slice_id:** {id}
**batch_id:** {batch}
**mode:** execution
**timestamp:** {ISO 8601}

### Scope

{One-paragraph description of what to implement}

### Authority Surfaces

Allowed file paths for modification:

| Path | Reason |
|------|--------|
| `src/tools/new-tool/` | New tool implementation |
| `tests/tools/new-tool.test.ts` | Test file |

### Out of Scope

Forbidden file paths — never touch these:

| Path | Reason |
|------|--------|
| `src/plugin/` | Plugin wiring — separate task |
| `AGENTS.md` | Framework asset — never edit |

### Constraints

- Must use `tool.schema` (Zod) for tool arg definitions
- Must use `context.sessionID`, `context.agent`, `context.directory` from `ToolContext`
- Must preserve JSDoc: `@param`, `@returns`, `@example`
- Module ≤300 lines, function ≤50 lines, complexity ≤10
- CQRS: tools write, hooks read, plugin assembles

### Skills to Load

| Skill | Purpose |
|-------|---------|
| `use-hivemind-tdd` | Test-first execution |
| `hivemind-atomic-commit` | Commit discipline |

### Success Metrics

| Metric | Command | Pass Condition |
|--------|---------|----------------|
| Type check | `npx tsc --noEmit` | Zero errors |
| Tests | `npm test` | All pass |
| Lint | `npm run lint` | Zero violations |
| Build | `npm run build` | Exit 0 |
| LOC | `wc -l {file}` | ≤300 lines |

### Rollback Command

```bash
git revert HEAD
```

### Return Format

Return an evidence bundle:

```json
{
  "status": "completed",
  "slice_id": "{id}",
  "files_modified": [
    { "path": "src/tools/new-tool/index.ts", "lines": 120 }
  ],
  "verification": {
    "type_check": { "command": "npx tsc --noEmit", "exit_code": 0, "status": "pass" },
    "tests": { "command": "npm test", "exit_code": 0, "status": "pass" },
    "lint": { "command": "npm run lint", "exit_code": 0, "status": "pass" },
    "build": { "command": "npm run build", "exit_code": 0, "status": "pass" }
  },
  "deviations": [],
  "open_issues": []
}
```
