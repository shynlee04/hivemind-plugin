# Tech Registry

Schema, update procedures, and cross-session persistence for `.tech-registry.json`.

---

## Purpose

The tech registry is a persistent, machine-readable record of what the codebase is made of. Agents READ it first to avoid re-discovery. Agents APPEND new findings across sessions.

**Without it**: Every session re-discovers the tech stack, wasting context and time.

**With it**: Instant orientation. One file read replaces hours of investigation.

---

## Schema

```json
{
  "project": "project-name",
  "last_updated": "2026-04-08",
  "stack": {
    "language": "TypeScript",
    "runtime": "Node.js 20",
    "framework": "OpenCode Plugin SDK",
    "test_framework": "vitest",
    "build_tool": "tsc"
  },
  "concerns": {
    "resolved": [
      "Circular dependency between continuity.ts and state.ts — fixed 2026-03-15"
    ],
    "active": [
      "lifecycle-manager.ts approaching 500 LOC limit — consider splitting"
    ]
  },
  "modules": {
    "src/lib/types.ts": {
      "role": "leaf",
      "loc": 85,
      "deps": []
    },
    "src/lib/helpers.ts": {
      "role": "leaf",
      "loc": 120,
      "deps": ["src/lib/types.ts"]
    },
    "src/lib/concurrency.ts": {
      "role": "core",
      "loc": 95,
      "deps": ["src/lib/types.ts"]
    },
    "src/lib/lifecycle-manager.ts": {
      "role": "core",
      "loc": 480,
      "deps": [
        "src/lib/types.ts",
        "src/lib/state.ts",
        "src/lib/task-status.ts",
        "src/lib/continuity.ts",
        "src/lib/session-api.ts",
        "src/lib/runtime.ts",
        "src/lib/completion-detector.ts"
      ]
    }
  }
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project` | string | Yes | Human-readable project name |
| `last_updated` | string (ISO date) | Yes | Date of last registry update |
| `stack` | object | Yes | Language, runtime, framework, tools |
| `stack.language` | string | Yes | Primary programming language |
| `stack.runtime` | string | Yes | Runtime environment and version |
| `stack.framework` | string | No | Primary framework or SDK |
| `stack.test_framework` | string | No | Testing library |
| `stack.build_tool` | string | No | Build/compile tool |
| `concerns` | object | Yes | Resolved and active concerns |
| `concerns.resolved` | string[] | Yes | Previously identified issues that are fixed |
| `concerns.active` | string[] | Yes | Current issues, warnings, or technical debt |
| `modules` | object | Yes | Map of file paths to module metadata |
| `modules[path].role` | string | Yes | "leaf" (no deps), "core" (has deps), "entry" (public API) |
| `modules[path].loc` | number | Yes | Lines of code |
| `modules[path].deps` | string[] | Yes | Array of dependency file paths |

---

## Read Procedure

Every investigation session starts with:

```
Read .tech-registry.json
```

If the file exists:
- Use `stack` to orient on language/framework conventions
- Use `modules` to understand dependency graph without re-tracing imports
- Use `concerns.active` to avoid known pitfalls
- Use `concerns.resolved` to avoid re-investigating solved problems

If the file does NOT exist:
- Run the Discovery Procedure below
- Create the file with initial findings

---

## Discovery Procedure (First-Time Creation)

```bash
# Step 1: Identify language
glob "**/*.ts" | wc -l  # TypeScript
glob "**/*.js" | wc -l  # JavaScript
glob "**/*.py" | wc -l  # Python

# Step 2: Identify runtime
grep -r "node" package.json 2>/dev/null | head -5
cat package.json | grep -A2 "engines"

# Step 3: Identify framework
grep -r "import.*from.*@opencode" src/ | head -5
grep -r "import.*from.*express" src/ | head -5

# Step 4: Identify test framework
grep -r "vitest\|jest\|mocha" package.json | head -3

# Step 5: Map modules
glob "src/**/*.ts"
# For each file:
#   wc -l file → LOC
#   grep "^import" file → dependencies
#   Classify role: leaf (0 deps), core (1+ deps), entry (exported publicly)
```

---

## Update Procedure

Agents APPEND to the registry — they never overwrite it entirely.

### When to Update

| Event | Update |
|-------|--------|
| New file created | Add entry to `modules` |
| File deleted | Remove entry from `modules` |
| Dependency changed | Update `modules[path].deps` |
| LOC changed significantly (>20%) | Update `modules[path].loc` |
| New concern identified | Append to `concerns.active` |
| Concern resolved | Move from `concerns.active` to `concerns.resolved` |
| Stack change (new framework, language) | Update `stack` fields |

### Update Pattern

```
1. Read .tech-registry.json
2. Modify the specific field that changed
3. Update last_updated to today's date
4. Write the complete file back
```

**Never** do partial writes. Read the full file, modify in memory, write the complete file.

---

## Cross-Session Persistence

The registry persists across sessions because it lives on disk, not in context.

### Session Start Protocol

```
1. Read .tech-registry.json
2. If exists → use for orientation
3. If missing → run Discovery Procedure
4. Verify registry matches current file structure (spot-check 3 files)
5. If mismatch → update registry
```

### Session End Protocol

```
1. If you discovered new information → update registry
2. If you resolved a concern → move to resolved list
3. If you identified a new concern → add to active list
4. Update last_updated
5. Write file
```

---

## Case Study: Registry Saves 30 Minutes

**Scenario**: Agent resumes session after 2-day gap. Needs to understand the module dependency graph.

**Without Registry**: Trace imports across 12 files. Read each file's import statements. Build mental map. Cost: ~12 files × 200 tokens + cognitive overhead. Time: ~30 minutes.

**With Registry**: Read `.tech-registry.json` → 80 lines. Full dependency graph in one read. Cost: ~800 tokens. Time: ~30 seconds.

**Savings**: 97% token reduction, 99% time reduction.
