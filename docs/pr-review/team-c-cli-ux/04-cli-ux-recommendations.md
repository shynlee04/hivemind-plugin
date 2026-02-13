# Team C-CLI/UX Review: Final Verdicts & Recommendations

**Date:** 2026-02-13  
**Reviewers:** UX Architecture Team  
**Status:** COMPLETE - Pending Implementation

---

## Executive Summary

| PR | Claimed Status | Actual Status | Completion % | Verdict |
|----|----------------|---------------|--------------|---------|
| **#8** | Consolidate Configuration Constants | Partially Implemented | **30%** | ❌ **NEEDS WORK** |
| **#9** | Standardize CLI List Formatting | Not Implemented | **0%** | ❌ **REJECTED / RESTART** |

**Overall Assessment:** Both PRs fail to achieve their stated objectives. PR #8 has foundational types but lacks the centralization and dynamic error messages. PR #9's core deliverable (CliFormatter) does not exist in the codebase.

---

## PR #8: Consolidate Configuration Constants

### Verdict: ❌ NEEDS WORK

**Primary Issue:** The "single source of truth" was not achieved. While union types exist, the actual values are hardcoded in multiple locations.

### Completion Status

| Component | Status | Evidence |
|-----------|--------|----------|
| Type Definitions | ✅ Complete | Union types exist in config.ts |
| Constant Arrays | ❌ Missing | Not exported from config.ts |
| Validation Functions | ⚠️ Partial | Use hardcoded arrays, not constants |
| CLI Error Messages | ❌ Missing | All 5 messages hardcoded in init.ts |
| Interactive Init | ❌ Missing | Hardcoded options in prompts |
| Test Coverage | ❌ Missing | tests/config-health.test.ts not found |

### What Was Done
- Union types defined correctly (`GovernanceMode`, `Language`, etc.)
- Validation functions created with type guards
- `coach` automation level added (evolution since PR)
- Helper functions `isCoachAutomation()` and `normalizeAutomationLabel()` added

### What Was Missed
- **Constant arrays never exported:** The arrays shown in the PR diff (`GOVERNANCE_MODES`, `LANGUAGES`, etc.) are not in the current codebase
- **Error messages still hardcoded:** Lines 279, 287, 295, 303, 311 in init.ts
- **Test file deleted/missing:** No regression protection

### Breaking Changes Assessment

**API Changes in config.ts:**

1. **Type Additions:** `coach` added to `AutomationLevel` - **NON-BREAKING**
   - Backward compatible: old values still valid
   - New option available

2. **Helper Functions Added:** - **NON-BREAKING**
   - `isCoachAutomation()` - new function
   - `normalizeAutomationLabel()` - new function
   - No existing functions modified

3. **Export Changes:** - **BREAKING (if PR #8 were complete)**
   - Would add: `GOVERNANCE_MODES`, `LANGUAGES`, `AUTOMATION_LEVELS`, `EXPERT_LEVELS`, `OUTPUT_STYLES`
   - Impact: None currently (not exported)
   - Future impact: New exports are additive, non-breaking

**Consumer Impact:**
- Current state: No breaking changes (PR not fully implemented)
- If completed: No breaking changes, only additive exports

---

## PR #9: Standardize CLI List Formatting

### Verdict: ❌ REJECTED / RESTART

**Primary Issue:** The core deliverable (`CliFormatter` utility class) does not exist in the codebase. Claims of refactoring are unsubstantiated.

### Completion Status

| Component | Status | Evidence |
|-----------|--------|----------|
| CliFormatter Class | ❌ Missing | File does not exist |
| recall-mems.ts Refactor | ❌ Missing | Uses inline formatting |
| list-shelves.ts Refactor | ❌ Missing | Uses inline formatting |
| Other Tools | ❌ Missing | No standardization applied |
| Test Verification | ⚠️ Partial | tests/round4-mems.test.ts exists but doesn't test formatter |

### Verification Commands

```bash
# Check for CliFormatter
$ find src -name "*formatter*"
# No results

$ grep -r "CliFormatter" src/
# No results

$ grep -r "class CliFormatter" src/
# No results

$ grep -r "import.*cli-formatter" src/
# No results
```

**Result:** CliFormatter was never implemented.

### Code Duplication Confirmed

**recall-mems.ts vs list-shelves.ts:**
```typescript
// Lines 49-65 in both files are nearly identical
const lines: string[] = [];
lines.push("=== MEMS BRAIN ===");
lines.push("");
lines.push(`Total memories: ${memsState.mems.length}`);
// ... identical formatting logic
```

**Duplication Metrics:**
- ~45 lines duplicated
- ~85% similarity
- Same formatting patterns
- Same output structure

### Breaking Changes Assessment

**No Breaking Changes** - Nothing was changed (nothing was implemented).

If CliFormatter were to be implemented:
- **Expected impact:** Non-breaking
- **Refactoring tools to use formatter:** Internal change only
- **Public API:** Tool outputs would look the same

---

## Additional UX Improvements Needed

### 1. Remove "Retard" Terminology

**Severity:** HIGH  
**File:** `src/schemas/config.ts:10`

**Current State:**
```typescript
export type AutomationLevel = "manual" | "guided" | "assisted" | "full" | "coach" | "retard";
```

**Problem:**
- Offensive and exclusionary terminology
- Violates inclusive language guidelines
- Potential legal/compliance risk
- Negative UX for users with cognitive disabilities

**Recommendation:**
1. Remove "retard" from `AutomationLevel` type
2. Keep backward compatibility at input parsing only
3. Map "retard" → "coach" immediately on input
4. Never display "retard" in UI or error messages

**Implementation:**
```typescript
// Accept "retard" at CLI/API boundary only
export type AutomationLevel = "manual" | "guided" | "assisted" | "full" | "coach";

// Input sanitization
export function parseAutomationLevel(input: string): AutomationLevel {
  if (input === "retard") return "coach";  // Backward compat
  // ... validation
}
```

### 2. Standardize Error Message Format

**Severity:** MEDIUM  
**File:** `src/cli/init.ts:278-311`

**Current State (Inconsistent):**
```typescript
// Line 278-279: Checkmark prefix
log(`✗ Invalid governance mode: ${governanceMode}`)
log("  Valid: permissive, assisted, strict")

// Line 311: Special case
log("  Valid: manual, guided, assisted, full, coach (legacy alias 'retard' is accepted)")
```

**Recommendations:**
1. Use consistent prefix: `✗` for errors
2. Use constants for valid options: `.join(", ")`
3. Remove legacy aliases from error messages
4. Consistent indentation (2 spaces)

**Target Format:**
```typescript
log(`✗ Invalid governance mode: ${governanceMode}`)
log(`  Valid: ${GOVERNANCE_MODES.join(", ")}`)
```

### 3. Create Visual Style Guide

**Severity:** MEDIUM  
**Scope:** All CLI tools

**Current State:** 5+ different header styles, inconsistent indentation

**Proposed Standards:**
```typescript
// Header format
=== TITLE IN CAPS ===

// Section format
## Section Title

// List items (2-space indent)
  - Item one
  - Item two

// Key-value pairs (2-space indent)
  key: value

// Footer format
=== END TITLE ===

// Next action hint
→ Use command_name for next step
```

### 4. Add Configuration Validation Tests

**Severity:** HIGH  
**File:** `tests/config-health.test.ts` (missing)

**Why Critical:**
- No regression protection for configuration changes
- Validation logic could break silently
- No verification that constants match types

**Test Requirements:**
1. Constants are arrays with expected values
2. Validation functions return correct results
3. All type values pass validation
4. Invalid values are rejected
5. Constants and types stay in sync

### 5. Implement Missing CliFormatter

**Severity:** HIGH  
**File:** `src/lib/cli-formatter.ts` (missing)

**Why Critical:**
- PR #9 claims it exists but it doesn't
- Significant code duplication
- No standardization possible without it
- Maintenance burden high

**Minimum Viable API:**
```typescript
export class CliFormatter {
  header(title: string): string;
  section(title: string): string;
  line(text?: string): string;
  indented(text: string, level?: number): string;
  keyValue(key: string, value: string | number): string;
  list(items: string[], bullet?: string): string[];
  footer(title: string): string;
  arrow(text: string): string;
}
```

---

## Implementation Roadmap

### Phase 1: Fix PR #8 (2-3 hours)

1. **Export constants from config.ts** (15 min)
   ```typescript
   export const GOVERNANCE_MODES = ["permissive", "assisted", "strict"] as const;
   export const LANGUAGES = ["en", "vi"] as const;
   // ... etc
   ```

2. **Update validation functions** (15 min)
   ```typescript
   return (GOVERNANCE_MODES as readonly string[]).includes(mode);
   ```

3. **Update CLI error messages** (30 min)
   - Replace 5 hardcoded strings with `.join(", ")`
   - Use imported constants

4. **Create config-health.test.ts** (45 min)
   - Test constants exist
   - Test validation functions
   - Test constants/validation alignment

5. **Update interactive-init.ts** (30 min)
   - Use constants for prompt options
   - Ensure single source of truth

### Phase 2: Address Terminology (30 min)

1. **Remove "retard" from public types** (15 min)
2. **Add input mapping** (10 min)
3. **Update error messages** (5 min)

### Phase 3: Implement PR #9 (4-6 hours)

1. **Create CliFormatter class** (90 min)
   - Design API
   - Implement methods
   - Add JSDoc

2. **Refactor recall-mems.ts** (30 min)
3. **Refactor list-shelves.ts** (30 min)
4. **Refactor scan-hierarchy.ts** (60 min)
5. **Refactor think-back.ts** (45 min)
6. **Update tests** (30 min)

### Phase 4: Documentation (1 hour)

1. **Create CLI style guide** (30 min)
2. **Update AGENTS.md** (15 min)
3. **Add migration notes** (15 min)

**Total Estimated Effort:** 8-10 hours

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| "Retard" terminology backlash | Medium | High | Remove immediately |
| Config drift continues | High | Medium | Implement PR #8 |
| CLI inconsistency grows | High | Low | Implement PR #9 |
| Test coverage gaps | Medium | Medium | Add config-health tests |
| Breaking changes in future | Low | Medium | Export constants now |

---

## Recommendations Summary

### Immediate Actions (This Week)

1. ✅ **Export configuration constants** from `src/schemas/config.ts`
2. ✅ **Refactor CLI error messages** in `src/cli/init.ts`
3. ✅ **Remove "retard"** from public types and error messages
4. ✅ **Create missing test file** `tests/config-health.test.ts`

### Short-term Actions (Next Sprint)

5. 📋 **Implement CliFormatter** utility class
6. 📋 **Refactor recall-mems.ts** and **list-shelves.ts**
7. 📋 **Create CLI style guide** documentation
8. 📋 **Standardize remaining tools**

### Long-term Actions (Backlog)

9. 📋 **Add automated linting** for hardcoded strings
10. 📋 **Visual regression tests** for CLI output
11. 📋 **Accessibility audit** of CLI language

---

## Final Verdicts

### PR #8: Consolidate Configuration Constants
**Status:** ❌ **INCOMPLETE - Needs Revision**  
**Completion:** 30%  
**Recommendation:** Complete implementation before merge

**Required Changes:**
- [ ] Export constant arrays from config.ts
- [ ] Update validation functions to use constants
- [ ] Update CLI error messages to use constants
- [ ] Create tests/config-health.test.ts
- [ ] Update interactive-init.ts to use constants

### PR #9: Standardize CLI List Formatting
**Status:** ❌ **NOT IMPLEMENTED - Reject or Restart**  
**Completion:** 0%  
**Recommendation:** Create new PR with actual implementation

**Required Changes:**
- [ ] Create src/lib/cli-formatter.ts
- [ ] Implement CliFormatter class with full API
- [ ] Refactor recall-mems.ts to use formatter
- [ ] Refactor list-shelves.ts to use formatter
- [ ] Add tests for CliFormatter

### Code Review Decision

**DO NOT MERGE** either PR in current state.

**Rationale:**
- PR #8 creates maintenance burden without delivering promised benefits
- PR #9 is essentially an empty PR with false claims
- Both require significant additional work
- Merging would create technical debt, not reduce it

**Alternative:** Create a single consolidated PR completing both objectives with proper implementation.

---

## Appendix: Key Files Checklist

### PR #8 Files
- [ ] `src/schemas/config.ts` - Export constants, update validations
- [ ] `src/cli/init.ts` - Use constants in error messages
- [ ] `src/cli/interactive-init.ts` - Use constants in prompts
- [ ] `tests/config-health.test.ts` - Create test file

### PR #9 Files
- [ ] `src/lib/cli-formatter.ts` - Create utility class
- [ ] `src/tools/recall-mems.ts` - Refactor to use formatter
- [ ] `src/tools/list-shelves.ts` - Refactor to use formatter
- [ ] `tests/round4-mems.test.ts` - Update/add formatter tests

### Documentation
- [ ] `docs/cli-style-guide.md` - Create style guide
- [ ] `CHANGELOG.md` - Document changes
- [ ] `AGENTS.md` - Update if needed

---

*End of Review*
