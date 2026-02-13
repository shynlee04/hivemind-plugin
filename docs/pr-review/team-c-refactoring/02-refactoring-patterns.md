# Team C Refactoring Patterns Analysis

**Date:** 2026-02-13  
**Scope:** Cross-PR pattern analysis and technical debt assessment  

---

## Refactoring Techniques Used

### 1. Extract Function/Method
**PRs:** #5, #16, #17  
**Technique:** Move inline logic to named exported function  

**Examples:**
```typescript
// PR #5: Migration logic extraction
// FROM: persistence.ts load() with inline ??= assignments
// TO: migrateBrainState(state) in brain-state.ts

// PR #16: Algorithm extraction  
// FROM: detection.ts internal function
// TO: utils/string.ts exported utility

// PR #17: Helper extraction
// FROM: session-lifecycle.ts inline functions
// TO: session-lifecycle-helpers.ts exported functions
```

**Effectiveness:**
- PR #16: Excellent — pure function with clear boundaries
- PR #5: Good — removes clutter but doesn't address root cause
- PR #17: Mixed — creates indirection without abstraction

### 2. Move Method/Module
**PRs:** #16  
**Technique:** Move function to more appropriate module  

**Pattern Application:**
```
lib/detection.ts (detection logic)
    └──> utils/string.ts (string utilities)
```

**Domain-Driven Placement:**
- String similarity → `utils/string.ts` ✅
- Could also have gone to: `lib/text-analysis.ts`, `shared/algorithms.ts`

### 3. Inline to Extract (Reverse of Inline Method)
**PRs:** #5, #17  
**Technique:** Replace inline field assignments with function call  

**PR #5 Migration Pattern:**
```typescript
// BEFORE: Inline in persistence.ts load()
parsed.session.date ??= new Date(...).toISOString().split("T")[0]
parsed.session.meta_key ??= ""
parsed.session.role ??= ""
// ... 15 more lines

// AFTER: Centralized in brain-state.ts
return migrateBrainState(parsed)
```

### 4. Decompose Conditional (Partial)
**PRs:** #17 (attempted)  
**Technique:** Break complex conditional logic into functions  

**Partial Success:**
```typescript
// session-lifecycle.ts BEFORE:
if (state && isSessionStale(...)) {
  // 30 lines of archival logic
}

// AFTER:
state = await handleStaleSession(directory, state, config, log, stateManager)
```

**Missing:** The extracted function is still complex (I/O + state mutation + logging)

---

## Consistency Across Codebase

### Naming Conventions

| Pattern | PR #5 | PR #16 | PR #17 | Consistency |
|---------|-------|--------|--------|-------------|
| Function prefix | `migrate` | `levenshtein` | `generate/handle/get` | ⚠️ Mixed |
| File naming | `brain-state.ts` | `string.ts` | `session-lifecycle-helpers.ts` | ⚠️ Inconsistent |
| Export style | Named | Named | Named | ✅ Consistent |

**Issues:**
- PR #17 uses "helpers" suffix — anti-pattern per architecture guidelines
- Function naming varies: `getX`, `handleX`, `generateX`, `compileX` without clear semantic rules

### Module Organization

**Current Structure:**
```
src/
├── lib/           # Core utilities (persistence, detection, etc.)
├── schemas/       # Type definitions + factories
├── hooks/         # Lifecycle hooks
├── tools/         # Tool implementations
└── utils/         # Shared utilities (PR #16 addition)
```

**PR #16 Addition:**
- ✅ Properly adds `utils/` for cross-cutting concerns
- ✅ Named by domain (`string.ts` not `helpers.ts`)

**PR #17 Addition:**
- ⚠️ Adds `session-lifecycle-helpers.ts` alongside `session-lifecycle.ts`
- ⚠️ Breaks "name by function, not role" guideline

### Import Patterns

**Consistent:**
```typescript
// All PRs use .js extension (NodeNext resolution)
import { X } from "../utils/string.js"
import { Y } from "../schemas/brain-state.js"
```

**Inconsistent:**
```typescript
// PR #17 has 15+ imports in helpers module
// Some modules imported but only 1-2 functions used
// Creates unnecessary coupling
```

---

## Remaining Technical Debt

### High Priority

#### 1. Schema Migration System (PR #5 Related)
**Current State:** Manual field-by-field migration with `??=`

**Debt:**
```typescript
// 15+ lines of migration per schema change
parsed.session.date ??= "..."
parsed.session.meta_key ??= ""
// etc...
```

**Recommended Solution:**
```typescript
// Formal schema versioning
interface SchemaVersion {
  version: string
  migrations: Migration[]
}

type Migration = (state: any) => any

const MIGRATIONS: Record<string, Migration> = {
  "1.0.0->1.1.0": (s) => ({ ...s, newField: defaultValue }),
  "1.1.0->1.2.0": (s) => ({ ...s, anotherField: defaultValue }),
}
```

#### 2. Session Lifecycle Complexity (PR #17 Related)
**Current State:** 700+ lines split across two files, still complex

**Debt:**
- 20+ imports in main hook
- 15+ imports in helpers
- No clear service boundaries

**Recommended Solution:**
```typescript
// Feature-based organization
src/
├── session/
│   ├── index.ts           # Public API
│   ├── lifecycle.ts       # Main hook orchestration
│   ├── prompts/
│   │   ├── bootstrap.ts
│   │   ├── setup.ts
│   │   └── evidence.ts
│   ├── services/
│   │   ├── archiver.ts    # handleStaleSession
│   │   ├── scanner.ts     # collectProjectSnapshot
│   │   └── compiler.ts    # compileWarningsAndSignals
│   └── types.ts
```

#### 3. Prompt Generation Duplication (PR #17 Related)
**Current State:** 5+ `generateXBlock()` functions with similar structure

**Debt:**
```typescript
// All these have similar structure:
function generateBootstrapBlock(...) { /* template literal */ }
function generateSetupGuidanceBlock(...) { /* template literal */ }
function generateProjectBackboneBlock(...) { /* template literal */ }
// etc...
```

**Recommended Solution:**
```typescript
// Template-based generation
interface PromptBlock {
  type: 'bootstrap' | 'setup' | 'evidence' | 'team' | 'backbone'
  language: Language
  data: BlockData
}

function generateBlock(block: PromptBlock): string {
  const template = TEMPLATES[block.type]
  return template.render(block.data, block.language)
}
```

### Medium Priority

#### 4. Hierarchy Rendering Duplication (PR #6 Related)
**Current State:** Two separate render functions with duplicated traversal

**Debt:**
- `toAsciiTree()` and `toActiveMdBody()` both traverse tree
- Both check cursor position
- Both handle status rendering

**Solution:** See PR #6 review — implement unified visitor pattern

#### 5. Test Coverage Gaps

| Area | Current | Target | Gap |
|------|---------|--------|-----|
| Migration logic | 0% | 80% | No migration path tests |
| Session archival | 0% | 90% | No stale session tests |
| String utilities | 70% | 90% | Missing edge cases |
| Prompt generation | 10% | 60% | Only integration tests |

#### 6. Type Safety Improvements

**Current:**
```typescript
// PR #17 uses 'any' type
frameworkContext: any // ReturnType<typeof detectFrameworkContext>
```

**Should Be:**
```typescript
// Export the type from framework-context.ts
export type FrameworkContext = ReturnType<typeof detectFrameworkContext>
// Then use it
frameworkContext: FrameworkContext
```

### Low Priority

#### 7. Documentation Debt
- PR #16: Function lacks JSDoc with complexity annotations
- PR #17: No documentation for helper functions
- PR #5: No explanation of migration strategy

#### 8. Performance Considerations
- PR #16: `levenshteinSimilarity` could memoize results
- PR #17: `collectProjectSnapshot` reads package.json on every call

---

## Pattern Violations Detected

### 1. Utils/Helpers Dumping Ground (Sharp Edge)
**Violation:** `session-lifecycle-helpers.ts`

**Why:**
- Generic name "helpers" doesn't describe purpose
- 14 functions with different responsibilities
- Will accumulate more "helper" functions over time

**Fix:** Rename or split:
```
session-lifecycle-helpers.ts
    ├──> session-prompts.ts (generateXBlock functions)
    ├──> session-services.ts (handleStaleSession, etc.)
    └──> project-scanner.ts (collectProjectSnapshot)
```

### 2. Premature Abstraction Risk (Patterns)
**Concern:** PR #17 extraction

**Symptoms:**
- Functions extracted but not reused
- Indirection without simplification
- "helpers" pattern suggests "not sure where this goes"

**Assessment:** The extraction is probably necessary (file was 900 lines) but the organization needs refinement.

### 3. Test Coupling To Implementation (Sharp Edge)
**Concern:** `tests/governance-stress.test.ts`

**Current:**
```typescript
// Tests read source file to verify implementation
check(
  sessionLifecycleSource.includes("compileIgnoredTier(") &&
  sessionLifecycleSource.includes("formatIgnoredEvidence("),
  "GOV-08 ignored block includes compact tri-evidence"
)
```

**Problem:** Test will break if functions are renamed or moved, even if behavior is unchanged.

**Fix:** Test the output, not the source:
```typescript
const output = { system: [] }
await hook({}, output)
assert(output.system.join('').includes('[IGNORED]'))
```

---

## Recommended Refactoring Roadmap

### Phase 1: Immediate (This Sprint)

1. **Rename `session-lifecycle-helpers.ts`**
   - Option A: `session-services.ts` + `prompt-generators.ts`
   - Option B: Feature folders (see above)

2. **Add Tests for Critical Paths**
   - `handleStaleSession` archival logic
   - `migrateBrainState` migration paths
   - `levenshteinSimilarity` edge cases

3. **Verify PR #6 Implementation**
   - Confirm `renderNode` abstraction exists or re-implement

### Phase 2: Short Term (Next 2 Sprints)

1. **Formal Schema Migration System**
   - Version brain-state schema
   - Create migration runner
   - Add migration tests

2. **Template-Based Prompt Generation**
   - Unify `generateXBlock` functions
   - Create template system
   - Reduce duplication

3. **Extract Services from Session Lifecycle**
   - Create `SessionArchiver` class
   - Create `ProjectScanner` class
   - Create `WarningCompiler` class

### Phase 3: Long Term (Next Quarter)

1. **Feature-Based Organization**
   - Reorganize by feature, not type
   - Move toward vertical slices

2. **Comprehensive Test Suite**
   - Unit tests for all extracted functions
   - Integration tests for critical paths
   - Property-based tests for algorithms

3. **Documentation**
   - Architecture Decision Records (ADRs)
   - Module READMEs
   - API documentation

---

## Cross-PR Dependencies

```
PR #16 (levenshtein)
    └── No dependencies, can merge anytime

PR #5 (migration)
    └── Should merge before schema changes
    └── Impacts: persistence.ts, brain-state.ts

PR #6 (hierarchy rendering)
    └── Verify implementation status
    └── May conflict with hierarchy-tree changes

PR #17 (session lifecycle)
    └── Best merged AFTER PR #16 (no conflict)
    └── Should add tests before merge
    └── Consider renaming before merge
```

---

## Conclusion

The refactoring PRs show good intent toward code organization, but vary significantly in execution quality:

- **PR #16** is a model extraction — clear boundaries, good testing, proper placement
- **PR #5** addresses a real need but doesn't solve the underlying schema evolution problem
- **PR #6** appears incomplete — needs verification
- **PR #17** reduces file size but increases complexity — needs revision

**Key Takeaway:** Extraction without abstraction and testing creates technical debt, not value.

---

*Analysis based on skill patterns from code-architecture-review references.*
