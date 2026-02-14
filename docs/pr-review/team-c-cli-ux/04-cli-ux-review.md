# Team C-CLI/UX Review: Individual PR Analysis

**Date:** 2026-02-13  
**Reviewer:** UX Architecture Team  
**PRs Analyzed:** #8 (Consolidate Configuration Constants), #9 (Standardize CLI List Formatting)

---

## PR #8: Consolidate Configuration Constants

### Overview
PR #8 aimed to convert TypeScript union types into constant arrays with derived types, creating a "single source of truth" for configuration options.

### Intended Changes (from diff)
- **GOVERNANCE_MODES** = ["permissive", "assisted", "strict"]
- **LANGUAGES** = ["en", "vi"]
- **AUTOMATION_LEVELS** = ["manual", "guided", "assisted", "full", "retard"]
- **EXPERT_LEVELS** = ["beginner", "intermediate", "advanced", "expert"]
- **OUTPUT_STYLES** = ["explanatory", "outline", "skeptical", "architecture", "minimal"]

### Current State Assessment

#### ✅ What Was Applied
- Type definitions exist in `src/schemas/config.ts`
- Validation functions exist but use hardcoded arrays

#### ❌ What Was NOT Applied (Critical Gaps)

**1. Constant Arrays Missing**
The constant arrays (`GOVERNANCE_MODES`, `LANGUAGES`, etc.) are **NOT exported** from config.ts. Current code still uses hardcoded arrays:

```typescript
// src/schemas/config.ts:101-119 (CURRENT)
export function isValidGovernanceMode(mode: string): mode is GovernanceMode {
  return ["permissive", "assisted", "strict"].includes(mode);  // HARDCODED
}
```

**2. Error Messages Still Hardcoded**
`src/cli/init.ts` lines 279, 287, 295, 303, 311 contain hardcoded validation messages:

```typescript
// Line 279 - HARDCODED
log("  Valid: permissive, assisted, strict")

// Line 287 - HARDCODED  
log("  Valid: en, vi")

// Line 295 - HARDCODED
log("  Valid: beginner, intermediate, advanced, expert")

// Line 303 - HARDCODED
log("  Valid: explanatory, outline, skeptical, architecture, minimal")

// Line 311 - HARDCODED
log("  Valid: manual, guided, assisted, full, coach (legacy alias 'retard' is accepted)")
```

**3. Test File Missing**
`tests/config-health.test.ts` does not exist in the codebase.

**4. Evolution Since PR**
Current config.ts includes "coach" automation level not present in PR #8 diff:
```typescript
export type AutomationLevel = "manual" | "guided" | "assisted" | "full" | "coach" | "retard";
```

### UX Improvement Score: 3/10

| Criteria | Score | Notes |
|----------|-------|-------|
| Type Safety | 5/10 | Union types exist but no constant arrays |
| Single Source of Truth | 2/10 | Hardcoded strings everywhere |
| Error Message Quality | 3/10 | Inconsistent formatting, hardcoded lists |
| Maintainability | 4/10 | Adding new option requires 3+ file changes |

### Consistency Verification

**Pattern Completeness: FAILED**
- ❌ Constant arrays not exported
- ❌ Validation functions use hardcoded values
- ❌ CLI error messages don't use constants
- ❌ Interactive init doesn't use constants for prompt options

### Configuration Pattern Assessment

**Anti-Pattern Detected:** String Typing Everywhere  
Reference: `code-architecture-review/references/sharp_edges.md:277-311`

The codebase uses hardcoded strings where union types/constants should exist. This creates:
- No autocomplete support for valid values
- Typo-prone manual entry
- Refactoring hazards
- Poor self-documentation

---

## PR #9: Standardize CLI List Formatting

### Overview
PR #9 intended to create a `CliFormatter` utility class to standardize CLI output across all tools, supporting headers, section headers, indented lists, key-value pairs, and footers.

### Claimed Changes
- New `src/lib/cli-formatter.ts` utility class
- Refactored `recall-mems.ts` to use formatter
- Refactored `list-shelves.ts` to use formatter
- Verified by `tests/round4-mems.test.ts`

### Current State Assessment

#### ❌ Critical Finding: CliFormatter Does NOT Exist

**Verification:**
```bash
$ find src -name "*formatter*" -o -name "*cli-formatter*"
# No results

$ grep -r "CliFormatter" src/
# No results

$ grep -r "cli-formatter" src/
# No results
```

**Files Examined:**
- `src/lib/cli-formatter.ts` - **DOES NOT EXIST**
- `src/tools/recall-mems.ts` - Uses inline string array building
- `src/tools/list-shelves.ts` - Uses inline string array building

### Code Duplication Analysis

Both `recall-mems.ts` and `list-shelves.ts` have **identical formatting patterns**:

```typescript
// recall-mems.ts:49-82 (lines array building)
const lines: string[] = [];
lines.push("=== MEMS BRAIN ===");
lines.push("");
lines.push(`Total memories: ${memsState.mems.length}`);
// ...
return lines.join("\n");

// list-shelves.ts:28-65 (nearly identical)
const lines: string[] = [];
lines.push("=== MEMS BRAIN ===");
lines.push("");
lines.push(`Total memories: ${memsState.mems.length}`);
// ...
return lines.join("\n");
```

### Other Tools With Similar Patterns

| Tool File | Formatting Pattern | Lines |
|-----------|-------------------|-------|
| `scan-hierarchy.ts` | Custom lines array | 170-280 |
| `think-back.ts` | Custom lines array | 42-150 |
| `save-mem.ts` | Template string | 59 |
| `export-cycle.ts` | Template string | ~40 |

### UX Improvement Score: 0/10

**Rationale:** The PR claims were not implemented. No standardization exists.

### Consistency Verification

**Pattern Completeness: FAILED**
- ❌ CliFormatter utility does not exist
- ❌ No standardization across tools
- ❌ Code duplication between recall-mems and list-shelves
- ❌ Each tool implements its own formatting

### CLI Output Inconsistencies Found

**Header Styles (Inconsistent):**
- `=== MEMS BRAIN ===` (recall-mems, list-shelves)
- `=== THINK BACK: Context Refresh ===` (think-back)
- `📊 Session: ...` (scan-hierarchy - uses emoji)
- `=== BROWNFIELD ANALYZE ===` (scan-hierarchy)

**Indentation Styles:**
- 2 spaces: `  ${shelf}: ${count}` (recall-mems)
- 2 spaces with emoji: `  ✅ ${healthEmoji}` (scan-hierarchy)
- No indentation for some lists

**Footer Styles:**
- `=== END MEMS BRAIN ===` (recall-mems)
- `=== END THINK BACK ===` (think-back)
- Arrow notation: `→ Use map_context...` (scan-hierarchy, think-back)

---

## Critical Issues Summary

### PR #8 Issues
1. **Configuration constants not centralized** - Still using hardcoded arrays
2. **Validation functions duplicate values** - No single source of truth
3. **CLI error messages hardcoded** - Prone to drift
4. **Test file missing** - No regression protection

### PR #9 Issues  
1. **CliFormatter never implemented** - Core deliverable missing
2. **Code duplication rampant** - 2+ files with identical formatting logic
3. **No style guide enforcement** - Each tool invents its own patterns
4. **Inconsistent visual language** - Headers, indents, footers vary

### Cross-Cutting Concerns

**"Retard" Terminology Issue:**
The automation level includes "retard" as a valid value (alias for "coach" mode):
```typescript
export type AutomationLevel = "manual" | "guided" | "assisted" | "full" | "coach" | "retard";
```

**UX Impact:** Highly problematic terminology that may:
- Alienate users with disabilities
- Violate inclusive language guidelines
- Damage project reputation
- Create legal/compliance risks

**Recommendation:** Remove "retard" entirely or map at CLI input level only, never expose in UI/types.

---

## Files Requiring Updates

### To Complete PR #8
1. `src/schemas/config.ts` - Export constant arrays
2. `src/cli/init.ts` - Use constants in error messages
3. `src/cli/interactive-init.ts` - Use constants for prompt options
4. `tests/config-health.test.ts` - Create test file

### To Complete PR #9
1. `src/lib/cli-formatter.ts` - Create utility class
2. `src/tools/recall-mems.ts` - Refactor to use formatter
3. `src/tools/list-shelves.ts` - Refactor to use formatter
4. `src/tools/scan-hierarchy.ts` - Refactor to use formatter
5. `src/tools/think-back.ts` - Refactor to use formatter
6. `tests/round4-mems.test.ts` - Update tests if needed

---

## Compliance with Architecture Patterns

### PR #8: Violates "String Typing Everywhere" Rule
Reference: `validations.md:187-206`
> "String comparison for type discrimination. Use union types or enums."

**Status:** Partially compliant (has union types, but no centralized constants)

### PR #9: Violates "Utils/Helpers Dumping Ground" Anti-Pattern
Reference: `patterns.md:188-200`
> "File called utils.ts or helpers.ts with unrelated functions"

**Status:** Not applicable (file doesn't exist, but the problem is no utility exists at all)

### PR #9: Violates "Shotgun Surgery" Anti-Pattern
Reference: `sharp_edges.md:163-172`
> "One logical change requires editing many files"

**Status:** Currently each formatting change requires editing multiple tool files

---

## Conclusion

**PR #8 Completion:** ~30%  
**PR #9 Completion:** ~0%

Both PRs require significant additional work to achieve their stated goals. The "single source of truth" and "standardized CLI formatting" objectives remain unfulfilled.
