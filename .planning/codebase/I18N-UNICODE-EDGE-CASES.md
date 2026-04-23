# I18N & Unicode Edge Case Analysis

**Analysis Date:** 2026-04-23
**Focus:** Unicode content handling in file paths, comments, task payloads, and mapping tools

## Executive Summary

The hivemind-plugin (`opencode-harness`) source code at `src/` contains **no explicit Unicode/i18n handling** — no normalization, no charset validation, no non-ASCII test fixtures. The codebase relies entirely on Node.js/V8's default UTF-8 behavior for all string operations. This is correct for most cases but has specific edge-case risks documented below.

The specific test strings from the task (`"hlavní modul"`, `"résumé"`, `"über"`, `"日本語テスト"`, `"中文测试"`, `"Ñoño"`, `"café"`, `"naïve"`) were **NOT found** in `src/` source or `tests/` directories. They exist only in reference documentation from OpenCode's platform (`repomix-opencode.md`), not in harness code.

---

## Unicode Pattern Locations Found

### Reference Documentation (NOT source code)

| Pattern | File | Line | Context |
|---------|------|------|---------|
| `café.txt` | `.hivefiver-meta-builder/skills-lab/active/refactoring/opencode-platform-reference/references/repomix-opencode.md` | 362811 | OpenCode snapshot test fixture for unicode filenames |
| `über`, accented | Same file (de/dt translations) | Various | German locale strings in OpenCode UI translations |
| `résumé` | Not found anywhere | — | — |
| `日本語テスト` | Not found anywhere | — | — |
| `中文测试` | Not found (but `文件.txt` used in same test as `café.txt`) | 362809 | Chinese filename in OpenCode snapshot test |
| `Ñoño` | Not found anywhere | — | — |
| `naïve` | Not found anywhere | — | — |
| `hlavní modul` | Not found anywhere | — | — |

### Source Code Unicode Touchpoints

| File | Line | Pattern | Risk |
|------|------|---------|------|
| `src/lib/continuity.ts` | 225, 269 | `readFileSync(path, "utf8")` / `writeFileSync(tmpFile, ..., "utf8")` | Low — Node.js handles UTF-8 natively |
| `src/lib/delegation-persistence.ts` | 21, 91 | `writeFileSync(..., "utf-8")` / `readFileSync(..., "utf-8")` | Low — same |
| `src/tools/session-patch/tools.ts` | 49 | `readFileSync(args.sessionFilePath, "utf-8")` | Low — reads user-provided path |
| `src/tools/prompt-skim/tools.ts` | 40 | `pathRegex = /(?:^|\s)(\.\/[\w./-]+|[\w./-]+\.\w+)/gm` | **HIGH** — `\w` does NOT match non-ASCII chars |
| `src/tools/session-patch/tools.ts` | 56 | `new RegExp(...escapedSection...)` | Medium — section heading could contain non-ASCII |
| `src/lib/helpers.ts` | 151 | `left.localeCompare(right)` | Low — `localeCompare` handles Unicode correctly |
| `src/tools/prompt-analyze/tools.ts` | 12-15 | `ABSOLUTE_RE`, `VAGUE_RE`, `MISSING_SCOPE_RE` | Low — English-only patterns, Unicode text passes through |
| `src/lib/command-delegation.ts` | 178-181 | `child.stdout.on("data", (chunk: Buffer \| string))` | Low — PTY output encoding depends on system locale |

---

## Specific Risks

### 1. Path Regex in `prompt-skim` — Non-ASCII Filenames Excluded

**File:** `src/tools/prompt-skim/tools.ts:40`
**Pattern:** `/(?:^|\s)(\.\/[\w./-]+|[\w./-]+\.\w+)/gm`

**Problem:** The character class `[\w./-]` only matches `[a-zA-Z0-9_./-]`. Filenames containing:
- Accented characters (`café.txt`, `résumé.pdf`)
- CJK characters (`文件.txt`, `日本語.md`)
- Cyrillic (`файл.txt`)
- Emoji (`🚀rocket.txt`)

...will NOT be detected as paths by the skim tool. They will be silently dropped from the `paths` and `verifiedPaths` arrays.

**Impact:** When a prompt references non-ASCII filenames, the skim tool reports `path_count: 0` for those paths, and `verifiedPaths` will not include them. The complexity score may be understated.

**Fix:** Replace `[\w./-]` with a Unicode-aware pattern:
```typescript
// Option A: Unicode property escapes (ES2018+)
const pathRegex = /(?:^|\s)(\.\/[\p{L}\p{N}._/-]+|[\p{L}\p{N}._/-]+\.\p{L}\p{N})/gmu

// Option B: Broaden character class
const pathRegex = /(?:^|\s)(\.\/[^\s<>"{}|\\^`[\]]+|[^\s<>"{}|\\^`[\]]+\.[^\s<>"{}|\\^`[\]]+)/gm
```

### 2. Section Heading Regex in `session-patch` — Non-ASCII Headings

**File:** `src/tools/session-patch/tools.ts:52-58`
**Pattern:** Dynamic regex built from `args.section`

**Problem:** The section heading is escaped with `[.*+?^${}()|[\]\\]` but not tested against non-ASCII content. If a session file contains a heading like `## Riesgos Identificados` or `## リスク分析`, the regex will:
1. Match the heading (no regex metacharacters in these strings)
2. Search for `## <heading>` in the file content
3. This should work correctly since `RegExp` in V8 handles Unicode

**Assessment:** Low risk — JavaScript `RegExp` is Unicode-aware by default in V8. The escaped pattern preserves all non-ASCII characters. However, combining characters (e.g., `é` as `e` + combining acute accent) could cause mismatches if the file uses NFC and the input uses NFD form.

**Fix (if needed):** Apply NFC normalization before matching:
```typescript
const normalized = args.section.normalize("NFC")
```

### 3. JSON Persistence — UTF-8 Encoding Consistency

**Files:**
- `src/lib/continuity.ts:225,269` — uses `"utf8"`
- `src/lib/delegation-persistence.ts:21,91` — uses `"utf-8"`

**Observation:** Both `"utf8"` and `"utf-8"` are valid aliases in Node.js `fs` methods. They resolve to the same encoding. No risk.

**Potential concern:** If delegation records contain non-ASCII agent names (e.g., an agent named `"Ñoño-builder"`), `JSON.stringify` will produce valid UTF-8 JSON. `JSON.parse` will read it back correctly. No issue.

### 4. `stableStringify` — `localeCompare` Unicode Ordering

**File:** `src/lib/helpers.ts:151`

```typescript
const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
```

**Observation:** `localeCompare` without explicit locale uses the runtime's default locale. This means:
- On different systems, the sort order of keys containing non-ASCII characters may differ
- The "stable" in `stableStringify` refers to deterministic serialization, but it's locale-dependent for non-ASCII keys

**Impact:** Low — harness object keys are all ASCII (`id`, `status`, `agent`, etc.). Non-ASCII keys would only appear if the OpenCode SDK returns them.

### 5. PTY Output Encoding

**File:** `src/lib/command-delegation.ts:178-181`

```typescript
child.stdout.on("data", (chunk: Buffer | string) => {
```

**Observation:** PTY output encoding depends on the system locale (`LANG`, `LC_ALL`). If a spawned command produces non-UTF-8 output (e.g., Latin-1 on older systems), the chunk may contain mojibake.

**Impact:** Medium — delegation output containing non-ASCII text from PTY sessions may be garbled if the system locale doesn't match UTF-8.

### 6. `prompt-analyze` — English-Only Pattern Matching

**File:** `src/tools/prompt-analyze/tools.ts:12-15`

```typescript
const ABSOLUTE_RE = /\b(MUST|NEVER|ALWAYS|REQUIRED|FORBIDDEN|DO NOT)\b/i
const VAGUE_RE = /\b(some|various|etc\.?|somehow|maybe|perhaps|things|stuff)\b/i
```

**Observation:** All analysis patterns are English-only. Non-English prompts pass through without any analysis findings. The `\b` word boundary works correctly with ASCII but may produce unexpected results with some Unicode characters.

**Impact:** Low by design — the tool is English-focused. Non-English prompts will get `clarity_score: 100` (no findings detected), which could be misleading.

---

## Verification: Mapping Tool Unicode Handling

### Grep Tool
- ✅ Successfully found `café.txt` across all files
- ✅ Successfully found German accented text (`überprüfen`, `überschritten`, etc.) — 824 total matches
- ✅ Successfully found French accented text (`résumé` via `résumés` in translations)
- ✅ File paths with non-ASCII characters are returned correctly in results

### Glob Tool
- Not tested (no non-ASCII filenames exist in `src/`)
- The `.hivefiver-meta-builder/` archive directories use ASCII-only names

### Read Tool
- ✅ Successfully read the repomix file at line 362811 containing `café.txt` and `文件.txt`
- ✅ Non-ASCII content in file bodies is preserved correctly

### Write Tool
- Uses UTF-8 encoding by default — non-ASCII content written to files will be correctly encoded

---

## Recommendations

| Priority | Issue | Fix |
|----------|-------|-----|
| **High** | `prompt-skim` path regex excludes non-ASCII filenames | Use `\p{L}\p{N}` Unicode property escapes with `u` flag |
| **Medium** | PTY output encoding not validated | Detect `LANG`/`LC_ALL` and warn if not UTF-8 |
| **Low** | `session-patch` NFC normalization | Add `.normalize("NFC")` for defensive matching |
| **Low** | `stableStringify` locale-dependent sort | Specify explicit locale: `left.localeCompare(right, "en")` |
| **Low** | No i18n test coverage | Add test fixtures with non-ASCII strings to `tests/` |

---

## Where to Add Unicode/I18N Tests

**Test locations:**
- `tests/tools/prompt-skim.test.ts` — Add test case with non-ASCII file paths
- `tests/tools/session-patch.test.ts` — Add test case with non-ASCII section headings
- `tests/lib/continuity.test.ts` — Add test case with non-ASCII string values in store
- `tests/lib/delegation-persistence.test.ts` — Add test case with non-ASCII agent names

**Fixture pattern (from OpenCode's own test):**
```typescript
const unicodePaths = [
  { path: "文件.txt", content: "chinese content" },
  { path: "🚀rocket.txt", content: "emoji content" },
  { path: "café.txt", content: "accented content" },
  { path: "файл.txt", content: "cyrillic content" },
]
```

---

*Unicode/i18n edge case analysis: 2026-04-23*
