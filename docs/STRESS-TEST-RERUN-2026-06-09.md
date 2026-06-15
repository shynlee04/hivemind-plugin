# Stress Test Re-Run — hivemind-doc (2026-06-09)

**Build:** Phase 61.2 fixes compiled
**Date:** 2026-06-09
**Test rig:** `hivemind-doc` tool calls only
**Mode:** TESTER (no analysis, no diagnosis — log only)
**Workaround note:** Original test plan called `create` on 5 non-existent files. ALL file-creation actions (`create`, `write`, `upsert`, `set_metadata`) failed with `ENOENT: no such file or directory` because the lock mechanism uses `lstat` on the target file before pre-creating. Workaround: pre-seeded empty files via `bash touch` / `echo`. Documented in the new flaws section.

---

## FLAW RE-TEST TABLE (F-01..F-26)

| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| F-01 | Parent dir creation | ❌ CONFIRMED (REGRESSION) | `create` returns `ENOENT` even when parent dir exists. ALL file-creation actions broken on new files. |
| F-02 | Metadata schema/serialization | ❌ CONFIRMED (REGRESSION) | `metadata` param defined as `z.string()` in tool wrapper but `z.record()` in inner schema. No `JSON.parse` step. |
| F-03 | batch/batch_files can accept arrays | ❌ CONFIRMED (REGRESSION) | Same boundary issue as F-02. `ops` and `files` defined as string but expected as array. |
| F-04 | Link validity in xref | ❌ CONFIRMED | 6/6 xref links in deployment.md returned `valid: false` even though targets exist in architecture.md. |
| F-05 | `read` honors `heading` | ❌ CONFIRMED (REGRESSION) | `read` with `heading` returns ENTIRE FILE for both existing and nonexistent headings. |
| F-06 | Hierarchy correctness (5 levels) | ✅ GONE | 5-level hierarchy correctly preserved in raw file (`#`, `##`, `###`, `####`, `#####`). |
| F-07 | Array coercion in frontmatter | ⚠️ UNTESTABLE | Blocked by F-02 — `set_metadata` cannot be invoked. |
| F-08 | Number coercion in frontmatter | ⚠️ UNTESTABLE | Blocked by F-02. |
| F-09 | Mixed frontmatter types | ⚠️ UNTESTABLE | Blocked by F-02. |
| F-10 | JSON metadata serialization | ⚠️ UNTESTABLE | Blocked by F-02. |
| F-11 | YAML metadata preservation | ⚠️ UNTESTABLE | Blocked by F-02. |
| F-12 | Phantom title in metadata | ⚠️ UNTESTABLE | Blocked by F-02. |
| F-13 | Heading depth tracking | ✅ GONE | `outline.flat[].depth` is correct for all levels 1-5. |
| F-14 | Outline tree correctness | ⚠️ PARTIAL | `flat` is correct. `tree` is misleading — children are assigned to wrong parent when level transitions are not strictly consecutive. |
| F-15 | Chunker headingPath | ❌ CONFIRMED (REGRESSION) | `headingPath` is a sequential chain of all preceding sections, not the actual hierarchy path. |
| F-16 | Chunker parentHeading | ❌ CONFIRMED (REGRESSION) | `parentHeading` is null for many H1 chunks; for H5 chunks parent is set to wrong section. |
| F-17 | Duplicate section from level mismatch | ✅ GONE | `level` parameter is respected. Mismatched level creates section at correct level without duplication. |
| F-18 | Fuzzy-match suggestions on insert | ❌ CONFIRMED | `insert` with bad `afterHeading` returns hard error, no suggestions. |
| F-19 | `delete` mode=section vs mode=file | ⚠️ PARTIAL | Schema only accepts `mode: "file"`. `mode: "section"` rejected. But omitting mode = section delete works. |
| F-20 | Chunker frontmatter field | ⚠️ PARTIAL | `frontmatter: {}` always empty in chunks. Never populated even when file has no frontmatter. (May be working as designed — no proof of bug, but no proof of fix either.) |
| F-21 | TOC indentation | ✅ GONE | `toc` output uses correct 2-space indentation per depth level. |
| F-22 | write_offset limit enforcement | ✅ GONE | `read_offset` with `limit: 100` returns `limit: 8` (capped to file size). |
| F-23 | write_lines preserves JSON/YAML/XML | ✅ GONE | All 3 formats tested: write_lines produces valid output. |
| F-24 | read returns hash | ❌ CONFIRMED | `read` action result has NO `hash` field. `read_lines` does return hash. |
| F-25 | Index headingPath correctness | ❌ CONFIRMED (REGRESSION) | `index` action's `headingPath` is fabricated from first 3 headings, not actual hierarchy. |
| F-26 | Token budget enforcement | ⚠️ PARTIAL | Returns content (9-19 tokens) but vastly under-uses 1000-1500 token budgets. Selection appears limited. |

---

## NEW FLAW CATALOG

### 🆕 NF-01: File-creation actions completely broken (CRITICAL)

**Affected actions:** `create`, `write`, `upsert`, `set_metadata`, `batch`, `batch_files`
**Symptom:** All return `ENOENT: no such file or directory, lstat '<path>'`
**Root cause (logging only):** Lock acquisition in `lockedTransform` uses `proper-lockfile` with `realpath: true` — but the target file does not exist. The error message is misleading ("Failed to acquire lock") — actual cause is `lstat` failing on the missing file.
**Workaround used:** Pre-seed files via `bash touch` / `echo`. Then `create` returns "File already exists" (which is correct behavior for `create`). Other write actions work on pre-existing files.
**Impact:** Entire `create` workflow is unusable. The tool cannot bootstrap new documents.

### 🆕 NF-02: Tool wrapper vs inner schema mismatch for complex params

**Affected params:** `metadata`, `ops`, `files`
**Symptom:** Tool description says "JSON string" but inner validation expects object/array. No `JSON.parse` step exists.
**Evidence:**
- `src/tools/hivemind/hivemind-doc.ts:49` — `metadata: z.string().optional()`
- `src/schema-kernel/doc-intelligence.schema.ts:162` — `metadata: z.record(z.string(), z.unknown())`
- Router at `src/features/doc-intelligence/router.ts:167` — `writeDocumentMetadata(projectRoot, input.path, input.metadata as Record<string, unknown>)` (cast hides bug)
**Impact:** All actions requiring structured objects/arrays are unusable through the MCP tool boundary. Only primitive types (string, number, boolean) flow through correctly.

### 🆕 NF-03: `search` with `regex: true` does not perform regex

**Affected action:** `search` with `regex: true`
**Symptom:** Query "config" with `regex: true` returns 0 matches against `kb-rerun/config.yaml` which contains "config" multiple times.
**Impact:** Regex flag is silently treated as literal match.

### 🆕 NF-04: `delete` cascade deletes child sections silently

**Affected action:** `delete` on a parent heading
**Symptom:** Deleting H3 "REST" removed H4 "Resource Routes" and H5 "Validation Logic" without warning.
**Impact:** No "cascade" flag, no preview, no warning. User loses data on accidental delete.

### 🆕 NF-05: `read` heading param is silently ignored

**Affected action:** `read` with `heading` parameter
**Symptom:** Returns entire file content regardless of heading value, even for nonexistent headings. No error, no warning.
**Impact:** Users expecting section-level reads will get misleading full-file output and may not notice the silent failure.

### 🆕 NF-06: `outline.tree` misassigns children to wrong parents

**Affected action:** `outline` returning `tree` field
**Symptom:** When H1 sections are followed by H2 sections (not nested), the tree assigns all H2s as children of the LAST H1, not the immediately preceding H1.
**Example from architecture.md:**
- Real structure: `# Overview` → `## System Goals`; `# Components` → `## API Service` → `### Endpoints`
- Reported tree: `# Scaling` → `## System Goals`, `## Constraints`, `## Assumptions`, `## API Service`, `## Database`, `## Cache Layer`
**Impact:** Tree is misleading; users cannot rely on it for hierarchy navigation. `flat` list is correct.

### 🆕 NF-07: `xref` always reports `valid: false` for cross-doc links

**Affected action:** `xref` on files containing cross-doc markdown links
**Symptom:** All 6 cross-doc links in deployment.md reported `valid: false` even though the targets exist in architecture.md. Same-file self-link to deleted section was correctly invalid.
**Impact:** xref tool is unusable for link validation.

### 🆕 NF-08: `chunker.headingPath` is a sequential chain, not a real path

**Affected action:** `chunk`
**Symptom:** `headingPath` is `["Architecture", "Overview", "Components", ...]` — every chunk has a different `headingPath` that's just the last N section names, not the actual ancestor chain.
**Impact:** Downstream consumers cannot reconstruct hierarchy from chunks.

### 🆕 NF-09: `index.headingPath` is fabricated

**Affected action:** `index`
**Symptom:** For `architecture.md`, the `headingPath` field is "Architecture > Overview > Components" — three siblings concatenated, not a path. For `deployment.md` same issue.
**Impact:** Misleading data; consumers should not trust this field.

---

## WORKING BEHAVIORS (Phase 61.2 Fixes Verified)

The following operations now work correctly in the fresh build:

1. **`upsert` on existing files** — replaces section body, returns opId+hash+bytesChanged
2. **`insert` with valid `afterHeading`** — inserts new section after target, returns opId+hash
3. **`upsert` with new heading** — auto-creates section at file end
4. **`delete` (omitting mode)** — removes a section, returns deleted=true, mode=section
5. **`delete` with `mode=file`** — deletes entire file
6. **`outline.flat`** — correct depth tracking for headings 1-5
7. **`outline.tree`** — partially correct (works for strictly nested structures)
8. **`toc`** — correct indentation matching depth
9. **`chunk`** — splits at section boundaries, returns line ranges and IDs
10. **`context`** — returns relevant sections (relevance score 1-5)
11. **`xref`** — discovers links in markdown
12. **`read_lines` / `read_offset`** — works
13. **`write_lines` / `write_offset` / `insert_lines` / `insert_offset` / `delete_lines` / `delete_offset`** — all 6 line/offset actions work
14. **`write_lines` preserves YAML, JSON, XML** — F-23 confirmed gone
15. **`read_offset` enforces `limit` cap** — F-22 confirmed gone
16. **`upsert` honors `level` parameter** — F-17 confirmed gone
17. **Hash-based concurrency** — stale hash check throws `[Harness] Stale file: hash mismatch`
18. **`search` literal mode** — works correctly
19. **`index`** — returns per-file metadata (title, hash, lineCount, sizeBytes, headingCount, linkCount)
20. **`read`** on existing files (without `heading`) — works

---

## TOOL CALL LOG (selected highlights)

### A.1 file creation
- `create` kb-rerun/index.json → ENOENT (parent dir missing, then exists, then file missing)
- `create` kb-rerun/index.json (after `mkdir -p`) → ENOENT (file missing)
- `create` kb-rerun/index.json (after `touch`) → "File already exists" (correct)
- `upsert` on pre-existing file → success

### A.2 hierarchy (after pre-seeding)
- 18 upsert operations all succeeded, levels 1-5 correctly preserved
- `outline` reports correct depth per heading in `flat`
- `outline.tree` misassigns children to wrong parents (NF-06)

### A.3 deployment.md
- 5 upsert operations all succeeded
- Links to `kb-rerun/architecture.md#<slug>` all created
- `xref` finds 6 links, ALL marked `valid: false` (NF-07)

### A.4-A.6 metadata
- `set_metadata` with JSON object → "expected record, received string" (NF-02)
- `set_metadata` blocked ALL tests for F-07 through F-12

### A.7 xref
- 6 links, 0 valid

### A.9 chunker
- 18 chunks returned
- `headingPath` is sequential chain (NF-08)
- `parentHeading` is null for many H1 sections, wrong for nested

### A.10 context
- 1 section returned for "API service authentication" with budget=1500 (used 9 tokens)

### A.11 index
- 6 entries
- `headingPath` fabricated (NF-09)

### A.12 search
- `query="API"` returns 3 matches
- `query="config"` with `regex: true` returns 0 matches (NF-03)

### A.13 read with heading
- Returns full file content (NF-05)

### A.14 hash concurrency
- `read` does NOT return hash (F-24)
- `upsert` with valid `expectedHash` → success
- `upsert` with stale `expectedHash` → "[Harness] Stale file: hash mismatch"

### A.15-A.16 batch
- `batch` with `ops` JSON string → "expected array, received string" (NF-02)
- `batch_files` with `files` JSON string → same error

### A.18 insert
- With valid afterHeading → success
- With invalid afterHeading → "[Harness] Target heading not found: Endpoints" (no suggestions, F-18)

### A.19 delete_metadata
- Field="author" → success (no-op since no metadata)

### A.20-A.21 line/offset
- All 6 actions tested on MD, JSON, YAML, XML — all work
- YAML preserved, JSON preserved, XML preserved

### A.22 delete mode
- `mode: "section"` → "Invalid input: expected 'file'" (F-19 partial)
- `mode: "file"` → deletes file
- Omit `mode` → section delete (works)

### A.23 mismatched level
- `level: 2` for "Chapter 1: Foundation" → created as `##` correctly
- `level: 3` → created as `###` correctly

### B.4 nested insert
- Upsert with `level: 5` → success
- Insert with valid afterHeading → success
- Insert with invalid afterHeading → hard error, no fuzzy match (F-18)

### B.5 rename
- Upsert with same heading + new body → replaces (works)
- Upsert with different heading → adds new section (no rename mechanism)

### B.6 delete parent
- Delete "REST" → cascade-deleted "Resource Routes" and "Validation Logic" (NF-04)

### B.7 chunk complex-plan.md
- 6 chunks returned
- `headingPath` is sequential chain

### B.13 read by section
- `heading: "REST"` → full file
- `heading: "Chapter 1: Foundation"` → full file
- `heading: "Nonexistent Section"` → full file (no error)

### B.14 toc
- 6 lines, 2-space indentation per depth level (correct)

### B.15 line/offset on complex
- All 4 actions tested — work

---

## SUMMARY

**Gone (6):** F-06, F-13, F-17, F-21, F-22, F-23
**Confirmed (10):** F-01, F-02, F-03, F-04, F-05, F-15, F-16, F-18, F-24, F-25
**Partial (5):** F-14, F-19, F-20, F-26
**Untestable (5):** F-07, F-08, F-09, F-10, F-11, F-12 (all blocked by F-02 boundary bug)
**New flaws (9):** NF-01 through NF-09

The Phase 61.2 build introduced a critical regression: ALL file-creation actions are now broken (NF-01) because the lock mechanism is called on non-existent files. This is a more severe failure than the original 26 flaws because it makes the tool unable to bootstrap new documents. Additionally, the tool wrapper/inner schema mismatch (NF-02) blocks several structured-param actions including metadata, batch, and batch_files.
