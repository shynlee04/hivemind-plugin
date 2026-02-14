# Team C Refactoring: Final Recommendations

**Date:** 2026-02-13  
**Status:** Architectural Review Complete  
**Reviewer:** Code Architecture Review Specialist  

---

## Executive Summary

| PR | Status | Recommendation | Risk Level |
|----|--------|----------------|------------|
| #5 Extract State Migration | ✅ **Ready** | Accept with minor revisions | Low |
| #6 Hierarchy Rendering | ⚠️ **Blocked** | Verify implementation or re-implement | Medium |
| #16 Extract levenshteinSimilarity | ✅ **Ready** | Accept as-is | Low |
| #17 Session Lifecycle | ⚠️ **Needs Work** | Revise organization + add tests | Medium |

---

## PR #5: Extract State Migration Logic

### Verdict: **ACCEPT WITH NOTES**

### Completion Status: 85%

**Completed:**
- ✅ Migration logic extracted to `brain-state.ts`
- ✅ `persistence.ts` simplified
- ✅ Backward compatible

**Missing:**
- ❌ Migration tests (schema evolution paths)
- ❌ Documentation of migration strategy
- ❌ Formal schema versioning

### Risk Assessment

**Low Risk** — Changes are localized and backward compatible.

**Potential Issues:**
1. Migration logic may grow unbounded with each schema change
2. No tests verify migration correctness
3. Field removal (sentiment_signals) not tested

### Action Items

1. **Before Merge:**
   - [ ] Add test: `migrateBrainState` adds missing fields with correct defaults
   - [ ] Add test: `migrateBrainState` doesn't overwrite existing valid data
   - [ ] Add test: Deprecated field removal works correctly

2. **After Merge:**
   - [ ] Create ticket for formal schema versioning system
   - [ ] Document migration strategy in README

### Suggested Test Additions

```typescript
// tests/schemas.test.ts
function test_migration_adds_missing_fields() {
  const partialState = { /* v1.0 state without newer fields */ }
  const migrated = migrateBrainState(partialState)
  assert(migrated.compaction_count === 0, "adds compaction_count default")
  assert(migrated.framework_selection !== undefined, "adds framework_selection")
}

function test_migration_preserves_existing_data() {
  const stateWithData = { 
    compaction_count: 5,
    /* other fields */
  }
  const migrated = migrateBrainState(stateWithData)
  assert(migrated.compaction_count === 5, "preserves existing value")
}
```

---

## PR #6: Hierarchy Rendering Refactor

### Verdict: **INVESTIGATE / REVISE**

### Completion Status: Unknown

**Issue:** The claimed `renderNode` unified abstraction does not exist in current code.

### Risk Assessment

**Medium Risk** — May indicate:
1. Incomplete implementation
2. Implementation on different branch
3. Reverted changes
4. Documentation error

### Action Items

1. **Immediate:**
   - [ ] Verify commit `d474461` contents
   - [ ] Check if changes are on different branch
   - [ ] Determine if PR was partially reverted

2. **If Implementation Missing:**
   - [ ] Re-implement unified `renderNode` helper
   - [ ] Apply DRY principle to `toAsciiTree` and `toActiveMdBody`
   - [ ] Add tests for both rendering formats

3. **If Implementation Exists Elsewhere:**
   - [ ] Merge appropriate branch
   - [ ] Update PR documentation

### Recommended Implementation

```typescript
// src/lib/hierarchy-tree.ts

type RenderFormat = 'ascii' | 'markdown' | 'summary';

interface RenderOptions {
  format: RenderFormat;
  showCursor: boolean;
  maxContentLength: number;
}

function renderNode(
  node: HierarchyNode, 
  options: RenderOptions, 
  isCursor: boolean
): string {
  switch (options.format) {
    case 'ascii': return renderAscii(node, isCursor, options);
    case 'markdown': return renderMarkdown(node, isCursor, options);
    case 'summary': return renderSummary(node, isCursor, options);
  }
}

// Refactor existing functions to use renderNode
export function toAsciiTree(tree: HierarchyTree): string {
  // Use renderNode with format: 'ascii'
}

export function toActiveMdBody(tree: HierarchyTree): string {
  // Use renderNode with format: 'markdown'
}
```

---

## PR #16: Extract levenshteinSimilarity Utility

### Verdict: **ACCEPT**

### Completion Status: 95%

**Completed:**
- ✅ Clean extraction to `utils/string.ts`
- ✅ Proper module naming
- ✅ Comprehensive tests
- ✅ No breaking changes

**Minor Improvements Suggested:**
- Could add JSDoc
- Could add complexity annotation

### Risk Assessment

**Low Risk** — Excellent implementation.

**Strengths:**
- Pure function with clear inputs/outputs
- Properly placed in utils module
- Good test coverage
- No dependencies

### Action Items

1. **Optional Before Merge:**
   - [ ] Add JSDoc comment
   - [ ] Add `@complexity O(n)` annotation

2. **After Merge:**
   - [ ] Consider additional string utilities for the module

### Suggested Enhancement

```typescript
/**
 * Calculates string similarity using character overlap ratio.
 * Optimized for detecting "same content with minor edits".
 * 
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Similarity ratio between 0 (completely different) and 1 (identical)
 * @complexity O(n + m) where n and m are string lengths
 * 
 * @example
 * levenshteinSimilarity("hello", "hello") // 1
 * levenshteinSimilarity("abc", "abd") // 0.5
 * levenshteinSimilarity("abc", "def") // 0
 */
export function levenshteinSimilarity(a: string, b: string): number {
  // ... existing implementation
}
```

---

## PR #17: Session Lifecycle Refactor

### Verdict: **REVISE**

### Completion Status: 70%

**Completed:**
- ✅ 700+ lines extracted from main file
- ✅ Functions organized in helpers module
- ✅ No breaking changes

**Significant Issues:**
- ❌ Poor module naming (`session-lifecycle-helpers.ts`)
- ❌ Low cohesion in helpers module
- ❌ Missing unit tests for extracted functions
- ❌ No clear abstraction boundaries

### Risk Assessment

**Medium Risk** — Extraction without proper organization.

**Concerns:**
1. `handleStaleSession` performs archival with no direct tests
2. Module name violates architecture guidelines
3. 15+ imports in helpers module indicates high coupling
4. Functions remain complex after extraction

### Action Items

**Required Before Merge:**

1. **Rename Module:**
   ```
   session-lifecycle-helpers.ts
       ├──> session-prompts.ts (prompt generators)
       ├──> session-services.ts (archival, compilation)
       └──> project-scanner.ts (project scanning)
   ```

2. **Add Unit Tests:**
   - [ ] Test `handleStaleSession` archival logic
   - [ ] Test `compileWarningsAndSignals` prioritization
   - [ ] Test `collectProjectSnapshot` edge cases
   - [ ] Test prompt generator outputs

3. **Reduce Coupling:**
   - [ ] Move `handleStaleSession` dependencies into parameters
   - [ ] Consider service objects instead of standalone functions

**Recommended Structure:**

```typescript
// src/services/session-archiver.ts
export interface SessionArchiver {
  handleStaleSession(state: BrainState): Promise<BrainState>
}

export function createSessionArchiver(
  directory: string,
  config: HiveMindConfig,
  log: Logger,
  stateManager: StateManager
): SessionArchiver {
  return {
    async handleStaleSession(state) {
      // Implementation
    }
  }
}

// src/services/prompt-generator.ts  
export interface PromptGenerator {
  generateBootstrapBlock(mode: string, lang: Language): string
  generateSetupGuidanceBlock(directory: string): Promise<string>
  // etc...
}
```

### Suggested Test Additions

```typescript
// tests/session-archiver.test.ts
async function test_stale_session_archival() {
  const archiver = createSessionArchiver(dir, config, log, stateManager)
  const staleState = createBrainState("old-session", config)
  staleState.session.last_activity = Date.now() - (10 * 24 * 60 * 60 * 1000) // 10 days
  
  const newState = await archiver.handleStaleSession(staleState)
  
  assert(newState.session.id !== "old-session", "creates new session")
  assert(await archiveExists(dir, "old-session"), "archives old session")
}

// tests/prompt-generator.test.ts
function test_bootstrap_block_generation() {
  const generator = createPromptGenerator()
  const block = generator.generateBootstrapBlock("strict", "en")
  
  assert(block.includes("<hivemind-bootstrap>"), "includes opening tag")
  assert(block.includes("declare_intent"), "includes workflow instructions")
  assert(block.includes("LOCKED"), "includes lock status")
}
```

---

## Additional Refactoring Opportunities

### 1. Create Formal Utils Module

**Current:** Only `string.ts` in utils  
**Opportunity:** Add more cross-cutting utilities

```
src/
└── utils/
    ├── string.ts        # ✅ exists
    ├── array.ts         # formatHintList, etc.
    ├── date.ts          # timestamp formatting
    └── validation.ts    # input validators
```

### 2. Unify Prompt Generation

**Current:** 5+ separate `generateXBlock` functions  
**Opportunity:** Template-based system

```typescript
// src/services/prompt-templates.ts
export const PROMPT_TEMPLATES = {
  bootstrap: (data: BootstrapData, lang: Language) => `...`,
  setup: (data: SetupData, lang: Language) => `...`,
  evidence: (data: EvidenceData, lang: Language) => `...`,
  // etc...
}
```

### 3. Extract Project Scanning

**Current:** `collectProjectSnapshot` in session lifecycle  
**Opportunity:** Standalone service

```typescript
// src/services/project-scanner.ts
export interface ProjectScanner {
  scan(directory: string): Promise<ProjectSnapshot>
  detectStack(packageJson: unknown): string[]
  detectArtifacts(directory: string): string[]
}
```

### 4. Schema Evolution Framework

**Current:** Manual field-by-field migration  
**Opportunity:** Formal versioning

```typescript
// src/schemas/migrations.ts
export const SCHEMA_VERSIONS = ['1.0.0', '1.1.0', '1.2.0'] as const

export const MIGRATIONS: Record<string, Migration> = {
  '1.0.0->1.1.0': migrateV1ToV1_1,
  '1.1.0->1.2.0': migrateV1_1ToV1_2,
}
```

---

## Final Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss in stale session archival | Low | High | Add tests before merge (PR #17) |
| Migration logic bugs | Medium | High | Add migration tests (PR #5) |
| Hierarchy rendering inconsistency | Medium | Medium | Verify/reimplement (PR #6) |
| Utils module bloat | Medium | Low | Establish clear guidelines |
| Test maintenance burden | Medium | Medium | Test behavior, not implementation |

---

## Merge Recommendations

### Immediate (This Week)
1. **Merge PR #16** — Clean extraction, low risk
2. **Merge PR #5** — Add migration tests first

### Short Term (Next 2 Weeks)
3. **Investigate PR #6** — Verify implementation status
4. **Revise PR #17** — Rename module + add tests

### Blocked
- PR #6 until implementation verified
- PR #17 until organization improved

---

## Success Metrics

**After all PRs merged:**

1. **Code Metrics:**
   - Average file size < 300 lines
   - Max imports per file < 15
   - Utils modules clearly named

2. **Test Metrics:**
   - Unit test coverage > 70% for extracted functions
   - All critical paths (archival, migration) tested
   - No tests reading source files

3. **Maintainability:**
   - Clear module boundaries
   - Consistent naming conventions
   - Documented architecture decisions

---

*End of Refactoring Recommendations*

**Next Steps:**
1. Review individual PR verdicts with team
2. Create tickets for required revisions
3. Schedule follow-up review after revisions
