---
_meta:
  created_at: "2026-03-31T14:00:00Z"
  updated_at: "2026-03-31T14:00:00Z"
  producer: "hivexplorer"
  packet_id: "gap-analysis-artifact-3-2026-03-31"
  source_artifacts:
    - "docs/synthesis/tool-audit-reconciled-2026-03-31.md"
    - "docs/synthesis/legacy-inventory-validated-2026-03-31.md"
  git_commit: "d351aecf8fbd9e8b5871c16fe425cc3c6c27e99e"
  methodology: "direct code inspection of src/tools/, src/features/doc-intelligence/, src/intelligence/doc/ compared against validated legacy artifacts"
---

# Gap Analysis — Legacy vs Current Tool Surface

**Date:** 2026-03-31
**Git Commit:** `d351aecf8fbd9e8b5871c16fe425cc3c6c27e99e`
**Source Artifacts:** tool-audit-reconciled-2026-03-31.md, legacy-inventory-validated-2026-03-31.md

---

## Executive Summary

- **10 capability areas analyzed** — all 10 areas specified in the delegation packet
- **4 REGRESSION** gaps — entire capability modules removed: code-intelligence (18 files, 4,053 LOC), document writing, cross-referencing, and batch operations
- **3 DEGRADED** gaps — document reading (20 actions → 5), format support (markdown-only), safety systems (locking/hashing/chunking removed from doc layer)
- **2 PRESERVED** gaps — Markdown parsing via remark AST, document skim/search/read operations
- **1 REPLACED** gap — tool action surface (20 doc actions → 13 multi-purpose tools with distributed actions)
- **Total legacy LOC in scope:** 9,882 across 34 files vs **current doc+intel LOC:** 394 across 6 files — **96% code reduction** in doc/code intelligence surface

---

## Part A: Capability-by-Capability Comparison

| # | Capability Area | Legacy (verified) | Current (verified) | Gap Status |
|---|----------------|-------------------|-------------------|------------|
| 1 | **Document reading** | 5 read ops: `skimDocument`, `readSection`, `readChunked`, `searchDocuments`, `readMetadata`, `readLines`, `generateTOC`, `listDocuments`, `indexDocuments`, `xrefDocuments`, `contextExtract` (12 exports from read-ops.ts + doc-intel.ts) | 5 read ops: `skimDocument`, `readSection`, `readChunked`, `searchDocuments`, `skimDirectory` (5 exports from read-ops.ts:63-151) | **DEGRADED** |
| 2 | **Document writing** | 10 write ops: `upsertSection`, `writeSection`, `appendSection`, `insertSection`, `deleteSection`, `writeMetadata`, `createDocument`, `batchEdit`, `batchFiles` + `contentHash` (write-ops.ts: 876 LOC) | Zero write operations in doc tool. Tool description explicitly states "read-only" (tools.ts:13). No write-ops.ts exists in current codebase. | **REGRESSION** |
| 3 | **Code intelligence** | 18 code-intel modules: AST surgeon (185 LOC), signature extractor (821 LOC), doc weaver (417 LOC), file scanner (191 LOC), pattern search (191 LOC), tree-sitter loader (374 LOC), compressed codemap (335 LOC), LSP bridge (103 LOC), token counter (95 LOC), incremental updater (258 LOC), plus 8 more supporting modules | Zero code-intel modules. Grep for `ast-surgeon|signature-extractor|code-weaver|tree-sitter|lsp-bridge|token-counter|pattern-search|file-scanner|codemap-io` returns no matches in src/. | **REGRESSION** |
| 4 | **Format support** | 4 format weavers: md.ts (387 LOC, fully implemented), json.ts (54 LOC, stub), xml.ts (54 LOC, stub), yaml.ts (82 LOC, stub). All use remark AST for parsing. | 1 format: md.ts (177 LOC, fully implemented). Uses remark AST. No json.ts, xml.ts, yaml.ts in `src/intelligence/doc/formats/`. | **DEGRADED** |
| 5 | **Cross-referencing** | `xrefDocuments` (read-ops.ts:490), `indexDocuments` (read-ops.ts:564), `listDocuments` (read-ops.ts:430) — all 3 exported and functional in legacy | Zero cross-reference operations. `xrefDocuments`, `indexDocuments`, `listDocuments` not exported from current read-ops.ts. Grep for `xref|cross-refer|backlink` returns only session metadata comments, not document operations. | **REGRESSION** |
| 6 | **Batch operations** | `batchEdit` (write-ops.ts:762), `batchFiles` (write-ops.ts:818) — multi-file batch read/write operations | Zero batch operations. No `batchEdit` or `batchFiles` in current codebase. | **REGRESSION** |
| 7 | **Safety systems** | `proper-lockfile` for file locking (write-ops.ts:18), `atomicWrite` via temp+rename (write-ops.ts:60), SHA-256 content hashing (write-ops.ts:35-41), chunking guard threshold 400 LOC (write-ops.ts:404), governance denylist (safety.ts) | `safePath` for path traversal blocking (safety.ts:5-13), `isMarkdownDocument` for extension validation (safety.ts:16-18). No locking, no atomic writes, no SHA-256 hashing, no chunking guards in doc layer. (Note: `contract-store.crud.ts:10` uses proper-lockfile for contract CRUD only.) | **DEGRADED** |
| 8 | **LSP integration** | `LSPBridge` (lsp-bridge.ts:103 LOC) — symbol resolution, type info, reference finding. Partially consumed by `hivemind-mesh-pull.ts` (outside scope). | Zero LSP integration. No lsp-bridge.ts in current codebase. No `LSPBridge` export anywhere in src/. | **REGRESSION** |
| 9 | **Smart extraction** | `contextExtract` (doc-intel.ts:1547), `inspectCode` (doc-intel.ts:1292), `generateTOC` (doc-intel.ts:858) — context extraction, summary generation, key passage identification | `generateTOC` exists but relocated: `event-tracker/markdown-writer.ts:257` — session-specific TOC generation for events.md only, NOT general-purpose TOC. No `contextExtract` or `inspectCode` anywhere in src/. | **DEGRADED** |
| 10 | **Tool action surface** | Legacy doc tool: 20 actions (skim, read, read_lines, metadata, list, search, inspect, index, xref, context, write, upsert, append, insert, delete, batch, batch_files, set_metadata, create, toc). Plus: codemap (6), hierarchy (3), inspect (5), doc-weaver (1), read-skeleton (1) = **36 total actions across 6 tools** | Current: 13 tools, **48 total action/enum values** distributed across workflow/trajectory/handoff/contract/runtime/journal/doc tools. Doc tool specifically: **5 actions** (skim, skim_directory, read, chunk, search). | **REPLACED** |

---

## Part B: Gap Classification

| # | Capability | Classification | Rationale |
|---|-----------|---------------|-----------|
| 1 | Document writing (10 ops) | **REGRESSION** | All write operations (upsert, write, append, insert, delete, create, writeMetadata, batchEdit, batchFiles) existed in legacy write-ops.ts (876 LOC). Current doc tool is explicitly read-only. No write-ops.ts exists. |
| 2 | Code intelligence (18 modules) | **REGRESSION** | 18 code-intel modules (4,053 LOC verified) provided AST surgery, signature extraction, tree-sitter parsing, file scanning, pattern search, compressed codemap, token counting, incremental updating. Zero equivalent in current src/. |
| 3 | Cross-referencing (3 ops) | **REGRESSION** | `xrefDocuments`, `indexDocuments`, `listDocuments` — all exported from legacy read-ops.ts. None exist in current read-ops.ts (verified: 5 exports only). |
| 4 | Batch operations (2 ops) | **REGRESSION** | `batchEdit`, `batchFiles` — multi-file operations in legacy write-ops.ts. No equivalent in current codebase. |
| 5 | LSP integration | **REGRESSION** | `LSPBridge` (103 LOC) existed in legacy code-intel. No LSP bridge in current src/. |
| 6 | Document reading (12 → 5 ops) | **DEGRADED** | Legacy read-ops.ts exported 12+ functions including readMetadata, readLines, generateTOC, listDocuments, indexDocuments, xrefDocuments, contextExtract. Current read-ops.ts exports only 5 functions: skimDocument, skimDirectory, readSection, readChunked, searchDocuments. Missing: readMetadata, readLines, listDocuments, indexDocuments, xrefDocuments, contextExtract, generateTOC (general-purpose). |
| 7 | Format support (4 → 1 formats) | **DEGRADED** | Legacy had md.ts (full), json.ts (stub), xml.ts (stub), yaml.ts (stub). Current has only md.ts. However, all 3 non-MD format weavers were stubs (all threw `'Not implemented for X format yet'`), so this is a reduction in declared interface only. |
| 8 | Safety systems | **DEGRADED** | Legacy write-ops.ts had proper-lockfile, atomicWrite (temp+rename), SHA-256 hashing, chunking guard (400 LOC threshold). Current safety.ts has only path traversal blocking and extension validation. No file locking, no atomic writes, no content hashing, no chunking guards in doc layer. Note: contract-store.crud.ts uses proper-lockfile independently for contract CRUD. |
| 9 | Smart extraction | **DEGRADED** | Legacy had `contextExtract` (doc-intel.ts:1547), `inspectCode` (doc-intel.ts:1292), `generateTOC` (doc-intel.ts:858). Current has `generateTOC` only in event-tracker/markdown-writer.ts:257 — but session-specific, not general-purpose. No `contextExtract` or `inspectCode`. |
| 10 | Tool action surface | **REPLACED** | Legacy: 36 actions across 6 intelligence tools. Current: 48 actions across 13 workflow/governance tools. The monolithic doc tool (20 actions) was replaced by distributed tool surface focused on different concern areas (workflow management, trajectory, handoff, contracts). The doc tool itself was reduced from 20 to 5 actions. |
| 11 | Markdown parsing | **PRESERVED** | Current md.ts (177 LOC) uses remark + unist-util-visit (md.ts:1-2), same as legacy doc-weaver.ts (imports remark at doc-weaver.ts:1). Heading extraction, section reading, chunking all functional. |
| 12 | Document skim + search | **PRESERVED** | `skimDocument`, `skimDirectory`, `searchDocuments` all present and functional in current read-ops.ts:63-151. Token estimation via `estimateTokens` (md.ts:13-15). |
| 13 | Watch integration | **IRRELEVANT** | Legacy watch-integration.ts (245 LOC) existed but was never wired to any tool (confirmed: zero grep matches outside itself and barrel export). Not needed in current architecture. |
| 14 | Knowledge commits | **IRRELEVANT** | Legacy knowledge-commits.ts (190 LOC) — git-based knowledge state tracking. Functionality superseded by trajectory + journal system in current architecture. |
| 15 | Monolithic doc-intel.ts | **IRRELEVANT** | Legacy doc-intel.ts (1,785 LOC) was a monolithic duplicate of lib/doc-intel/ (confirmed: no imports from lib/doc-intel/). Current architecture properly separates concerns into intelligence/doc/ and features/doc-intelligence/. |

---

## Part C: Migration Complexity — REGRESSION + DEGRADED Gaps Only

| # | Gap | Classification | LOC Impact | Migration Complexity | Key Blockers |
|---|-----|---------------|------------|---------------------|-------------|
| 1 | Document writing (10 ops) | REGRESSION | ~876 LOC (legacy write-ops.ts) | **SIGNIFICANT** | Requires: (1) new write-ops.ts in src/intelligence/doc/, (2) proper-lockfile dependency, (3) atomic write utility, (4) SHA-256 hashing, (5) chunking guard system, (6) governance denylist integration, (7) new write actions added to doc tool schema (currently read-only), (8) feature layer wiring. |
| 2 | Code intelligence (18 modules) | REGRESSION | ~4,053 LOC (legacy code-intel/) | **MAJOR** | Requires: (1) architectural decision on which modules to restore (all 18? subset?), (2) tree-sitter native dependency reintroduction, (3) new tool surface for code-intel operations, (4) integration with current plugin architecture (tool.schema, feature layers), (5) cross-layer impact on hooks, plugin assembly. |
| 3 | Cross-referencing (3 ops) | REGRESSION | ~200 LOC (estimated from read-ops.ts sections) | **MODERATE** | Requires: (1) 3 functions ported from legacy read-ops.ts, (2) adaptation to current read-ops.ts interfaces, (3) new search/xref actions added to doc tool schema, (4) feature layer wiring. |
| 4 | Batch operations (2 ops) | REGRESSION | ~100 LOC (estimated from write-ops.ts sections) | **MODERATE** | Requires: (1) write-ops.ts must exist first (dependency on Gap #1), (2) 2 functions ported, (3) batch actions added to doc tool schema. |
| 5 | LSP integration | REGRESSION | ~103 LOC (lsp-bridge.ts) | **SIGNIFICANT** | Requires: (1) architectural decision on LSP integration approach, (2) LSP client configuration, (3) new tool or tool extension for LSP operations, (4) OpenCode SDK may already provide LSP via client.lsp — need to verify before building custom solution. |
| 6 | Document reading (7 missing ops) | DEGRADED | ~300 LOC (estimated) | **MODERATE** | Requires: (1) readMetadata, readLines ported from legacy read-ops.ts, (2) listDocuments, indexDocuments, xrefDocuments ported (or combined with Gap #3), (3) new actions added to doc tool schema. |
| 7 | Format support (3 stubs) | DEGRADED | ~190 LOC (json+xml+yaml stubs) | **TRIVIAL** | Legacy stubs all threw `'Not implemented for X format yet'`. Direct copy of type definitions and stub throw statements. <50 LOC each. No interface changes needed since current md.ts already demonstrates the format weaver pattern. |
| 8 | Safety systems (4 features) | DEGRADED | ~150 LOC (estimated) | **MODERATE** | Requires: (1) proper-lockfile integration in doc layer (already a dependency via contract-store), (2) atomicWrite utility (pattern exists in event-tracker/consolidated-writer.ts:95), (3) SHA-256 hashing (crypto.createHash), (4) chunking guard threshold. |
| 9 | Smart extraction (2 ops + general TOC) | DEGRADED | ~400 LOC (estimated from doc-intel.ts sections) | **SIGNIFICANT** | Requires: (1) `contextExtract` ported from doc-intel.ts:1547 — complex extraction logic, (2) `inspectCode` ported from doc-intel.ts:1292 — code inspection requires code-intel dependency (Gap #2), (3) general-purpose `generateTOC` (current one is session-specific). |

---

## Raw Evidence

### Files Inspected (Current Codebase)

| # | File | Lines Read | Purpose |
|---|------|-----------|---------|
| 1 | `src/tools/doc/tools.ts` | 1-35 | Verify doc tool schema — 5 actions, read-only |
| 2 | `src/tools/index.ts` | 1-137 | Verify tool catalog — 12 registered tools |
| 3 | `src/features/doc-intelligence/doc.ts` | 1-102 | Verify feature layer — dispatches 5 actions |
| 4 | `src/features/doc-intelligence/index.ts` | 1 (barrel) | Verify export |
| 5 | `src/intelligence/doc/index.ts` | 1-3 | Verify exports — 3 modules only |
| 6 | `src/intelligence/doc/read-ops.ts` | 1-151 | Verify read operations — 5 exports |
| 7 | `src/intelligence/doc/formats/md.ts` | 1-177 | Verify markdown format — remark AST, full |
| 8 | `src/intelligence/doc/safety.ts` | 1-22 | Verify safety — path traversal + extension only |
| 9 | `src/intelligence/doc/doc-surface-router.ts` | 1-39 | Verify doc surface routing |
| 10 | `src/intelligence/doc/types.ts` | 1-29 | Verify type definitions |
| 11 | `src/features/event-tracker/markdown-writer.ts` | 250-289 | Verify session-specific generateTOC |
| 12 | `src/features/agent-work-contract/engine/contract-store.crud.ts` | 10 (import) | Verify proper-lockfile usage in contract layer |

### Files Inspected (Legacy Archive)

| # | File | Verification | Evidence |
|---|------|-------------|----------|
| 1 | `.archive/legacy-src-20260314-140720/lib/doc-intel/read-ops.ts` | 12 exports verified | read-ops.ts exports: skimDocument, skimDirectory, readSection, readChunked, readMetadata, readLines, generateTOC, searchDocuments, listDocuments, xrefDocuments, indexDocuments |
| 2 | `.archive/legacy-src-20260314-140720/lib/doc-intel/write-ops.ts` | 11 exports verified | write-ops.ts exports: contentHash, generateOpId, upsertSection, writeSection, appendSection, insertSection, deleteSection, writeMetadata, createDocument, batchEdit, batchFiles |
| 3 | `.archive/legacy-src-20260314-140720/lib/code-intel/index.ts` | 50+ exports verified | All 18 modules exported: ASTSurgeon, DocWeaver, LSPBridge, extractSignatures, etc. |
| 4 | `.archive/legacy-src-20260314-140720/lib/doc-intel/formats/md.ts` | 387 LOC, full implementation | Confirmed by validated artifact |
| 5 | `.archive/legacy-src-20260314-140720/lib/doc-intel/formats/json.ts` | 54 LOC, stub | All write ops throw `'Not implemented for JSON format yet'` |
| 6 | `.archive/legacy-src-20260314-140720/lib/doc-intel/formats/xml.ts` | 54 LOC, stub | All write ops throw `'Not implemented for XML format yet'` |
| 7 | `.archive/legacy-src-20260314-140720/lib/doc-intel/formats/yaml.ts` | 82 LOC, stub | All write ops throw `'Not implemented for YAML format yet'` |
| 8 | `.archive/legacy-src-20260314-140720/tools/hivemind-doc.ts` | 911 LOC, 20 actions | Confirmed by validated artifact |
| 9 | `.archive/legacy-src-20260314-140720/tools/` | 22 tool files total | 6 in scope for this analysis (doc, doc-weaver, inspect, read-skeleton, codemap, hierarchy) |

### Grep Evidence (Current Codebase)

| Pattern | Result | Interpretation |
|---------|--------|---------------|
| `ast-surgeon|signature-extractor|code-weaver|tree-sitter|lsp-bridge|token-counter|pattern-search|file-scanner|codemap-io|compressed-codemap|secret-detector|binary-detector|gitignore-filter|incremental-updater|knowledge-commits|watch-integration|selective-injector` in `src/` | Zero matches | No code-intel modules in current codebase |
| `write-ops|upsertSection|writeSection|appendSection|insertSection|deleteSection|createDocument|batchEdit|batchFiles` in `src/` | 0 doc-related matches; 3 in contract-store (different concern) | No document write operations |
| `contextExtract` in `src/` | Zero matches | No context extraction |
| `xref|cross-refer|backlink` in `src/` | 4 matches in hook comments only | No document cross-referencing operations |
| `inspectCode` in `src/` | Zero matches | No code inspection |
| `remark|unist-util-visit` in `src/` | 2 matches in `src/intelligence/doc/formats/md.ts` | remark used only for read operations, not write |

### Input Artifacts Used

| Artifact | Path | Lines |
|----------|------|-------|
| Tool Audit Reconciled | `docs/synthesis/tool-audit-reconciled-2026-03-31.md` | 112 |
| Legacy Inventory Validated | `docs/synthesis/legacy-inventory-validated-2026-03-31.md` | 243 |
