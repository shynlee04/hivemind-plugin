# Domain Boundaries Reference

> Last Updated: 2026-02-18

## Purpose

Domain boundaries prevent cross-contamination between different areas of the codebase. Respecting these boundaries is MANDATORY for app development success.

## Domain Definitions

### Backend Domain

**Description:** Server-side logic, data processing, tool definitions

**Allowed Paths:**
- `src/lib/` - Core business logic (pure TypeScript)
- `src/tools/` - Tool definitions (write-only, ~300 lines)
- `src/schemas/` - Zod validation schemas
- `src/hooks/` - OpenCode SDK hooks (read-auto)
- `src/cli/` - Command-line interface

**Forbidden Paths:**
- `src/dashboard/` - Frontend dashboard
- `src/views/` - Dashboard views
- `src/components/` - UI components

**Assigned Agents:** `build`, `debug`, `scanner`, `code-review`

### Frontend Domain

**Description:** Dashboard, TUI, views, components

**Allowed Paths:**
- `src/dashboard/` - Dashboard application
- `src/views/` - Dashboard views
- `src/components/` - UI components
- `src/types/` - Type definitions (shared)

**Forbidden Paths:**
- `src/lib/` - Core logic
- `src/tools/` - Tool definitions
- `src/schemas/` - Validation schemas
- `src/hooks/` - SDK hooks

**Assigned Agents:** `build`

### Shared Domain

**Description:** Types, utilities, tests - can be accessed by any domain

**Allowed Paths:**
- `src/types/` - Type definitions
- `src/utils/` - Utility functions
- `tests/` - Test files

**Forbidden Paths:** None

**Assigned Agents:** `build`, `code-review`

## Boundary Validation

```typescript
const DOMAIN_BOUNDARIES = {
  backend: {
    allowed: ["src/lib/", "src/tools/", "src/schemas/", "src/hooks/", "src/cli/", "tests/"],
    forbidden: ["src/dashboard/", "src/views/", "src/components/"]
  },
  frontend: {
    allowed: ["src/dashboard/", "src/views/", "src/components/", "src/types/"],
    forbidden: ["src/lib/", "src/tools/", "src/schemas/", "src/hooks/"]
  },
  shared: {
    allowed: ["src/types/", "src/utils/", "tests/"],
    forbidden: []
  }
}

function validateDomainBoundary(files: string[], domain: keyof typeof DOMAIN_BOUNDARIES): {
  valid: boolean
  violations: string[]
} {
  const boundary = DOMAIN_BOUNDARIES[domain]
  const violations: string[] = []
  
  for (const file of files) {
    const inAllowed = boundary.allowed.some(p => file.startsWith(p))
    const inForbidden = boundary.forbidden.some(p => file.startsWith(p))
    
    if (!inAllowed) {
      violations.push(`${file}: Not in allowed paths for ${domain}`)
    }
    if (inForbidden) {
      violations.push(`${file}: In forbidden paths for ${domain}`)
    }
  }
  
  return {
    valid: violations.length === 0,
    violations
  }
}
```

## Cross-Domain Protocol

When a task requires changes across domains:

1. **STOP** - Do not proceed immediately
2. **SPLIT** - Break task into domain-specific subtasks
3. **SEQUENCE** - Execute domain tasks in order
4. **VERIFY** - Check boundaries after each domain task

```typescript
// Example: Feature requiring backend + frontend changes

// Step 1: Backend changes (in backend domain)
const backendResult = await task({
  description: "Add API endpoint",
  prompt: "Modify only files in src/tools/ and src/lib/ ...",
  subagent_type: "build"
})

// Step 2: Verify backend changes don't leak
validateDomainBoundary(backendResult.files_changed, "backend")

// Step 3: Frontend changes (in frontend domain)
const frontendResult = await task({
  description: "Add UI for API",
  prompt: "Modify only files in src/dashboard/ and src/components/ ...",
  subagent_type: "build"
})

// Step 4: Verify frontend changes don't leak
validateDomainBoundary(frontendResult.files_changed, "frontend")
```

## Agent-Domain Mapping

| Agent | Primary Domain | Can Cross? |
|-------|---------------|------------|
| `hiveminder` | None (orchestrator) | Yes (delegates only) |
| `build` | Backend | With approval |
| `debug` | Backend | No |
| `scanner` | All (read-only) | Yes |
| `explore` | All (read-only) | Yes |
| `code-review` | All (read-only) | Yes |

## Violation Recovery

If a domain boundary violation is detected:

1. **ROLLBACK** - Revert changes to forbidden paths
2. **REROUTE** - Assign changes to correct domain agent
3. **DOCUMENT** - Save violation as mem for future reference

```typescript
// Violation detected
if (result.violations.length > 0) {
  // Rollback forbidden changes
  git checkout -- [forbidden files]
  
  // Reroute to correct domain
  const correctDomain = detectDomain(forbiddenFiles)
  task({
    description: "Reassign to correct domain",
    prompt: `These files were incorrectly modified. 
             Apply changes in ${correctDomain} domain instead.`,
    subagent_type: "build"
  })
  
  // Document
  save_mem({
    shelf: "violations",
    content: JSON.stringify(result.violations),
    tags: "boundary-violation,lesson-learned"
  })
}
```
