# Team C-CLI/UX Review: Consistency Audit

**Date:** 2026-02-13  
**Scope:** CLI output patterns, configuration management, error handling

---

## 1. Before/After Comparison

### PR #8: Configuration Constants

#### Before (Current State - Hardcoded Strings)

**Validation Functions (`src/schemas/config.ts:101-119`):**
```typescript
export function isValidGovernanceMode(mode: string): mode is GovernanceMode {
  return ["permissive", "assisted", "strict"].includes(mode);  // Hardcoded
}

export function isValidLanguage(lang: string): lang is Language {
  return ["en", "vi"].includes(mode);  // Hardcoded
}

export function isValidExpertLevel(level: string): level is ExpertLevel {
  return ["beginner", "intermediate", "advanced", "expert"].includes(level);  // Hardcoded
}

export function isValidOutputStyle(style: string): style is OutputStyle {
  return ["explanatory", "outline", "skeptical", "architecture", "minimal"].includes(style);  // Hardcoded
}

export function isValidAutomationLevel(level: string): level is AutomationLevel {
  return ["manual", "guided", "assisted", "full", "coach", "retard"].includes(level);  // Hardcoded
}
```

**CLI Error Messages (`src/cli/init.ts:279-311`):**
```typescript
// Line 279
log("  Valid: permissive, assisted, strict")

// Line 287
log("  Valid: en, vi")

// Line 295
log("  Valid: beginner, intermediate, advanced, expert")

// Line 303
log("  Valid: explanatory, outline, skeptical, architecture, minimal")

// Line 311
log("  Valid: manual, guided, assisted, full, coach (legacy alias 'retard' is accepted)")
```

#### After (Intended State from PR #8 Diff)

**Validation Functions:**
```typescript
export const GOVERNANCE_MODES = ["permissive", "assisted", "strict"] as const;
export type GovernanceMode = (typeof GOVERNANCE_MODES)[number];

export function isValidGovernanceMode(mode: string): mode is GovernanceMode {
  return (GOVERNANCE_MODES as readonly string[]).includes(mode);  // Uses constant
}
```

**CLI Error Messages:**
```typescript
// Line 279
log(`  Valid: ${GOVERNANCE_MODES.join(", ")}`)  // Dynamic

// Line 287
log(`  Valid: ${LANGUAGES.join(", ")}`)  // Dynamic

// Line 295
log(`  Valid: ${EXPERT_LEVELS.join(", ")}`)  // Dynamic

// Line 303
log(`  Valid: ${OUTPUT_STYLES.join(", ")}`)  // Dynamic

// Line 311
log(`  Valid: ${AUTOMATION_LEVELS.join(", ")} ("I am retard — lead me")`)  // Dynamic
```

**Status:** ❌ NOT IMPLEMENTED - Still in "Before" state

---

### PR #9: CLI Formatting Standardization

#### Before (Current State - Ad-hoc Formatting)

**recall-mems.ts:**
```typescript
const lines: string[] = [];
lines.push("=== MEMS BRAIN ===");
lines.push("");
lines.push(`Total memories: ${memsState.mems.length}`);
lines.push("");
lines.push("## Shelves");
for (const shelf of BUILTIN_SHELVES) {
  const count = summary[shelf] || 0;
  lines.push(`  ${shelf}: ${count}`);
}
// ... 80 more lines of formatting
```

**list-shelves.ts:**
```typescript
const lines: string[] = [];
lines.push("=== MEMS BRAIN ===");
lines.push("");
lines.push(`Total memories: ${memsState.mems.length}`);
lines.push("");
lines.push("## Shelves");
for (const shelf of BUILTIN_SHELVES) {
  const count = summary[shelf] || 0;
  lines.push(`  ${shelf}: ${count}`);
}
// ... nearly identical to recall-mems.ts
```

**scan-hierarchy.ts:**
```typescript
const lines: string[] = []
lines.push(`📊 Session: ${state.session.governance_status} | Mode: ${state.session.mode}`)
lines.push(`   ID: ${state.session.id}`)
lines.push("")
// Different style: emoji headers, different indentation
```

**think-back.ts:**
```typescript
const lines: string[] = [];
lines.push("=== THINK BACK: Context Refresh ===");
lines.push("");
lines.push("## Where You Are");
// Different style: descriptive headers, markdown-style sections
```

#### After (Intended State from PR #9 Claims)

**With CliFormatter:**
```typescript
// src/lib/cli-formatter.ts (CLAIMED but NOT IMPLEMENTED)
export class CliFormatter {
  header(title: string): string { /* ... */ }
  section(title: string): string { /* ... */ }
  indented(text: string, level: number = 1): string { /* ... */ }
  keyValue(key: string, value: string): string { /* ... */ }
  footer(title: string): string { /* ... */ }
}

// Tool usage:
const fmt = new CliFormatter();
return [
  fmt.header("MEMS BRAIN"),
  fmt.line(),
  fmt.keyValue("Total memories", memsState.mems.length.toString()),
  fmt.line(),
  fmt.section("Shelves"),
  ...BUILTIN_SHELVES.map(s => fmt.indented(`${s}: ${summary[s] || 0}`)),
  fmt.line(),
  fmt.footer("END MEMS BRAIN")
].join("\n");
```

**Status:** ❌ NOT IMPLEMENTED - CliFormatter doesn't exist

---

## 2. Remaining Inconsistencies

### A. Header Format Inconsistencies

| Tool | Header Style | Example |
|------|---------------|---------|
| recall-mems.ts | Double equals | `=== MEMS BRAIN ===` |
| list-shelves.ts | Double equals | `=== MEMS BRAIN ===` |
| think-back.ts | Double equals + description | `=== THINK BACK: Context Refresh ===` |
| scan-hierarchy.ts | Emoji prefix | `📊 Session: ...` |
| scan-hierarchy.ts | Section headers | `=== BROWNFIELD ANALYZE ===` |
| scan-hierarchy.ts | Markdown style | `## Where You Are` |

**Inconsistency:** 5 different header conventions across 4 files

### B. Indentation Inconsistencies

```typescript
// recall-mems.ts:58
lines.push(`  ${shelf}: ${count}`);  // 2 spaces

// scan-hierarchy.ts:199
lines.push(`  [${a.key}]: ${a.value.slice(0, 60)}`);  // 2 spaces

// scan-hierarchy.ts:172
lines.push(`   ID: ${state.session.id}`);  // 3 spaces

// scan-hierarchy.ts:237
lines.push(`  ☐ [${a.key}]: ${a.value}`);  // 2 spaces + checkbox
```

**Inconsistency:** Indentation varies between 2-3 spaces

### C. List Item Prefixes

```typescript
// scan-hierarchy.ts:88-90 (hyphen)
for (const signal of summary.artifacts.staleSignals) {
  lines.push(`  - ${signal}`);
}

// scan-hierarchy.ts:113 (no prefix)
state.metrics.files_touched.slice(0, maxShow).forEach(f => lines.push(`  - ${f}`));

// scan-hierarchy.ts:199 (bracket notation)
lines.push(`  [${a.key}]: ${a.value.slice(0, 60)}`);
```

**Inconsistency:** `- `, no prefix, `[key]: ` used inconsistently

### D. Footer/Closing Patterns

| Tool | Footer Style |
|------|--------------|
| recall-mems.ts | `=== END MEMS BRAIN ===` |
| list-shelves.ts | `=== END MEMS BRAIN ===` |
| think-back.ts | `=== END THINK BACK ===` |
| scan-hierarchy.ts | No explicit footer |
| save-mem.ts | Arrow notation |

**Inconsistency:** Some have explicit footers, some don't

### E. Empty Line Handling

```typescript
// think-back.ts:43-44
lines.push("=== THINK BACK: Context Refresh ===");
lines.push("");  // Empty line after header

// scan-hierarchy.ts:170-172
lines.push(`📊 Session: ${state.session.governance_status} | Mode: ${state.session.mode}`)
lines.push(`   ID: ${state.session.id}`)
lines.push("")  // Empty line after ID
```

**Inconsistency:** Inconsistent spacing patterns

### F. Key-Value Formatting

```typescript
// recall-mems.ts:52
lines.push(`Total memories: ${memsState.mems.length}`);

// scan-hierarchy.ts:191
lines.push(`  Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100`);

// scan-hierarchy.ts:410
lines.push(`Anchors updated: ${anchorsAdded}`);
```

**Inconsistency:** Some prefixed, some not; different separators (`: ` vs ` | `)

### G. Error Message Formatting

```typescript
// init.ts:278-279
log(`✗ Invalid governance mode: ${governanceMode}`)
log("  Valid: permissive, assisted, strict")

// think-back.ts:36
return "ERROR: No active session. Call declare_intent to start.";

// scan-hierarchy.ts:166
return "ERROR: No active session. Call declare_intent to start."
```

**Inconsistency:** `✗` vs `ERROR:` prefixes; indentation varies

---

## 3. Style Guide Compliance

### Proposed CLI Style Guide (Not Currently Followed)

Based on analysis, a consistent style should include:

**Headers:**
- Use `=== TITLE ===` format
- UPPERCASE for main headers
- Empty line after header

**Sections:**
- Use `## Section Name` format
- Title case for section names
- Empty line before section

**Lists:**
- Use 2-space indentation
- Use `- ` prefix for unordered items
- Use `key: value` format for key-value pairs

**Footers:**
- Use `=== END TITLE ===` format
- Match header capitalization
- Optional arrow notation for next actions: `→ `

**Error Messages:**
- Use `✗ ` prefix for validation errors
- Use `ERROR: ` prefix for system errors
- Valid options indented with 2 spaces

### Current Compliance Matrix

| Tool | Headers | Sections | Lists | Footers | Errors |
|------|---------|----------|-------|---------|--------|
| recall-mems.ts | ⚠️ Partial | ⚠️ Partial | ✅ Yes | ✅ Yes | N/A |
| list-shelves.ts | ⚠️ Partial | ⚠️ Partial | ✅ Yes | ✅ Yes | N/A |
| think-back.ts | ⚠️ Partial | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Partial |
| scan-hierarchy.ts | ❌ No | ✅ Yes | ⚠️ Partial | ❌ No | ⚠️ Partial |
| save-mem.ts | N/A | N/A | N/A | ⚠️ Partial | ⚠️ Partial |

---

## 4. Configuration Drift Analysis

### Hardcoded Values Requiring Centralization

**In `src/schemas/config.ts`:**
```typescript
// Validation arrays (duplicated from type definitions)
["permissive", "assisted", "strict"]
["en", "vi"]
["beginner", "intermediate", "advanced", "expert"]
["explanatory", "outline", "skeptical", "architecture", "minimal"]
["manual", "guided", "assisted", "full", "coach", "retard"]
```

**In `src/cli/init.ts`:**
```typescript
// Error message strings (5 locations)
"permissive, assisted, strict"
"en, vi"
"beginner, intermediate, advanced, expert"
"explanatory, outline, skeptical, architecture, minimal"
"manual, guided, assisted, full, coach (legacy alias 'retard' is accepted)"
```

**In `src/cli/interactive-init.ts`:**
```typescript
// Prompt options (hardcoded arrays for select/multiselect)
// Lines 28-47: governance modes
// Lines 54-60: languages
// Lines 67-96: automation levels
// Lines 110-134: expert levels
// Lines 142-171: output styles
```

**Risk Assessment:**
- **High:** Adding new option requires 3+ file changes
- **Medium:** Inconsistent error messages between CLI and interactive modes
- **Medium:** "retard" terminology exposed in validation

---

## 5. Code Duplication Metrics

### Duplicate Formatting Logic

**Between recall-mems.ts and list-shelves.ts:**
- **Lines duplicated:** ~45 lines
- **Similarity:** ~85%
- **Pattern:** Both show shelf counts and recent memories

**Shared patterns:**
```typescript
const lines: string[] = [];
lines.push("=== MEMS BRAIN ===");
lines.push("");
lines.push(`Total memories: ${memsState.mems.length}`);
lines.push("");
lines.push("## Shelves");
for (const shelf of BUILTIN_SHELVES) {
  const count = summary[shelf] || 0;
  lines.push(`  ${shelf}: ${count}`);
}
```

**Recommendation:** Extract to CliFormatter or shared utility

### Tool Formatting Pattern Summary

| Tool | Lines of Formatting | Complexity | Duplication |
|------|---------------------|------------|-------------|
| recall-mems.ts | ~85 | Medium | High (with list-shelves) |
| list-shelves.ts | ~65 | Medium | High (with recall-mems) |
| scan-hierarchy.ts | ~180 | High | Medium |
| think-back.ts | ~115 | Medium | Low |
| save-mem.ts | ~5 | Low | Low |

---

## 6. Recommendations

### Immediate Actions (High Priority)

1. **Implement PR #8 Constants**
   - Export constant arrays from config.ts
   - Update validation functions to use constants
   - Update CLI error messages to use `.join(", ")`

2. **Create CliFormatter Utility**
   - Implement claimed but missing utility
   - Document formatting standards
   - Refactor recall-mems and list-shelves first

3. **Remove/Alias "Retard" Terminology**
   - Map "retard" input to "coach" internally
   - Remove from public types/documentation
   - Update error messages

### Short-term Actions (Medium Priority)

4. **Standardize Error Messages**
   - Use consistent prefix (`✗` vs `ERROR:`)
   - Consistent indentation
   - Dynamic valid options from constants

5. **Create CLI Style Guide**
   - Document header/section/list conventions
   - Add to project documentation
   - Enforce via code review

### Long-term Actions (Low Priority)

6. **Refactor All Tools**
   - Apply CliFormatter to all 17 tool files
   - Remove ad-hoc formatting
   - Add visual regression tests

7. **Add Automated Checks**
   - Lint for hardcoded config strings
   - Verify error message formatting
   - Check for code duplication

---

## Summary

**Consistency Score: 3/10**

- ❌ Configuration values hardcoded in 3+ locations
- ❌ CLI output formatting inconsistent across tools
- ❌ Missing claimed utility (CliFormatter)
- ❌ Significant code duplication
- ⚠️ Error message formatting varies
- ⚠️ Inconsistent visual language

**Estimated Effort to Complete:**
- PR #8: 2-3 hours (tests + implementation)
- PR #9: 4-6 hours (utility + refactor 4+ tools)
- Full standardization: 8-10 hours (all 17 tools)
